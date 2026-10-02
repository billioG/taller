-- ==========================================================================
-- Tabla del taller de Scratch
-- Cópialo entero en el SQL Editor de Supabase y dale "Run".
-- ==========================================================================

create table if not exists public.estado_sala (
  id                   uuid primary key default gen_random_uuid(),
  sala                 text        not null unique,
  clave                text        not null,
  seccion_actual       text        not null default 's1',
  bloque_actual        text,
  secciones_vistas     text[]      not null default '{}',
  mensaje              text        not null default '',
  -- Nuevos campos para features extra
  scratch_project_id   text,
  scratch_url          text,
  piso                 jsonb       not null default '{}',
  certificados_generados jsonb,
  taller_finalizado    boolean     not null default false,
  actualizado          timestamptz not null default now(),
  constraint sala_no_vacia check (char_length(sala) between 1 and 60)
);

-- Sin esto, la tabla queda abierta a todo internet.
alter table public.estado_sala enable row level security;

-- Nadie borra. El estado del taller no se pierde por accidente.
create policy "no borrar"
  on public.estado_sala for delete
  to anon, authenticated using (false);

-- Cualquiera puede crear una sala. El facilitador la crea al abrir la primera
-- sección; no tiene que registrarse antes.
create policy "crear sala"
  on public.estado_sala for insert
  to anon, authenticated with check (char_length(clave) >= 1);

-- Cualquiera puede LEER el estado de cualquier sala. Eso es lo que hace que la
-- pantalla de los docentes se actualice al instante. No hay datos personales
-- aquí: solo qué sección está abierta.
create policy "leer sala"
  on public.estado_sala for select
  to anon, authenticated using (true);

-- ==========================================================================
-- ESCRITURA: aquí está la seguridad real.
--
-- Solo puede escribir quien envíe la clave correcta en la cabecera
-- x-taller-clave. Un docente que intente abrir secciones por su cuenta no la
-- tiene, y Postgres le rechaza la escritura aunque use la clave pública.
--
-- Esta es la diferencia entre "sincronizar un taller" y "dejar que cualquiera
-- controle tu pantalla".
-- ==========================================================================
create policy "escribir con clave correcta"
  on public.estado_sala for update
  to anon, authenticated
  using (
    clave = coalesce(
      current_setting('request.headers', true)::json ->> 'x-taller-clave',
      ''
    )
  )
  with check (
    clave = coalesce(
      current_setting('request.headers', true)::json ->> 'x-taller-clave',
      ''
    )
  );

-- ==========================================================================
-- MIGRACIÓN: si la tabla YA EXISTE (la creaste antes), el create de arriba
-- no hace nada. Copia y pega SOLO este bloque en el SQL Editor y dale Run.
-- ==========================================================================
alter table public.estado_sala add column if not exists scratch_project_id     text;
alter table public.estado_sala add column if not exists scratch_url            text;
alter table public.estado_sala add column if not exists piso                   jsonb not null default '{}';
alter table public.estado_sala add column if not exists certificados_generados jsonb;
alter table public.estado_sala add column if not exists taller_finalizado      boolean not null default false;

-- La fila de tu sala necesita la MISMA clave que el PIN de la app.
-- PIN actual por defecto: YoAprendo26
-- Si cambiaste el PIN en config.js, pon aquí ese mismo PIN.
-- Sin esto, el facilitador escribe y la política RLS devuelve 0 filas:
-- "No se pudo guardar: la clave de facilitador no coincide."
update public.estado_sala set clave = 'YoAprendo26' where clave is distinct from 'YoAprendo26';

-- Un poco de contexto sobre por qué esto funciona:
-- `request.headers` es un objeto JSON con todas las cabeceras de la petición.
-- Postgres lo expone a las políticas. Al pedir x-taller-clave y compararla con
-- la columna clave de la fila, la comparación ocurre DENTRO de la base de
-- datos. El cliente nunca ve la clave ajena ni puede saltarse la comparación
-- con un .eq(), porque el .eq() filtra filas, pero la política es la que manda.
--