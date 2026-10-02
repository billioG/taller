/* ==========================================================================
   Taller de Scratch · Cliente de Supabase
   --------------------------------------------------------------------------
   Usa supabase-js incluido en /vendor (sin depender de CDN en tiempo de
   ejecución). Una tabla `estado_sala`, funciones RPC y un canal por sala.

   Si SUPABASE_URL / SUPABASE_ANON_KEY no están rellenados, la app arranca en
   MODO LOCAL: todo funciona, pero cada quien navega por su cuenta y no hay
   sincronización en vivo. Sirve para probar sin configurar nada.

   La anon key es PÚBLICA por diseño: la seguridad está en las políticas RLS y
   funciones de supabase.sql, no en ocultar esta clave.
   ========================================================================== */

const CFG = {
  url: 'https://pjnvhdxytjxbaiwvlylj.supabase.co',        // Project URL de Supabase
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnZoZHh5dGp4YmFpd3ZseWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDI4OTMsImV4cCI6MjEwNjM3ODg5M30.lotSgYcgFJH2OqbkXje7NyaLpZh3ura2kDkDxHYMjns',    // anon public key
};

// La anonKey es un JWT (empieza con "eyJ..."), NO una URL: se valida por largo.
const SB_LISTO =
  /^https?:\/\//.test(CFG.url) &&
  typeof CFG.anonKey === 'string' &&
  CFG.anonKey.length > 20 &&
  !CFG.url.includes('PEGAR_AQUI') &&
  !CFG.anonKey.includes('PEGAR_AQUI');

let sb = null;

// Cabecera personalizada: la lee la política RLS "escribir con clave correcta".
const HDR_CLAVE = 'x-taller-clave';

const TABLA = 'estado_sala';

/** Traduce los errores técnicos de Postgres a mensajes entendibles. */
function mensajeError(e) {
  const m = String((e && (e.message || e.details)) || e || '');
  if (m.includes('clave_corta')) return 'El PIN debe tener al menos 8 caracteres.';
  if (m.includes('sala_invalida')) return 'El código de sala no es válido.';
  if (m.includes('sala_existente')) return 'La sala ya existe.';
  if (m.includes('sala_inexistente')) return 'La sala todavía no existe.';
  if (m.includes('no_permitido')) return 'Acción no permitida en este momento.';
  if (m.includes('pin_invalido')) return 'El PIN de la sala no es correcto. Vuelve a entrar con el PIN.';
  if (m.includes('pin_formato')) return 'El PIN debe tener de 4 a 12 letras o números.';
  if (m.includes('schema cache') || m.includes('PGRST202') || m.includes('PGRST204')) return 'Falta actualizar la base de datos: ejecuta supabase.sql completo en el SQL Editor de Supabase.';
  if (m.includes('encuesta_cerrada')) return 'La votación ya está cerrada.';
  if (m.includes('encuesta_inexistente')) return 'Esa encuesta ya no está activa.';
  if (m.includes('opcion_invalida')) return 'Opción no válida.';
  if (m.includes('frases_cerradas')) return 'El facilitador aún no abre las frases.';
  if (m.includes('respuesta_invalida')) return 'Escribe entre 1 y 200 caracteres.';
  if (m.includes('frase_invalida')) return 'Escribe entre 1 y 140 caracteres.';
  if (m.includes('frases_llenas')) return 'Ya se recibieron todas las frases posibles.';
  if (m.includes('votante_invalido')) return 'No se pudo identificar tu navegador. Recarga la página.';
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) return 'Sin conexión con el servidor.';
  return m || 'Error desconocido';
}

async function initSupabase() {
  if (!SB_LISTO || sb) return sb;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    const msg = 'No se pudo cargar la librería de Supabase';
    setConexion('mal', msg);
    throw new Error(msg);
  }
  sb = window.supabase.createClient(CFG.url, CFG.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return sb;
}

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

/** Crea la sala con su PIN (hash en el servidor). Falla si ya existe. */
async function crearEstado(sala, clave) {
  const { data, error } = await sb.rpc('crear_sala', { p_sala: sala, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
  return data;
}

/** Comprueba el PIN en el servidor: 'ok' | 'mal' | 'no_sala'. */
async function verificarClave(sala, clave) {
  const { data, error } = await sb.rpc('verificar_clave', { p_sala: sala, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
  return data;
}

/** Piso/palabra: transición atómica en el servidor (clave solo si es facilitador). */
async function pisoActualizar(sala, nombre, estado, clave) {
  const { data, error } = await sb.rpc('piso_actualizar', {
    p_sala: sala,
    p_nombre: nombre,
    p_estado: estado,
    p_clave: clave || null,
    p_pin: pinParticipante() || null,
  });
  if (error) throw new Error(mensajeError(error));
  return data;
}

/**
 * Guarda cambios (solo facilitador).
 *
 * La clave viaja en la cabecera x-taller-clave. La política RLS de la tabla
 * la compara contra el hash DENTRO de Postgres: si no coincide, la escritura
 * se rechaza aunque el cliente use la clave pública.
 */
async function guardarEstado(sala, clave, patch) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  let res;
  try {
    res = await fetch(CFG.url + '/rest/v1/' + TABLA + '?sala=eq.' + encodeURIComponent(sala), {
      method: 'PATCH',
      headers: {
        apikey: CFG.anonKey,
        Authorization: 'Bearer ' + CFG.anonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        [HDR_CLAVE]: clave, // <- la política RLS compara esta cabecera
      },
      body: JSON.stringify({ ...patch, actualizado: new Date().toISOString() }),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'El servidor tardó demasiado en responder.' : mensajeError(e));
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    let det = '';
    try { det = await res.text(); } catch {}
    if (det.includes('schema cache') || det.includes('PGRST204') || det.includes('does not exist')) throw new Error(mensajeError('schema cache'));
    throw new Error('El servidor rechazó el cambio (' + res.status + ').');
  }
  const data = await res.json();
  if (!data || !data.length) {
    throw new Error('No se pudo guardar: el PIN de facilitador no coincide o la sala no existe.');
  }
  return data[0];
}

/**
 * Canal en vivo de una sala. Usa Broadcast + Presence.
 *
 * - `alAviso` se llama cuando alguien avisa que el estado cambió. El payload
 *   NO se usa (cualquiera puede enviar broadcasts falsos): quien recibe el
 *   aviso relee el estado real desde la base de datos.
 * - `alPresencia` recibe el arreglo de nombres conectados, en vivo.
 */
function suscribir(sala, nombreDocente, alAviso, alPresencia, alCambiarConexion, alPintura, alListo) {
  const canal = sb
    .channel('sala:' + sala, {
      config: {
        broadcast: { self: false },
        presence: { key: String(Date.now()) + Math.random().toString(36).slice(2, 8) },
      },
    })
    .on('broadcast', { event: 'estado' }, () => alAviso())
    .on('broadcast', { event: 'pintura' }, ({ payload }) => { if (alPintura) alPintura(payload); })
    .on('broadcast', { event: 'listo' }, ({ payload }) => { if (alListo) alListo(payload); })
    .on('presence', { event: 'sync' }, () => {
      const estado = canal.presenceState();
      const nombres = [];
      for (const k in estado) {
        const regs = estado[k];
        if (regs && regs.length) {
          for (const r of regs) {
            if (r && typeof r.nombre === 'string' && r.nombre) nombres.push(r.nombre.slice(0, 30));
          }
        }
      }
      alPresencia(nombres);
    })
    .subscribe(async (estatus) => {
      if (estatus === 'SUBSCRIBED') {
        try {
          await canal.track({ nombre: (nombreDocente || 'Docente').slice(0, 30), desde: Date.now() });
        } catch {}
        if (alCambiarConexion) alCambiarConexion(true);
      }
      if (estatus === 'CHANNEL_ERROR' || estatus === 'TIMED_OUT' || estatus === 'CLOSED') {
        if (alCambiarConexion) alCambiarConexion(false);
      }
    });

  return canal;
}

/** Avisa a todos al instante que el estado cambió (ellos releen la base). */
async function emitirEstado(canal) {
  if (!canal) return;
  try {
    await canal.send({ type: 'broadcast', event: 'estado', payload: { t: Date.now() } });
  } catch {}
}

/** Votar en la encuesta activa. Devuelve el estado con conteos nuevos. */
async function votarEncuesta(sala, poll, voter, opcion) {
  const { data, error } = await sb.rpc('encuesta_votar', { p_sala: sala, p_poll: poll, p_voter: voter, p_opcion: opcion, p_pin: pinParticipante() || null });
  if (error) throw new Error(mensajeError(error));
  return data;
}

/** Facilitador: abrir/cerrar la encuesta sin pisar los votos. */
async function encuestaEstado(sala, clave, abierta) {
  const { data, error } = await sb.rpc('encuesta_estado', { p_sala: sala, p_clave: clave, p_abierta: abierta });
  if (error) throw new Error(mensajeError(error));
  return data;
}

async function enviarFrase(sala, voter, texto) {
  const { error } = await sb.rpc('frase_enviar', { p_sala: sala, p_voter: voter, p_texto: texto, p_pin: pinParticipante() || null });
  if (error) throw new Error(mensajeError(error));
}

async function leerFrases(sala) {
  const { data, error } = await sb.rpc('frases_leer', { p_sala: sala });
  if (error) throw new Error(mensajeError(error));
  return Array.isArray(data) ? data : [];
}

async function borrarFrase(sala, id, clave) {
  const { error } = await sb.rpc('frase_borrar', { p_sala: sala, p_id: id, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
}

async function limpiarFrases(sala, clave) {
  const { error } = await sb.rpc('frases_limpiar', { p_sala: sala, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
}


/** PIN de participantes: 'abierto' (sin PIN) | 'ok' | 'mal'. */
async function verificarPinPart(sala, pin) {
  const { data, error } = await sb.rpc('pin_part_verificar', { p_sala: sala, p_pin: pin || '' });
  if (error) throw new Error(mensajeError(error));
  return data;
}

async function fijarPinPart(sala, clave, pin) {
  const { error } = await sb.rpc('pin_part_fijar', { p_sala: sala, p_clave: clave, p_pin: pin });
  if (error) throw new Error(mensajeError(error));
}

async function leerPinPart(sala, clave) {
  const { data, error } = await sb.rpc('pin_part_leer', { p_sala: sala, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
  return data || '';
}

async function enviarRespuesta(sala, poll, voter, texto) {
  const { error } = await sb.rpc('respuesta_enviar', { p_sala: sala, p_poll: poll, p_voter: voter, p_texto: texto, p_pin: pinParticipante() || null });
  if (error) throw new Error(mensajeError(error));
}

async function leerRespuestas(sala, poll) {
  const { data, error } = await sb.rpc('respuestas_leer', { p_sala: sala, p_poll: poll });
  if (error) throw new Error(mensajeError(error));
  return Array.isArray(data) ? data : [];
}

async function borrarRespuesta(sala, id, clave) {
  const { error } = await sb.rpc('respuesta_borrar', { p_sala: sala, p_id: id, p_clave: clave });
  if (error) throw new Error(mensajeError(error));
}
