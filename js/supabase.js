/* ==========================================================================
   Taller de Scratch · Cliente de Supabase
   --------------------------------------------------------------------------
   Usa el cliente oficial (supabase-js) desde el CDN de esm.sh. Solo dos cosas:
   una tabla `estado_sala` y un canal de presencia por sala.

   Si SUPABASE_URL / SUPABASE_ANON_KEY no están rellenados, la app arranca en
   MODO LOCAL: todo funciona, pero cada quien navega por su cuenta y no hay
   sincronización en vivo. Sirve para probar sin configurar nada.

   Configuración paso a paso en ../README.md
   ========================================================================== */

const CFG = {
  url: 'https://pjnvhdxytjxbaiwvlylj.supabase.co',        // Project URL de Supabase
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnZoZHh5dGp4YmFpd3ZseWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDI4OTMsImV4cCI6MjEwNjM3ODg5M30.lotSgYcgFJH2OqbkXje7NyaLpZh3ura2kDkDxHYMjns',    // anon public key
};

const SB_LISTO =
  /^https?:\/\//.test(CFG.url) &&
  /^https?:\/\//.test(CFG.anonKey) &&
  !CFG.url.includes('PEGAR_AQUI');

let sb = null;

// Cabecera personalizada: la lee la política RLS "escribir con clave correcta".
const HDR_CLAVE = 'x-taller-clave';

async function initSupabase() {
  if (!SB_LISTO) return null;
  const mod = await import('https://esm.sh/@supabase/supabase-js@2');
  sb = mod.createClient(CFG.url, CFG.anonKey);
  return sb;
}

const TABLA = 'estado_sala';

/** Lee el estado de una sala. Devuelve null si todavía no existe. */
async function leerEstado(sala) {
  const { data, error } = await sb
    .from(TABLA)
    .select('*')
    .eq('sala', sala)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Crea la fila de la sala. La clave queda guardada para validar escrituras. */
async function crearEstado(sala, clave, patch = {}) {
  const fila = {
    sala,
    clave,
    seccion_actual: 's1',
    mensaje: '',
    iniciado: false,
    ...patch,
  };
  const { data, error } = await sb.from(TABLA).insert(fila).select().single();
  if (error) throw error;
  return data;
}

/**
 * Guarda cambios.
 *
 * La clave viaja en la cabecera x-taller-clave. La política RLS de la tabla
 * compara esa cabecera con la columna clave DENTRO de Postgres: si no
 * coinciden, la escritura se rechaza aunque el cliente use la clave pública.
 * El `.eq('clave', clave)` es solo una ayuda; la seguridad real es la política.
 */
async function guardarEstado(sala, clave, patch) {
  const res = await fetch(CFG.url + '/rest/v1/' + TABLA + '?sala=eq.' + encodeURIComponent(sala), {
    method: 'PATCH',
    headers: {
      apikey: CFG.anonKey,
      Authorization: 'Bearer ' + CFG.anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      [HDR_CLAVE]: clave, // <- la política RLS compara esta cabecera
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Rechazado: ' + res.status + ' ' + txt);
  }
  const data = await res.json();
  if (!data || !data.length) {
    throw new Error('No se pudo guardar: la clave de facilitador no coincide.');
  }
  return data[0];
}

/**
 * Canal en vivo de una sala.
 * - `alEstado` recibe la fila cuando el facilitador avanza de sección.
 * - `alPresencia` recibe el arreglo de nombres conectados, en vivo.
 */
function suscribir(sala, nombreDocente, alEstado, alPresencia, alCambiarConexion) {
  const canal = sb
    .channel('sala:' + sala, {
      config: { presence: { key: String(Date.now()) + Math.random().toString(36).slice(2, 8) } },
    })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLA, filter: 'sala=eq.' + sala },
      (payload) => {
        if (payload.eventType !== 'DELETE' && payload.new) alEstado(payload.new);
      }
    )
    .on('presence', { event: 'sync' }, () => {
      const estado = canal.presenceState();
      const nombres = [];
      for (const clave in estado) {
        const regs = estado[clave];
        if (regs && regs.length && regs[0].nombre) nombres.push(regs[0].nombre);
      }
      alPresencia(nombres);
    })
    .on('presence', { event: 'join' }, () => {
      alCambiarConexion && alCambiarConexion(true);
    })
    .subscribe(async (estatus) => {
      if (estatus === 'SUBSCRIBED') {
        await canal.track({ nombre: nombreDocente, desde: Date.now() });
        if (alCambiarConexion) alCambiarConexion(true);
      }
    });

  return canal;
}