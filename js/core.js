/* ==========================================================================
   Taller de Scratch · núcleo compartido
   Estado de la app, almacenamiento y utilidades DOM.
   ========================================================================== */

// Cada taller guarda sus datos con su propio sufijo (el primero de la lista no lleva).
const SFX = (typeof TALLER_ID !== 'undefined' && TALLER_ID !== TALLER_PRINCIPAL) ? '.' + TALLER_ID : '';
const LS = {
  rol: 'taller.rol' + SFX,
  nombre: 'taller.nombre' + SFX,
  pinHash: 'taller.pinhash' + SFX,
  seccionesVistas: 'taller.vistas' + SFX,
  mensaje: 'taller.mensaje' + SFX,
  seccion: 'taller.seccion' + SFX,
};

// PIN en texto plano: solo sessionStorage (se borra al cerrar pestaña).
const SS_CLAVE = 'taller.clave' + SFX;

const app = {
  rol: null,            // 'docente' | 'facilitador'
  nombre: '',
  sala: TALLER.salaPorDefecto,
  clave: '',
  canal: null,
  estado: null,
  seccionesVistas: [],
  conectados: [],
  timer: { seg: 0, corriendo: false, iv: null },
  ultimoMensajeVisto: '',
  ultimoPasoId: '',
  feedbackPaso: true, // animación al cambiar de paso
  certificadoNotificado: false,
  sondeo: null,
};

function leerLS(k, def) {
  try {
    const v = localStorage.getItem(k);
    return v === null ? def : v;
  } catch {
    return def;
  }
}
function guardarLS(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch { }
}

function leerClaveSesion() {
  try {
    return sessionStorage.getItem(SS_CLAVE) || '';
  } catch {
    return '';
  }
}
function guardarClaveSesion(pin) {
  try {
    if (pin) sessionStorage.setItem(SS_CLAVE, pin);
    else sessionStorage.removeItem(SS_CLAVE);
  } catch { }
}

const $ = (s) => document.querySelector(s);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt !== undefined) n.textContent = txt;
  return n;
};

function salaDeUrl() {
  const p = new URLSearchParams(location.search);
  const s = (p.get('sala') || '').trim().toLowerCase();
  // Mismo formato que valida la base de datos (crear_sala)
  return /^[a-z0-9][a-z0-9_-]{0,59}$/.test(s) ? s : TALLER.salaPorDefecto;
}

/** Escapa texto para meterlo en HTML generado con plantillas. */
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Qué materiales se habilitan en cada paso (se define en talleres/<id>.js). */
const MATERIALES_POR_BLOQUE = TALLER.materialesPorBloque || {};

/** Secciones vistas guardadas en el navegador (tolera datos corruptos). */
function leerVistas() {
  try {
    const v = JSON.parse(leerLS(LS.seccionesVistas, '[]'));
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Identificador anónimo de este navegador (un voto y una frase por navegador). */
function miVotanteId() {
  let v = leerLS('taller.votante', '');
  if (!/^[a-z0-9]{10,40}$/.test(v)) {
    const a = new Uint32Array(3);
    crypto.getRandomValues(a);
    v = Array.from(a, (n) => n.toString(36)).join('').slice(0, 24);
    guardarLS('taller.votante', v);
  }
  return v;
}

/** PIN de participantes de esta sesión (solo sessionStorage). */
function pinParticipante() {
  try { return sessionStorage.getItem('taller.pinpart' + SFX) || ''; } catch { return ''; }
}
function guardarPinParticipante(p) {
  try {
    if (p) sessionStorage.setItem('taller.pinpart' + SFX, p);
    else sessionStorage.removeItem('taller.pinpart' + SFX);
  } catch { }
}

/** ¿El facilitador ya abrió un paso? (hay un paso en pantalla) */
function pasoAbierto() {
  return !!(app.estado && app.estado.bloque_actual);
}

/**
 * ¿La sala está abierta para los docentes? Cerrada = sala de espera con cuenta regresiva.
 * Si la base aún no tiene la columna (falta ejecutar supabase.sql) se considera abierta, para no bloquear.
 */
function salaAbierta() {
  const e = app.estado;
  if (!e) return false;
  if (typeof e.sala_abierta !== 'boolean') return true;
  return e.sala_abierta;
}
