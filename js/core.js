/* ==========================================================================
   Taller de Scratch · núcleo compartido
   Estado de la app, almacenamiento y utilidades DOM.
   ========================================================================== */

const LS = {
  rol: 'taller.rol',
  nombre: 'taller.nombre',
  pinHash: 'taller.pinhash',
  seccionesVistas: 'taller.vistas',
  mensaje: 'taller.mensaje',
  seccion: 'taller.seccion',
};

// PIN en texto plano: solo sessionStorage (se borra al cerrar pestaña).
const SS_CLAVE = 'taller.clave';

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
  return p.get('sala') || TALLER.salaPorDefecto;
}

/** Qué materiales se habilitan en cada paso. */
const MATERIALES_POR_BLOQUE = {
  s1b2: ['tarjetas-de-bloques'],
  s1b4: ['pintura-con-la-cara'],
  s1b5: ['plan-de-clase', 'rubrica'],
  s1b6: ['encuesta-salida', 'certificado'],
};
