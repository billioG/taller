-- ==========================================================================
-- Taller de Scratch · esquema de la base de datos (v2, seguro)
--
-- Pégalo ENTERO en el SQL Editor de Supabase y dale "Run".
-- Es idempotente: sirve para una instalación nueva y para migrar la anterior.
--
-- Modelo de seguridad
--   · estado_sala        → estado público del taller. Cualquiera lo LEE.
--                           Nadie escribe directo salvo con la clave correcta.
--   · sala_claves        → hash bcrypt de la clave de cada sala. Ningún rol
--                           de la API (anon/authenticated) puede leerla.
--   · Funciones RPC      → crear sala, verificar clave y mover el "piso".
-- La clave NUNCA se guarda en texto plano ni se puede leer desde el navegador.
-- ==========================================================================

create extension if not exists pgcrypto with schema extensions;

-- --------------------------------------------------------------------------
-- 1. Tablas
-- --------------------------------------------------------------------------
create table if not exists public.estado_sala (
  id                     uuid primary key default gen_random_uuid(),
  sala                   text        not null unique,
  seccion_actual         text        not null default 's1',
  bloque_actual          text,
  secciones_vistas       text[]      not null default '{}',
  mensaje                text        not null default '',
  scratch_project_id     text,
  scratch_url            text,
  piso                   jsonb       not null default '{}',
  certificados_generados jsonb,
  taller_finalizado      boolean     not null default false,
  actualizado            timestamptz not null default now(),
  constraint sala_no_vacia check (char_length(sala) between 1 and 60)
);

-- Columnas que pudieron faltar en instalaciones antiguas
alter table public.estado_sala add column if not exists scratch_project_id     text;
alter table public.estado_sala add column if not exists scratch_url            text;
alter table public.estado_sala add column if not exists piso                   jsonb not null default '{}';
alter table public.estado_sala add column if not exists certificados_generados jsonb;
alter table public.estado_sala add column if not exists taller_finalizado      boolean not null default false;

create table if not exists public.sala_claves (
  sala       text primary key references public.estado_sala(sala) on delete cascade,
  clave_hash text not null
);

-- --------------------------------------------------------------------------
-- 2. Migración desde la versión anterior (columna `clave` en texto plano)
--    Se conserva el PIN actual convertido a hash y se elimina la columna.
--    ¡Rota el PIN después! (ver al final: fijar_clave)
-- --------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'estado_sala' and column_name = 'clave'
  ) then
    execute $m$
      insert into public.sala_claves (sala, clave_hash)
      select sala, extensions.crypt(clave, extensions.gen_salt('bf', 10))
      from public.estado_sala
      on conflict (sala) do nothing
    $m$;
  end if;
end $$;

-- Las políticas antiguas dependen de la columna: se quitan antes de borrarla.
drop policy if exists "no borrar"                   on public.estado_sala;
drop policy if exists "crear sala"                  on public.estado_sala;
drop policy if exists "leer sala"                   on public.estado_sala;
drop policy if exists "escribir con clave correcta" on public.estado_sala;
alter table public.estado_sala drop column if exists clave;

-- --------------------------------------------------------------------------
-- 3. Límites de tamaño (evitan que alguien llene la tabla de basura)
--    "not valid" = no revisa filas viejas, sí valida todo lo nuevo.
-- --------------------------------------------------------------------------
alter table public.estado_sala drop constraint if exists mensaje_corto;
alter table public.estado_sala add  constraint mensaje_corto
  check (char_length(mensaje) <= 200) not valid;

alter table public.estado_sala drop constraint if exists scratch_id_valido;
alter table public.estado_sala add  constraint scratch_id_valido
  check (scratch_project_id is null or scratch_project_id ~ '^[0-9]{1,20}$') not valid;

alter table public.estado_sala drop constraint if exists piso_tamano;
alter table public.estado_sala add  constraint piso_tamano
  check (jsonb_typeof(piso) = 'object' and pg_column_size(piso) <= 20000) not valid;

alter table public.estado_sala drop constraint if exists certificados_tamano;
alter table public.estado_sala add  constraint certificados_tamano
  check (certificados_generados is null or pg_column_size(certificados_generados) <= 200000) not valid;

-- --------------------------------------------------------------------------
-- 4. Funciones auxiliares
-- --------------------------------------------------------------------------

-- Clave que llega en la cabecera x-taller-clave de la petición.
create or replace function public.clave_de_cabecera()
returns text
language sql stable
as $$
  select coalesce(current_setting('request.headers', true)::json ->> 'x-taller-clave', '')
$$;

-- ¿Esta clave es la de la sala? Se compara contra el hash, dentro de Postgres.
create or replace function public.clave_valida(p_sala text, p_clave text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.sala_claves c
    where c.sala = p_sala
      and c.clave_hash = extensions.crypt(coalesce(p_clave, ''), c.clave_hash)
  )
$$;

-- --------------------------------------------------------------------------
-- 5. Row Level Security
-- --------------------------------------------------------------------------
alter table public.estado_sala enable row level security;
alter table public.sala_claves enable row level security;

-- Cualquiera LEE el estado (así se actualiza la pantalla de los docentes).
-- Ya no hay datos secretos en esta tabla.
create policy "leer sala"
  on public.estado_sala for select
  to anon, authenticated using (true);

-- Solo escribe quien manda la clave correcta en la cabecera x-taller-clave.
create policy "escribir con clave correcta"
  on public.estado_sala for update
  to anon, authenticated
  using      (public.clave_valida(sala, public.clave_de_cabecera()))
  with check (public.clave_valida(sala, public.clave_de_cabecera()));

-- No hay política de INSERT ni de DELETE: nadie crea ni borra filas directo.
-- sala_claves no tiene ninguna política: invisible para la API.
revoke all on public.sala_claves from anon, authenticated;
revoke insert, delete, truncate on public.estado_sala from anon, authenticated;

-- --------------------------------------------------------------------------
-- 6. Funciones RPC que usa la app
-- --------------------------------------------------------------------------

-- Crea una sala nueva con su clave. Falla si ya existe (no se puede "robar").
create or replace function public.crear_sala(p_sala text, p_clave text)
returns public.estado_sala
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  fila public.estado_sala;
begin
  if p_sala is null or p_sala !~ '^[a-z0-9][a-z0-9_-]{0,59}$' then
    raise exception 'sala_invalida' using errcode = 'P0001';
  end if;
  if p_clave is null or char_length(p_clave) < 8 or char_length(p_clave) > 72 then
    raise exception 'clave_corta' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.estado_sala where sala = p_sala) then
    raise exception 'sala_existente' using errcode = 'P0001';
  end if;

  insert into public.estado_sala (sala) values (p_sala) returning * into fila;
  insert into public.sala_claves (sala, clave_hash)
    values (p_sala, extensions.crypt(p_clave, extensions.gen_salt('bf', 10)));
  return fila;
end $$;

-- Para la puerta del facilitador: 'ok' | 'mal' | 'no_sala'
create or replace function public.verificar_clave(p_sala text, p_clave text)
returns text
language plpgsql stable security definer
set search_path = public, extensions
as $$
begin
  if not exists (select 1 from public.estado_sala where sala = p_sala) then
    return 'no_sala';
  end if;
  return case when public.clave_valida(p_sala, p_clave) then 'ok' else 'mal' end;
end $$;

-- Piso / palabra. Lo usan docentes (sin clave) y facilitador (con clave).
--   Docente   : puede pedir la palabra, aceptar una invitación o soltarla,
--               solo en su propia entrada.
--   Facilitador: cualquier estado (invitar, conceder, quitar…).
create or replace function public.piso_actualizar(
  p_sala text, p_nombre text, p_estado text, p_clave text default null
) returns public.estado_sala
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  es_fac   boolean;
  actual   text;
  fila     public.estado_sala;
begin
  if p_nombre is null or char_length(btrim(p_nombre)) not between 1 and 30 then
    raise exception 'nombre_invalido' using errcode = 'P0001';
  end if;
  if p_estado not in ('nada','solicitando','concedido','invitado','aceptado') then
    raise exception 'estado_invalido' using errcode = 'P0001';
  end if;

  es_fac := p_clave is not null and public.clave_valida(p_sala, p_clave);

  select piso -> p_nombre ->> 'estado' into actual
  from public.estado_sala where sala = p_sala for update;
  if not found then
    raise exception 'sala_inexistente' using errcode = 'P0001';
  end if;

  if not es_fac then
    if p_estado = 'solicitando' and coalesce(actual, 'nada') not in ('nada','solicitando') then
      raise exception 'no_permitido' using errcode = 'P0001';
    elsif p_estado = 'aceptado' and actual is distinct from 'invitado' then
      raise exception 'no_permitido' using errcode = 'P0001';
    elsif p_estado in ('concedido','invitado') then
      raise exception 'no_permitido' using errcode = 'P0001';
    end if;
  end if;

  update public.estado_sala set
    piso = case
      when p_estado = 'nada' then piso - p_nombre
      else jsonb_set(piso, array[p_nombre], jsonb_build_object(
             'estado', p_estado,
             'desde', (extract(epoch from clock_timestamp()) * 1000)::bigint), true)
    end,
    actualizado = now()
  where sala = p_sala
  returning * into fila;

  return fila;
end $$;

-- Solo el SQL Editor (postgres) puede fijar/rotar claves. Úsalo así:
--   select public.fijar_clave('taller-1', 'TU-PIN-NUEVO');
create or replace function public.fijar_clave(p_sala text, p_clave text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if p_clave is null or char_length(p_clave) < 8 or char_length(p_clave) > 72 then
    raise exception 'La clave debe tener entre 8 y 72 caracteres';
  end if;
  if lower(p_clave) in ('yoaprendo26', 'tu-pin-nuevo', 'cambia_este_pin') then
    raise exception 'Esa clave es pública o de ejemplo; elige otra';
  end if;
  if not exists (select 1 from public.estado_sala where sala = p_sala) then
    raise exception 'La sala % no existe', p_sala;
  end if;
  insert into public.sala_claves (sala, clave_hash)
    values (p_sala, extensions.crypt(p_clave, extensions.gen_salt('bf', 10)))
  on conflict (sala) do update set clave_hash = excluded.clave_hash;
end $$;

-- --------------------------------------------------------------------------
-- 7. Permisos de ejecución
-- --------------------------------------------------------------------------
revoke all on function public.crear_sala(text, text)                     from public;
revoke all on function public.verificar_clave(text, text)                from public;
revoke all on function public.piso_actualizar(text, text, text, text)    from public;
revoke all on function public.clave_valida(text, text)                   from public;
revoke all on function public.clave_de_cabecera()                        from public;
revoke all on function public.fijar_clave(text, text)                    from public, anon, authenticated;

grant execute on function public.crear_sala(text, text)                  to anon, authenticated;
grant execute on function public.verificar_clave(text, text)             to anon, authenticated;
grant execute on function public.piso_actualizar(text, text, text, text) to anon, authenticated;
grant execute on function public.clave_valida(text, text)                to anon, authenticated;
grant execute on function public.clave_de_cabecera()                     to anon, authenticated;

-- ==========================================================================
-- ÚLTIMO PASO (obligatorio si migraste): cambia el PIN.
-- El PIN anterior ("YoAprendo26") estuvo en el repositorio público y debe
-- considerarse comprometido. Descomenta, pon el tuyo (mínimo 8 caracteres) y
-- ejecuta SOLO esa línea:
--
--   select public.fijar_clave('taller-1', 'PON-AQUI-TU-PIN-NUEVO');
-- ==========================================================================
