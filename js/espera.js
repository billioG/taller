/* ==========================================================================
   Taller de Scratch · sala de espera
   Mientras el facilitador no abre el primer paso, los docentes ven una
   animación con la cuenta regresiva hacia el día del taller. Al abrir la
   sesión, la cuenta desaparece y aparece el contenido en vivo.
   ========================================================================== */

const ESPERA = { listo: false, ultimo: {}, timer: null };

/** Fecha y hora del taller (config.js → fecha.inicio). */
function inicioTaller() {
  const t = Date.parse((TALLER.fecha && TALLER.fecha.inicio) || '');
  return isNaN(t) ? 0 : t;
}

/** Piezas flotantes con los colores de las categorías de Scratch. */
const PIEZAS_ESPERA = [
  { c: '#4C97FF', t: 'mover 10 pasos', x: 6, d: 0, s: 11 },
  { c: '#9966FF', t: 'decir ¡Hola!', x: 22, d: 2.2, s: 13 },
  { c: '#FFBF00', t: 'al presionar 🏴', x: 40, d: 4.1, s: 10 },
  { c: '#FFAB19', t: 'repetir (10)', x: 58, d: 1.1, s: 12 },
  { c: '#59C059', t: '( ) + ( )', x: 74, d: 3.3, s: 14 },
  { c: '#5CB1D6', t: 'preguntar y esperar', x: 88, d: 5.2, s: 12 },
  { c: '#CF63CF', t: 'iniciar sonido', x: 14, d: 6.1, s: 15 },
  { c: '#FF8C1A', t: 'fijar [puntos] a 0', x: 50, d: 7.4, s: 13 },
];

function construirEspera(box) {
  box.innerHTML = '';
  const fondo = el('div', 'espera-fondo');
  fondo.setAttribute('aria-hidden', 'true');
  PIEZAS_ESPERA.forEach((p) => {
    const b = el('span', 'espera-pieza', p.t);
    b.style.setProperty('--c', p.c);
    b.style.left = p.x + '%';
    b.style.animationDelay = p.d + 's';
    b.style.animationDuration = 14 + p.s + 's';
    fondo.appendChild(b);
  });
  box.appendChild(fondo);

  const cont = el('div', 'espera-contenido');
  cont.appendChild(el('span', 'espera-kicker', (TALLER.entidad || 'Yo Aprendo') + ' · Formación continua'));
  const tit = el('h2', 'espera-tit');
  String(TALLER.titulo || 'Taller').split(' ').forEach((w, i) => {
    const s = el('span', 'espera-palabra', w + ' ');
    s.style.animationDelay = 0.15 * i + 's';
    tit.appendChild(s);
  });
  cont.appendChild(tit);
  cont.appendChild(el('p', 'espera-fecha', (TALLER.fecha && TALLER.fecha.texto) || ''));

  const fila = el('div', 'espera-cuenta');
  fila.setAttribute('role', 'timer');
  fila.setAttribute('aria-label', 'Cuenta regresiva para el taller');
  ['dias', 'horas', 'minutos', 'segundos'].forEach((k) => {
    const t = el('div', 'espera-tile');
    const n = el('span', 'espera-num', '00');
    n.dataset.k = k;
    const l = el('span', 'espera-lab', k);
    l.dataset.l = k;
    t.appendChild(n);
    t.appendChild(l);
    fila.appendChild(t);
  });
  cont.appendChild(fila);

  const msg = el('p', 'espera-msg', '');
  msg.id = 'esperaMsg';
  cont.appendChild(msg);

  const acc = el('div', 'espera-acc');
  const btn = el('button', 'btn primary', '📄 Leer los materiales antes del taller');
  btn.type = 'button';
  btn.addEventListener('click', () => { if (typeof window.__irAMateriales === 'function') window.__irAMateriales(); });
  acc.appendChild(btn);
  cont.appendChild(acc);
  cont.appendChild(el('p', 'espera-nota', 'Todo lo demás se abrirá cuando el facilitador inicie la sesión.'));
  box.appendChild(cont);
  ESPERA.listo = true;
}

function numFlip(n, valor) {
  const txt = String(valor).padStart(2, '0');
  if (n.textContent !== txt) {
    n.textContent = txt;
    n.classList.remove('flip');
    void n.offsetWidth;
    n.classList.add('flip');
  }
}

function pintarEspera() {
  const box = $('#esperaDocente');
  if (!box || box.hidden) return;
  if (!ESPERA.listo) construirEspera(box);
  const objetivo = inicioTaller();
  const dif = objetivo ? Math.max(0, objetivo - Date.now()) : 0;
  const s = Math.floor(dif / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const vals = { dias: d, horas: h, minutos: m, segundos: x };
  Object.keys(vals).forEach((k) => {
    const n = box.querySelector('[data-k="' + k + '"]');
    if (n) numFlip(n, vals[k]);
  });
  const lab = (k, un, pl) => { const l = box.querySelector('[data-l="' + k + '"]'); if (l) l.textContent = vals[k] === 1 ? un : pl; };
  lab('dias', 'día', 'días'); lab('horas', 'hora', 'horas'); lab('minutos', 'minuto', 'minutos'); lab('segundos', 'segundo', 'segundos');
  const msg = $('#esperaMsg');
  if (msg) {
    msg.textContent = !objetivo ? 'Muy pronto empezamos.'
      : dif === 0 ? '¡Estamos por comenzar! El facilitador abrirá la sesión en un momento.'
      : d >= 1 ? 'Falta poco para vivir una sesión donde tú eres quien crea.'
      : 'Hoy es el día. Prepara tu computadora y un tema de tu asignatura.';
  }
  box.classList.toggle('ya', objetivo && dif === 0);
}

/** Alterna entre la sala de espera y la sesión en vivo según el estado. */
function actualizarEspera() {
  if (app.rol !== 'docente') return;
  const enEspera = !sesionAbierta();
  document.body.classList.toggle('en-espera', enEspera);
  const box = $('#esperaDocente');
  if (box) box.hidden = !enEspera;
  if (enEspera) pintarEspera();
  if (!enEspera && typeof window.__irAEnVivo === 'function' && !ESPERA.ultimo.abierta) window.__irAEnVivo();
  ESPERA.ultimo.abierta = !enEspera;
}

/** Facilitador: vuelve a la sala de espera (útil para ensayar o si se abrió por error). */
async function volverAEspera() {
  if (!confirm('¿Volver a la sala de espera? Los docentes verán otra vez la cuenta regresiva y se pierde el paso actual.')) return;
  try {
    await escribirEstado(app.clave, { bloque_actual: null, paso_inicio: null, paso_extra: 0, mensaje: '' });
    mostrarToast('Los docentes están en la sala de espera', 'ok');
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('#btnVolverEspera')?.addEventListener('click', volverAEspera);
  clearInterval(ESPERA.timer);
  ESPERA.timer = setInterval(() => { if (app.rol === 'docente' && document.body.classList.contains('en-espera')) pintarEspera(); }, 1000);
});
