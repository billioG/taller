/* ==========================================================================
   Taller de Scratch · cuenta regresiva por paso
   - Cada paso dura lo que dice su rango («25-60» = 35 min) y arranca cuando el
     facilitador abre el paso (estado.paso_inicio).
   - Los docentes ven la cuenta, pulsan «¡Terminé!» y su tiempo se acumula.
   - Música de prisa (chiptune original) en los últimos 30 s y animación al llegar a 0.
   ========================================================================== */

const CUENTA = { id: '', prev: null, hecho: false, fin: false, ui: null, uiFac: null };
const MUS = { on: false, t: null, i: 0 };
const RETOS = [
  '¡Se acabó el tiempo! En el próximo paso, ¡termina antes y gana segundos!',
  '⏰ ¡Tiempo! Reta a tu mente: el siguiente paso, con tiempo de sobra.',
  '¡Cero! Cada segundo que ahorres en el siguiente paso suma a tu marca.',
  'Se acabó la cuenta. ¿Puedes terminar el próximo paso antes de que llegue a 0?',
];

// ---------------------------------------------------------------- utilidades
function sonidoOn() { return leerLS('taller.sonido', '1') !== '0'; }
function claveTiempos() { return 'taller.tiempos.' + app.sala; }
function leerTiempos() {
  try { const t = JSON.parse(leerLS(claveTiempos(), '{}')); return t && typeof t === 'object' ? t : {}; } catch { return {}; }
}
function guardarTiempos(t) { guardarLS(claveTiempos(), JSON.stringify(t)); }
function fmtT(seg) {
  const s = Math.max(0, Math.round(seg));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
function pasoActivo() {
  const o = typeof obtenerPasoActual === 'function' ? obtenerPasoActual() : null;
  return o ? o.bloque : null;
}
/** «25-60» → 35 min en segundos. */
function duracionPaso(b) {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec((b && b.minutos) || '');
  if (!m) return 0;
  const d = (Number(m[2]) - Number(m[1])) * 60;
  return d > 0 ? d : 0;
}
function inicioPaso() {
  const t = Date.parse((app.estado && app.estado.paso_inicio) || '');
  return isNaN(t) ? 0 : t;
}
function totalPaso(b) { return duracionPaso(b) + (parseInt(app.estado && app.estado.paso_extra, 10) || 0); }
function restantePaso(b) {
  const ini = inicioPaso();
  return ini ? totalPaso(b) - (Date.now() - ini) / 1000 : null;
}

// ---------------------------------------------------------------- sonido
function tono(f, d, tipo, vol, delay) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = app.audioCtx || (app.audioCtx = new Ctx());
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'square';
    o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(vol || 0.04, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + d);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + d + 0.02);
  } catch { }
}

const MELODIA = [440, 523.25, 659.25, 880, 783.99, 659.25, 523.25, 659.25, 392, 493.88, 587.33, 783.99, 698.46, 587.33, 493.88, 587.33];
const BAJOS = [110, 0, 110, 0, 98, 0, 98, 0];

/** Música de prisa: arpegios de 8 bits que se aceleran al acercarse el cero. */
function musicaOn() {
  if (MUS.on) return;
  MUS.on = true; MUS.i = 0;
  pasoMusica();
}
function pasoMusica() {
  if (!MUS.on) return;
  const b = pasoActivo();
  const r = b ? restantePaso(b) : null;
  if (r === null || r <= 0 || CUENTA.hecho || !sonidoOn()) { musicaOff(); return; }
  const i = MUS.i++;
  tono(MELODIA[i % MELODIA.length], 0.11, 'square', 0.03);
  if (i % 2 === 0 && BAJOS[(i / 2) % BAJOS.length]) tono(BAJOS[(i / 2) % BAJOS.length], 0.2, 'triangle', 0.05);
  MUS.t = setTimeout(pasoMusica, 120 + (Math.max(0, r - 5) / 25) * 90);
}
function musicaOff() { MUS.on = false; clearTimeout(MUS.t); }

function sonidoFin() {
  [784, 659, 523, 392].forEach((f, k) => tono(f, 0.2, 'square', 0.06, k * 0.17));
  tono(196, 0.5, 'triangle', 0.08, 0.7);
}
function sonidoMeta() {
  [523, 659, 784, 1047].forEach((f, k) => tono(f, 0.14, 'square', 0.05, k * 0.09));
}

// ---------------------------------------------------------------- animaciones
function celebrar(origen) {
  const caja = origen.getBoundingClientRect();
  const emojis = ['🎉', '⭐', '✨', '🎊', '💙'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'chispa';
    s.textContent = emojis[i % emojis.length];
    s.style.left = caja.left + caja.width / 2 + 'px';
    s.style.top = caja.top + caja.height / 2 + 'px';
    s.style.setProperty('--dx', (Math.random() * 260 - 130) + 'px');
    s.style.setProperty('--dy', (-80 - Math.random() * 180) + 'px');
    s.style.animationDelay = Math.random() * 0.15 + 's';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
}

let __ovTiempoT = null;
function animacionFin() {
  const ov = $('#overlayTiempo');
  if (!ov) return;
  $('#ovTiempoTexto').textContent = RETOS[Math.floor(Math.random() * RETOS.length)];
  ov.hidden = false;
  if (sonidoOn()) sonidoFin();
  try { if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]); } catch { }
  clearTimeout(__ovTiempoT);
  __ovTiempoT = setTimeout(() => { ov.hidden = true; }, 5000);
}

// ---------------------------------------------------------------- cambio de paso
function cambioDePaso(id, b) {
  // Si el docente no pulsó «Terminé», su tiempo en el paso anterior queda registrado completo.
  if (app.rol === 'docente' && CUENTA.prev && !CUENTA.hecho && CUENTA.prev.inicio) {
    const t = leerTiempos();
    if (!t[CUENTA.prev.id]) {
      t[CUENTA.prev.id] = { seg: Math.round(Math.min(CUENTA.prev.dur, (Date.now() - CUENTA.prev.inicio) / 1000)), ok: false };
      guardarTiempos(t);
    }
  }
  CUENTA.id = id;
  CUENTA.fin = false;
  CUENTA.hecho = !!(leerTiempos()[id] && leerTiempos()[id].ok);
  CUENTA.prev = b ? { id, inicio: inicioPaso(), dur: totalPaso(b) } : null;
  musicaOff();
  const ov = $('#overlayTiempo');
  if (ov) ov.hidden = true;
  if (CUENTA.ui) { CUENTA.ui = null; const c = $('#cuentaPaso'); if (c) c.innerHTML = ''; }
}

// ---------------------------------------------------------------- docentes
function totalesAcumulados(b, dur) {
  const t = leerTiempos();
  let seg = 0, ok = 0;
  Object.keys(t).forEach((k) => { if (k !== b.id) { seg += t[k].seg || 0; if (t[k].ok) ok++; } });
  const aqui = t[b.id];
  if (aqui) { seg += aqui.seg || 0; if (aqui.ok) ok++; }
  else { const ini = inicioPaso(); if (ini) seg += Math.min(dur, (Date.now() - ini) / 1000); }
  return { seg, ok };
}

function construirCuentaDocente(box) {
  box.innerHTML = '';
  const top = el('div', 'cuenta-top');
  top.appendChild(el('span', 'cuenta-etq', '⏱ Tiempo de este paso'));
  const snd = el('button', 'cuenta-snd', sonidoOn() ? '🔊' : '🔇');
  snd.type = 'button';
  snd.title = 'Sonido de la cuenta regresiva';
  snd.setAttribute('aria-label', 'Activar o silenciar el sonido de la cuenta regresiva');
  snd.addEventListener('click', () => {
    guardarLS('taller.sonido', sonidoOn() ? '0' : '1');
    snd.textContent = sonidoOn() ? '🔊' : '🔇';
    if (!sonidoOn()) musicaOff();
  });
  top.appendChild(snd);
  box.appendChild(top);
  const num = el('div', 'cuenta-num', '--:--');
  num.setAttribute('role', 'timer');
  box.appendChild(num);
  const barra = el('div', 'cuenta-barra');
  const rel = document.createElement('i');
  barra.appendChild(rel);
  box.appendChild(barra);
  const acc = el('div', 'cuenta-acc');
  const btn = el('button', 'btn primary cuenta-btn', '✅ ¡Terminé!');
  btn.type = 'button';
  const msg = el('span', 'cuenta-msg', '');
  acc.appendChild(btn);
  acc.appendChild(msg);
  box.appendChild(acc);
  const tot = el('div', 'cuenta-tot', '');
  box.appendChild(tot);
  CUENTA.ui = { num, rel, btn, msg, tot, box };
  btn.addEventListener('click', () => {
    const b = pasoActivo();
    if (b) terminarPaso(b, btn);
  });
}

function terminarPaso(b, btn) {
  if (CUENTA.hecho) return;
  const ini = inicioPaso(), dur = totalPaso(b);
  const usado = Math.max(0, Math.round((Date.now() - ini) / 1000));
  const ahorro = Math.round(dur - usado);
  const t = leerTiempos();
  t[b.id] = { seg: usado, ok: true, ahorro };
  guardarTiempos(t);
  CUENTA.hecho = true;
  musicaOff();
  celebrar(btn);
  if (sonidoOn()) sonidoMeta();
  mostrarToast(ahorro > 0 ? '🎉 ¡Terminaste con ' + fmtT(ahorro) + ' de sobra!' : '✅ Registrado: terminaste en ' + fmtT(usado), 'ok', 5000);
  try { if (app.canal) app.canal.send({ type: 'broadcast', event: 'listo', payload: { n: app.nombre, p: b.id, s: usado, a: ahorro > 0 } }); } catch { }
}

function pintarDocente(b, dur, r) {
  const box = $('#cuentaPaso');
  if (!CUENTA.ui) construirCuentaDocente(box);
  const u = CUENTA.ui;
  const reg = leerTiempos()[b.id];

  if (CUENTA.hecho && reg) {
    const sobra = Math.round(dur - reg.seg);
    u.num.textContent = fmtT(Math.max(0, sobra));
    u.msg.textContent = sobra >= 0 ? '🎉 Terminaste en ' + fmtT(reg.seg) + ' · te sobraron ' + fmtT(sobra) : '✅ Terminaste en ' + fmtT(reg.seg);
    u.btn.disabled = true;
    u.btn.textContent = '✅ Listo';
    u.box.className = 'cuenta hecho';
    u.rel.style.width = '100%';
  } else {
    u.num.textContent = fmtT(Math.max(0, r));
    u.btn.disabled = false;
    u.btn.textContent = '✅ ¡Terminé!';
    u.rel.style.width = Math.max(0, Math.min(100, (r / Math.max(1, dur)) * 100)) + '%';
    const estado = r <= 0 ? 'over' : r <= 30 ? 'danger' : (r <= 60 || r / dur <= 0.2) ? 'warn' : 'ok';
    u.box.className = 'cuenta ' + estado;
    u.msg.textContent = r <= 0 ? '⏰ Tiempo cumplido. ¡Aún puedes terminar y registrar tu marca!' : r <= 30 ? '¡Últimos segundos!' : '';
    if (r > 0 && CUENTA.fin) CUENTA.fin = false;
    if (r > 0 && r <= 30 && sonidoOn()) musicaOn(); else if (r > 30 || r <= 0) musicaOff();
    if (r <= 0 && !CUENTA.fin) { CUENTA.fin = true; animacionFin(); }
  }
  const acu = totalesAcumulados(b, dur);
  u.tot.textContent = 'Tiempo acumulado: ' + fmtT(acu.seg) + ' · Pasos terminados: ' + acu.ok + '/' + TALLER.secciones[0].bloques.length;
}

// ---------------------------------------------------------------- facilitador
async function extenderPaso(seg) {
  try {
    await escribirEstado(app.clave, { paso_extra: (parseInt(app.estado && app.estado.paso_extra, 10) || 0) + seg });
    mostrarToast('+' + seg / 60 + ' min para este paso', 'ok', 2500);
  } catch (e) { mostrarToast(mensajeError(e), 'err'); }
}
async function reiniciarPaso() {
  try {
    await escribirEstado(app.clave, { paso_inicio: new Date().toISOString(), paso_extra: 0 });
    app.listos = {};
  } catch (e) { mostrarToast(mensajeError(e), 'err'); }
}

async function detenerPaso() {
  try {
    await escribirEstado(app.clave, { paso_inicio: null, paso_extra: 0 });
    app.listos = {};
    mostrarToast('⏹ Cronómetro detenido: ya no se ve para los docentes', 'ok', 3500);
  } catch (e) { mostrarToast(mensajeError(e), 'err'); }
}

function construirCuentaFac(box) {
  box.innerHTML = '';
  const fila = el('div', 'cuenta-fila');
  const num = el('div', 'cuenta-num', '--:--');
  fila.appendChild(num);
  const acc = el('div', 'cuenta-fac-btns');
  const mk = (txt, fn, cls) => { const b = el('button', 'btn btn-mini ' + (cls || ''), txt); b.type = 'button'; b.addEventListener('click', fn); acc.appendChild(b); return b; };
  mk('+2 min', () => extenderPaso(120));
  mk('+5 min', () => extenderPaso(300));
  mk('⏹ Detener', detenerPaso);
  const bReset = mk('↺ Reiniciar', reiniciarPaso, 'ghost');
  fila.appendChild(acc);
  box.appendChild(fila);
  const barra = el('div', 'cuenta-barra');
  const rel = document.createElement('i');
  barra.appendChild(rel);
  box.appendChild(barra);
  const info = el('div', 'cuenta-tot', '');
  box.appendChild(info);
  CUENTA.uiFac = { num, rel, info, box, bReset };
}

function listoAviso(p) {
  if (app.rol !== 'facilitador' || !p) return;
  if (typeof p.p !== 'string' || !/^s\d+b\d+$/.test(p.p)) return;
  const n = String(p.n || '').replace(/[<>&"']/g, '').slice(0, 30);
  if (!n) return;
  app.listos = app.listos || {};
  (app.listos[p.p] = app.listos[p.p] || {})[n] = Math.max(0, parseInt(p.s, 10) || 0);
}

function pintarFac(b, dur, r) {
  const box = $('#cuentaPrev');
  if (!CUENTA.uiFac) construirCuentaFac(box);
  const u = CUENTA.uiFac;
  if (r === null) {
    u.num.textContent = '--:--';
    u.info.textContent = 'Cronómetro detenido. Se activa al abrir un paso, o pulsa ↺ Reiniciar para empezar de nuevo.';
    u.rel.style.width = '0%';
    u.box.className = 'cuenta cuenta-fac ok';
    return;
  }
  u.num.textContent = (r < 0 ? '+' : '') + fmtT(Math.abs(r));
  u.rel.style.width = Math.max(0, Math.min(100, (r / Math.max(1, dur)) * 100)) + '%';
  u.box.className = 'cuenta cuenta-fac ' + (r <= 0 ? 'over' : r <= 30 ? 'danger' : (r <= 60 || r / dur <= 0.2) ? 'warn' : 'ok');
  const l = (app.listos && app.listos[b.id]) || {};
  const nombres = Object.keys(l).sort((a, c) => l[a] - l[c]);
  const total = (app.conectados || []).filter((x) => x && x !== 'Facilitador').length;
  u.info.textContent = nombres.length
    ? '✅ Terminaron ' + nombres.length + (total ? ' de ' + total : '') + ' · más rápidos: ' + nombres.slice(0, 3).map((x) => x + ' (' + fmtT(l[x]) + ')').join(', ')
    : 'Nadie ha marcado «Terminé» todavía.';
}

// ---------------------------------------------------------------- reloj
function tickCuenta() {
  const b = (app.rol === 'docente' && !salaAbierta()) ? null : pasoActivo();
  const id = b ? b.id : '';
  if (id !== CUENTA.id) {
    if (CUENTA.uiFac) { CUENTA.uiFac = null; const f = $('#cuentaPrev'); if (f) f.innerHTML = ''; }
    cambioDePaso(id, b);
  }
  const conTiempo = !!(b && duracionPaso(b));
  const dur = b ? totalPaso(b) : 0;
  const r = conTiempo ? restantePaso(b) : null;

  if (app.rol === 'docente') {
    const box = $('#cuentaPaso');
    if (box) {
      const visible = conTiempo && r !== null;
      box.hidden = !visible;
      if (visible) pintarDocente(b, dur, r);
      else musicaOff();
    }
  } else if (app.rol === 'facilitador') {
    const box = $('#cuentaPrev');
    if (box) {
      box.hidden = !conTiempo;
      if (conTiempo) pintarFac(b, dur, r);
    }
  }
  const proy = $('#proyCuenta');
  if (proy) {
    proy.textContent = conTiempo && r !== null ? '⏱ ' + (r < 0 ? '+' : '') + fmtT(Math.abs(r)) : '';
    proy.className = 'proy-cuenta' + (r !== null && r <= 30 ? ' urgente' : '');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setInterval(tickCuenta, 250);
  $('#ovTiempoCerrar')?.addEventListener('click', () => { $('#overlayTiempo').hidden = true; });
  document.addEventListener('keydown', (ev) => {
    const ov = $('#overlayTiempo');
    if (ev.key === 'Escape' && ov && !ov.hidden) ov.hidden = true;
  });
});
