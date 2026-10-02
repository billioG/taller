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

-- Evita interbloqueos (deadlock) si la app está en uso mientras se ejecuta este script:
-- se toman los bloqueos de las dos tablas en el MISMO orden que usan las políticas
-- (estado_sala primero, sala_claves después) y se mantienen hasta el final.
-- Si hay mucho tráfico, espera hasta 60 s en lugar de fallar.
set local lock_timeout = '60s';
lock table public.estado_sala in access exclusive mode;
lock table public.sala_claves in access exclusive mode;

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

-- PIN de participantes: lo fija el facilitador y lo teclean los docentes para entrar.
-- Si la sala no tiene PIN (null), la entrada es libre.
alter table public.sala_claves add column if not exists pin_part text;

create or replace function public.pin_part_ok(p_sala text, p_pin text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select coalesce(
    (select c.pin_part is null or c.pin_part = btrim(coalesce(p_pin, ''))
       from public.sala_claves c where c.sala = p_sala),
    true)
$$;

-- 'abierto' (sin PIN) | 'ok' | 'mal'
create or replace function public.pin_part_verificar(p_sala text, p_pin text)
returns text
language sql stable security definer
set search_path = public, extensions
as $$
  select case
    when not exists (select 1 from public.sala_claves c where c.sala = p_sala) then 'abierto'
    when (select c.pin_part from public.sala_claves c where c.sala = p_sala) is null then 'abierto'
    when public.pin_part_ok(p_sala, p_pin) then 'ok'
    else 'mal' end
$$;

create or replace function public.pin_part_fijar(p_sala text, p_clave text, p_pin text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  if p_pin is not null and p_pin !~ '^[A-Za-z0-9]{4,12}$' then
    raise exception 'pin_formato' using errcode = 'P0001';
  end if;
  update public.sala_claves set pin_part = p_pin where sala = p_sala;
end $$;

create or replace function public.pin_part_leer(p_sala text, p_clave text)
returns text
language plpgsql stable security definer
set search_path = public, extensions
as $$
declare r text;
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  select pin_part into r from public.sala_claves where sala = p_sala;
  return r;
end $$;

revoke all on function public.pin_part_ok(text, text)                 from public;
revoke all on function public.pin_part_verificar(text, text)          from public;
revoke all on function public.pin_part_fijar(text, text, text)        from public;
revoke all on function public.pin_part_leer(text, text)               from public;
grant execute on function public.pin_part_verificar(text, text)       to anon, authenticated;
grant execute on function public.pin_part_fijar(text, text, text)     to anon, authenticated;
grant execute on function public.pin_part_leer(text, text)            to anon, authenticated;

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
drop function if exists public.piso_actualizar(text, text, text, text);
create or replace function public.piso_actualizar(
  p_sala text, p_nombre text, p_estado text, p_clave text default null, p_pin text default null
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
  if not es_fac and not public.pin_part_ok(p_sala, p_pin) then
    raise exception 'pin_invalido' using errcode = 'P0001';
  end if;

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
revoke all on function public.piso_actualizar(text, text, text, text, text)    from public;
revoke all on function public.clave_valida(text, text)                   from public;
revoke all on function public.clave_de_cabecera()                        from public;
revoke all on function public.fijar_clave(text, text)                    from public, anon, authenticated;

grant execute on function public.crear_sala(text, text)                  to anon, authenticated;
grant execute on function public.verificar_clave(text, text)             to anon, authenticated;
grant execute on function public.piso_actualizar(text, text, text, text, text) to anon, authenticated;
grant execute on function public.clave_valida(text, text)                to anon, authenticated;
grant execute on function public.clave_de_cabecera()                     to anon, authenticated;

-- --------------------------------------------------------------------------
-- 8. Encuestas en vivo y frase final (nube de palabras)
-- --------------------------------------------------------------------------
alter table public.estado_sala add column if not exists encuesta      jsonb;
alter table public.estado_sala add column if not exists frases_estado jsonb not null default '{}';

alter table public.estado_sala drop constraint if exists encuesta_tamano;
alter table public.estado_sala add  constraint encuesta_tamano
  check (encuesta is null or pg_column_size(encuesta) <= 8000) not valid;
alter table public.estado_sala drop constraint if exists frases_estado_tamano;
alter table public.estado_sala add  constraint frases_estado_tamano
  check (pg_column_size(frases_estado) <= 500) not valid;

alter table public.estado_sala add column if not exists materiales_abiertos text[] not null default '{}';
alter table public.estado_sala drop constraint if exists materiales_abiertos_tamano;
alter table public.estado_sala add  constraint materiales_abiertos_tamano
  check (cardinality(materiales_abiertos) <= 40) not valid;

-- Un voto por participante y encuesta (puede cambiarlo mientras esté abierta).
create table if not exists public.encuesta_votos (
  sala    text not null,
  poll_id text not null,
  voter   text not null,
  opcion  int  not null check (opcion between 0 and 9),
  primary key (sala, poll_id, voter)
);
alter table public.encuesta_votos enable row level security;
revoke all on public.encuesta_votos from anon, authenticated;

-- Una frase por participante.
create table if not exists public.frases (
  id      bigint generated always as identity primary key,
  sala    text not null,
  voter   text not null,
  texto   text not null check (char_length(texto) between 1 and 140),
  creada  timestamptz not null default now(),
  unique (sala, voter)
);
alter table public.frases enable row level security;
revoke all on public.frases from anon, authenticated;

-- Votar: valida que la encuesta esté abierta y recalcula los conteos.
drop function if exists public.encuesta_votar(text, text, text, int);
create or replace function public.encuesta_votar(
  p_sala text, p_poll text, p_voter text, p_opcion int, p_pin text default null
) returns public.estado_sala
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  enc jsonb;
  n   int;
  fila public.estado_sala;
begin
  if not public.pin_part_ok(p_sala, p_pin) then
    raise exception 'pin_invalido' using errcode = 'P0001';
  end if;
  if p_voter is null or char_length(p_voter) not between 6 and 64 then
    raise exception 'votante_invalido' using errcode = 'P0001';
  end if;
  select encuesta into enc from public.estado_sala where sala = p_sala for update;
  if not found or enc is null or enc ->> 'id' is distinct from p_poll then
    raise exception 'encuesta_inexistente' using errcode = 'P0001';
  end if;
  if coalesce((enc ->> 'abierta')::boolean, false) is not true then
    raise exception 'encuesta_cerrada' using errcode = 'P0001';
  end if;
  n := jsonb_array_length(enc -> 'opciones');
  if p_opcion is null or p_opcion < 0 or p_opcion >= n then
    raise exception 'opcion_invalida' using errcode = 'P0001';
  end if;

  insert into public.encuesta_votos (sala, poll_id, voter, opcion)
    values (p_sala, p_poll, p_voter, p_opcion)
  on conflict (sala, poll_id, voter) do update set opcion = excluded.opcion;

  update public.estado_sala set
    encuesta = jsonb_set(encuesta, '{conteos}', (
      select coalesce(jsonb_agg(coalesce(c.n, 0) order by g.i), '[]'::jsonb)
      from generate_series(0, n - 1) as g(i)
      left join (
        select opcion, count(*)::int as n
        from public.encuesta_votos
        where sala = p_sala and poll_id = p_poll
        group by opcion
      ) c on c.opcion = g.i
    )),
    actualizado = now()
  where sala = p_sala
  returning * into fila;
  return fila;
end $$;

-- Enviar (o reemplazar) mi frase; solo mientras el facilitador la tenga abierta.
drop function if exists public.frase_enviar(text, text, text);
create or replace function public.frase_enviar(p_sala text, p_voter text, p_texto text, p_pin text default null)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  est jsonb;
  t   text := btrim(regexp_replace(coalesce(p_texto, ''), '\s+', ' ', 'g'));
begin
  if not public.pin_part_ok(p_sala, p_pin) then
    raise exception 'pin_invalido' using errcode = 'P0001';
  end if;
  if p_voter is null or char_length(p_voter) not between 6 and 64 then
    raise exception 'votante_invalido' using errcode = 'P0001';
  end if;
  if char_length(t) not between 1 and 140 then
    raise exception 'frase_invalida' using errcode = 'P0001';
  end if;
  select frases_estado into est from public.estado_sala where sala = p_sala;
  if not found then raise exception 'sala_inexistente' using errcode = 'P0001'; end if;
  if coalesce((est ->> 'abierta')::boolean, false) is not true then
    raise exception 'frases_cerradas' using errcode = 'P0001';
  end if;
  if (select count(*) from public.frases where sala = p_sala) >= 500
     and not exists (select 1 from public.frases where sala = p_sala and voter = p_voter) then
    raise exception 'frases_llenas' using errcode = 'P0001';
  end if;
  insert into public.frases (sala, voter, texto) values (p_sala, p_voter, t)
  on conflict (sala, voter) do update set texto = excluded.texto, creada = now();
end $$;

-- Leer las frases de la sala (para la imagen). No expone el id del votante.
create or replace function public.frases_leer(p_sala text)
returns table (id bigint, texto text)
language sql stable security definer
set search_path = public, extensions
as $$
  select f.id, f.texto from public.frases f
  where f.sala = p_sala order by f.id limit 500
$$;

-- Moderación (solo con la clave del facilitador)
create or replace function public.frase_borrar(p_sala text, p_id bigint, p_clave text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  delete from public.frases where sala = p_sala and id = p_id;
end $$;

create or replace function public.frases_limpiar(p_sala text, p_clave text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  delete from public.frases where sala = p_sala;
end $$;

-- Abrir/cerrar la encuesta sin pisar los conteos (los votos llegan en paralelo).
create or replace function public.encuesta_estado(p_sala text, p_clave text, p_abierta boolean)
returns public.estado_sala
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  fila public.estado_sala;
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  update public.estado_sala
    set encuesta = jsonb_set(encuesta, '{abierta}', to_jsonb(p_abierta)), actualizado = now()
  where sala = p_sala and encuesta is not null
  returning * into fila;
  if not found then raise exception 'encuesta_inexistente' using errcode = 'P0001'; end if;
  return fila;
end $$;

revoke all on function public.encuesta_estado(text, text, boolean) from public;
grant execute on function public.encuesta_estado(text, text, boolean) to anon, authenticated;

-- Preguntas de respuesta libre: cada participante escribe su respuesta (una por pregunta).
create table if not exists public.respuestas (
  id      bigint generated always as identity primary key,
  sala    text not null,
  poll_id text not null,
  voter   text not null,
  texto   text not null check (char_length(texto) between 1 and 200),
  creada  timestamptz not null default now(),
  unique (sala, poll_id, voter)
);
alter table public.respuestas enable row level security;
revoke all on public.respuestas from anon, authenticated;

drop function if exists public.respuesta_enviar(text, text, text, text);
create or replace function public.respuesta_enviar(p_sala text, p_poll text, p_voter text, p_texto text, p_pin text default null)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  enc jsonb;
  t   text := btrim(regexp_replace(coalesce(p_texto, ''), '\s+', ' ', 'g'));
begin
  if not public.pin_part_ok(p_sala, p_pin) then
    raise exception 'pin_invalido' using errcode = 'P0001';
  end if;
  if p_voter is null or char_length(p_voter) not between 6 and 64 then
    raise exception 'votante_invalido' using errcode = 'P0001';
  end if;
  if char_length(t) not between 1 and 200 then
    raise exception 'respuesta_invalida' using errcode = 'P0001';
  end if;
  select encuesta into enc from public.estado_sala where sala = p_sala;
  if not found or enc is null or enc ->> 'id' is distinct from p_poll or enc ->> 'tipo' is distinct from 'abierta' then
    raise exception 'encuesta_inexistente' using errcode = 'P0001';
  end if;
  if coalesce((enc ->> 'abierta')::boolean, false) is not true then
    raise exception 'encuesta_cerrada' using errcode = 'P0001';
  end if;
  if (select count(*) from public.respuestas where sala = p_sala and poll_id = p_poll) >= 300
     and not exists (select 1 from public.respuestas where sala = p_sala and poll_id = p_poll and voter = p_voter) then
    raise exception 'frases_llenas' using errcode = 'P0001';
  end if;
  insert into public.respuestas (sala, poll_id, voter, texto) values (p_sala, p_poll, p_voter, t)
  on conflict (sala, poll_id, voter) do update set texto = excluded.texto, creada = now();
end $$;

create or replace function public.respuestas_leer(p_sala text, p_poll text)
returns table (id bigint, texto text)
language sql stable security definer
set search_path = public, extensions
as $$
  select r.id, r.texto from public.respuestas r
  where r.sala = p_sala and r.poll_id = p_poll order by r.id limit 300
$$;

create or replace function public.respuesta_borrar(p_sala text, p_id bigint, p_clave text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.clave_valida(p_sala, p_clave) then
    raise exception 'no_permitido' using errcode = 'P0001';
  end if;
  delete from public.respuestas where sala = p_sala and id = p_id;
end $$;

revoke all on function public.respuesta_enviar(text, text, text, text, text) from public;
revoke all on function public.respuestas_leer(text, text)               from public;
revoke all on function public.respuesta_borrar(text, bigint, text)      from public;
grant execute on function public.respuesta_enviar(text, text, text, text, text) to anon, authenticated;
grant execute on function public.respuestas_leer(text, text)               to anon, authenticated;
grant execute on function public.respuesta_borrar(text, bigint, text)      to anon, authenticated;

revoke all on function public.encuesta_votar(text, text, text, int, text) from public;
revoke all on function public.frase_enviar(text, text, text, text)         from public;
revoke all on function public.frases_leer(text)                       from public;
revoke all on function public.frase_borrar(text, bigint, text)        from public;
revoke all on function public.frases_limpiar(text, text)              from public;
grant execute on function public.encuesta_votar(text, text, text, int, text) to anon, authenticated;
grant execute on function public.frase_enviar(text, text, text, text)         to anon, authenticated;
grant execute on function public.frases_leer(text)                       to anon, authenticated;
grant execute on function public.frase_borrar(text, bigint, text)        to anon, authenticated;
grant execute on function public.frases_limpiar(text, text)              to anon, authenticated;

-- ==========================================================================
-- ÚLTIMO PASO (obligatorio si migraste): cambia el PIN.
-- El PIN anterior ("YoAprendo26") estuvo en el repositorio público y debe
-- considerarse comprometido. Descomenta, pon el tuyo (mínimo 8 caracteres) y
-- ejecuta SOLO esa línea:
--
--   select public.fijar_clave('taller-1', 'PON-AQUI-TU-PIN-NUEVO');
-- ==========================================================================
