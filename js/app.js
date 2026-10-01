/* ==========================================================================
   Taller de Scratch · lógica de la aplicación
   Dos vistas: la del docente (sigue al facilitador) y la del facilitador
   (controla). Sin dependencias más allá de config.js y supabase.js.
   ========================================================================== */

// ------------------------------------------------------------------
// Estado local
// ------------------------------------------------------------------
const LS = {
  rol: 'taller.rol',
  nombre: 'taller.nombre',
  clave: 'taller.clave',
  pinHash: 'taller.pinhash',
  seccionesVistas: 'taller.vistas',
  mensaje: 'taller.mensaje',
  seccion: 'taller.seccion',
};

const app = {
  rol: null,            // 'docente' | 'facilitador'
  nombre: '',
  sala: TALLER.salaPorDefecto,
  clave: '',
  canal: null,
  estado: null,         // fila de Supabase
  seccionesVistas: [],  // ids que el facilitador ya abrió
  conectados: [],
  timer: { seg: 0, corriendo: false, iv: null },
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

// ------------------------------------------------------------------
// PUERTA DE ENTRADA
//
// Los docentes entran directo: escriben su nombre y ya están dentro.
// El acceso de facilitador exige el PIN y no muestra ninguna opción de rol,
// así que un docente no puede abrir el panel de control ni por curiosidad.
// ------------------------------------------------------------------

/** El PIN se guarda como hash SHA-256, nunca en texto plano. */
async function hashPin(pin) {
  const datos = new TextEncoder().encode('taller-scratch:' + pin);
  const buf = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function pinGuardado() {
  return leerLS(LS.pinHash, '');
}

/**
 * Comprueba el PIN. El hash esperado vive en config.js (campo `pinHash`).
 * Para calcular el hash de un PIN nuevo, en la consola del navegador:
 *   await crypto.subtle.digest('SHA-256', new TextEncoder().encode('taller-scratch:MIPIN'))
 */
async function pinValido(hash) {
  if (TALLER.pinHash) return hash === TALLER.pinHash;
  // Sin hash configurado, cualquier PIN pasa en modo local.
  return !SB_LISTO;
}

function init() {
  $('#puertaTitulo').textContent = TALLER.titulo;
  $('#puertaSub').textContent = TALLER.subtitulo;
  app.sala = salaDeUrl();

  // Si ya se entró antes con el PIN, se salta la puerta.
  if (pinGuardado()) {
    app.rol = 'facilitador';
    app.nombre = 'Facilitador';
    app.clave = leerLS(LS.clave, '');
    entrar();
    return;
  }

  const guardado = leerLS(LS.nombre, '');
  if (guardado) $('#inpNombreDocente').value = guardado;

  if (!SB_LISTO) {
    const a = $('#puertaAviso');
    a.hidden = false;
    a.className = 'puerta-aviso';
    a.textContent =
      'Modo sin conexión con Supabase: las secciones y descargas funcionan, pero los docentes no verán los cambios en vivo hasta que configures la sincronización. Ver README.md.';
  }

  // --- Entrada de docente ---
  $('#formDocente').addEventListener('submit', (e) => {
    e.preventDefault();
    app.rol = 'docente';
    app.nombre = $('#inpNombreDocente').value.trim() || 'Docente';
    guardarLS(LS.nombre, app.nombre);
    app.seccionesVistas = JSON.parse(leerLS(LS.seccionesVistas, '[]'));
    entrar();
  });

  // --- Entrada de facilitador ---
  $('#btnAbrirPin').addEventListener('click', () => {
    $('#formPin').hidden = false;
    $('#pinError').hidden = true;
    $('#inpPin').focus();
  });

  $('#btnCancelarPin').addEventListener('click', () => {
    $('#formPin').hidden = true;
    $('#inpPin').value = '';
    $('#pinError').hidden = true;
  });

  $('#formPin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = $('#inpPin').value.trim();
    if (!pin) return;

    const hash = await hashPin(pin);
    if (!(await pinValido(hash))) {
      $('#pinError').hidden = false;
      $('#inpPin').value = '';
      $('#inpPin').focus();
      return;
    }

    guardarLS(LS.pinHash, hash);
    app.rol = 'facilitador';
    app.nombre = 'Facilitador';
    app.clave = pin;
    guardarLS(LS.clave, pin);
    $('#inpPin').value = '';
    entrar();
  });

  // Volver a la puerta desde la app
  $('#btnSalir').addEventListener('click', () => {
    if (app.canal) app.canal.unsubscribe();
    clearInterval(app.timer.iv);
    guardarLS(LS.pinHash, '');
    guardarLS(LS.clave, '');
    location.reload();
  });
}

function entrar() {
  $('#puerta').hidden = true;
  $('#app').hidden = false;
  $('#topTitulo').textContent = TALLER.titulo;
  $('#topRol').textContent =
    app.rol === 'facilitador' ? 'Facilitador · ' + TALLER.entidad : 'Docente · ' + TALLER.entidad;
  $('#pieTexto').textContent = TALLER.bienvenida.recordatorio;

  if (app.rol === 'facilitador') {
    $('#panelFacilitador').hidden = false;
    renderNotas();
    renderControlSecciones();
    renderControlMateriales();
    renderConfig();
    conectarTimer();
    conectar();
  } else {
    $('#panelDocente').hidden = false;
    conectarTabsDocente();
    renderProgreso();
    renderMaterialDelPaso();
    renderMaterialesDocente();
    renderProyectos();
    conectar();
  }
}

// ------------------------------------------------------------------
// SINCRONIZACIÓN
// ------------------------------------------------------------------
async function conectar() {
  if (!SB_LISTO) {
    setConexion('mal', 'Sin sincronizar');
    if (app.rol === 'docente') {
      // Sin Supabase el docente ve la primera sección desbloqueada, pero nada más:
      // replicar el comportamiento del facilitador para no confundir.
      app.seccionesVistas = [TALLER.secciones[0].id];
      app.estado = {
        seccion_actual: TALLER.secciones[0].id,
        bloque_actual: TALLER.secciones[0].bloques[0].id,
        secciones_vistas: app.seccionesVistas,
        mensaje: leerLS(LS.mensaje, ''),
      };
      aplicarEstado();
    }
    return;
  }

  setConexion('espera', 'Conectando…');
  await initSupabase();

  app.canal = suscribir(
    app.sala,
    app.nombre,
    (estado) => {
      app.estado = estado;
      if (app.rol === 'docente') aplicarEstado();
      if (app.rol === 'facilitador') {
        marcarSeccionActual(estado.seccion_actual, estado.bloque_actual);
        renderVistaPrevia();
      }
    },
    (nombres) => {
      app.conectados = nombres;
      if (app.rol === 'facilitador') renderConectados();
      const p = $('#pillConectados');
      if (app.rol === 'facilitador') {
        p.hidden = false;
        $('#txtConectados').textContent = nombres.length;
      }
    },
    (vivo) => setConexion(vivo ? 'ok' : 'mal', vivo ? 'En vivo' : 'Reconectando…')
  );

  // Cargar el estado actual una sola vez
  try {
    const previo = await leerEstado(app.sala);
    if (previo) {
      app.estado = previo;
      if (app.rol === 'docente') aplicarEstado();
      if (app.rol === 'facilitador') {
        marcarSeccionActual(previo.seccion_actual, previo.bloque_actual);
        renderVistaPrevia();
      }
    } else if (app.rol === 'facilitador') {
      // El facilitador crea la sala si no existe
      if (app.clave) {
        await crearEstado(app.sala, app.clave, {});
        setConexion('ok', 'Sala creada');
      } else {
        setConexion('espera', 'Sin clave');
      }
    }
  } catch (err) {
    setConexion('mal', 'Error de conexión');
    mostrarConfigError(err.message);
  }
}

function setConexion(estado, texto) {
  const p = $('#pillConexion');
  p.classList.remove('pill-ok', 'pill-mal');
  if (estado === 'ok') p.classList.add('pill-ok');
  if (estado === 'mal') p.classList.add('pill-mal');
  $('#txtConexion').textContent = texto;
}

/** El facilitador manda; el docente obedece. */
function aplicarEstado() {
  const e = app.estado;
  if (!e) return;

  // Mensaje del facilitador
  const aviso = $('#aviso');
  if (e.mensaje) {
    aviso.hidden = false;
    $('#avisoTexto').textContent = e.mensaje;
  } else {
    aviso.hidden = true;
  }

  // Secciones que ya se abrieron
  if (Array.isArray(e.secciones_vistas)) {
    app.seccionesVistas = e.secciones_vistas;
  }

  renderProgreso();
  renderMaterialDelPaso();
  renderMaterialesDocente();
  renderSesionActual();
}

// ------------------------------------------------------------------
// VISTA DOCENTE
// ------------------------------------------------------------------
/**
 * Dibuja la sesión abierta y el bloque (slide) que el facilitador está mostrando.
 * Si el bloque no existe todavía, se muestra el primero de la sesión.
 */
function renderSesionActual() {
  const secId = app.estado?.seccion_actual || TALLER.secciones[0].id;
  const sec = TALLER.secciones.find((s) => s.id === secId) || TALLER.secciones[0];

  const cont = $('#sesionActual');
  cont.innerHTML = '';
  cont.appendChild(el('span', 'sesion-kicker', 'Sesión ' + sec.numero + ' de ' + TALLER.secciones.length));
  cont.appendChild(el('h2', 'sesion-tit', sec.titulo));
  cont.appendChild(el('p', 'sesion-concepto', sec.concepto));

  const prod = el('div', 'sesion-producto');
  prod.innerHTML = '<strong>Producto de hoy:</strong> ' + sec.producto;
  cont.appendChild(prod);

  // Qué bloque mostrar
  let idx = sec.bloques.findIndex((b) => b.id === app.estado?.bloque_actual);
  if (idx < 0) idx = 0;
  const bloque = sec.bloques[idx];

  const bc = $('#bloqueActual');
  bc.innerHTML = '';

  const cab = el('div', 'bloque-cab');
  cab.appendChild(el('span', 'bloque-min', 'Minutos ' + bloque.minutos));
  cab.appendChild(el('span', 'bloque-cont', 'Paso ' + (idx + 1) + ' de ' + sec.bloques.length));
  bc.appendChild(cab);

  bc.appendChild(el('h3', 'bloque-nombre', bloque.titulo));
  bc.appendChild(el('p', 'bloque-texto', bloque.paraDocentes));

  if (bloque.pasos && bloque.pasos.length) {
    const ul = el('ul', 'pasos');
    bloque.pasos.forEach((p, i) => {
      const li = el('li');
      li.appendChild(el('span', 'paso-n', String(i + 1)));
      li.appendChild(el('span', null, p));
      ul.appendChild(li);
    });
    bc.appendChild(ul);
  }

  // Los proyectos base siempre visibles en la pestaña Materiales
}

/** Pestañas En vivo / Materiales del docente. */
function conectarTabsDocente() {
  const tVivo = $('#tabEnVivo');
  const tMat = $('#tabMateriales');
  if (!tVivo || tVivo.dataset.listo) return;
  tVivo.dataset.listo = '1';
  const mostrar = (vivo) => {
    $('#vistaEnVivo').hidden = !vivo;
    $('#vistaMateriales').hidden = vivo;
    tVivo.classList.toggle('activa', vivo);
    tMat.classList.toggle('activa', !vivo);
    if (!vivo) $('#tabPuntoMat').hidden = true;
  };
  tVivo.addEventListener('click', () => mostrar(true));
  tMat.addEventListener('click', () => mostrar(false));
  window.__irAMateriales = () => mostrar(false);
}

/** Tira compacta de avance: 4 sesiones + pasos de la actual. Sin scroll. */
function renderProgreso() {
  const cont = $('#progresoSesion');
  if (!cont) return;
  cont.innerHTML = '';

  const idActual = app.estado?.seccion_actual;
  TALLER.secciones.forEach((s) => {
    const b = el('span', 'prog-sec' + (s.id === idActual ? ' actual' : '') + (app.seccionesVistas.includes(s.id) ? ' abierta' : ''));
    b.textContent = s.numero;
    b.title = s.titulo;
    cont.appendChild(b);
  });

  const sec = TALLER.secciones.find((s) => s.id === idActual) || TALLER.secciones[0];
  let idx = sec.bloques.findIndex((x) => x.id === app.estado?.bloque_actual);
  if (idx < 0) idx = 0;
  const pasos = el('span', 'prog-pasos', 'Paso ' + (idx + 1) + ' de ' + sec.bloques.length);
  cont.appendChild(pasos);
}

/** Botones de descarga del material que toca en este paso, sin cambiar de pestaña. */
function renderMaterialDelPaso() {
  const cont = $('#materialDelPaso');
  if (!cont) return;
  cont.innerHTML = '';

  const secId = app.estado?.seccion_actual;
  const ids = MATERIALES_POR_SECCION[secId] || [];
  const disponibles = ids.filter((id) => TALLER.materiales[id]);
  if (!disponibles.length) return;

  cont.appendChild(el('h3', 'matpaso-tit', '📄 Descarga lo de este paso'));
  disponibles.forEach((id) => {
    const m = TALLER.materiales[id];
    const a = el('a', 'btn primary btn-mini');
    a.href = m.archivo;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = '⬇ ' + m.titulo;
    cont.appendChild(a);
  });

  // Avisar en la pestaña Materiales que hay algo nuevo
  const punto = $('#tabPuntoMat');
  if (punto) punto.hidden = false;
}

/** Lo que ven los docentes, espejado en el panel del facilitador. */
function renderVistaPrevia() {
  const cont = $('#vistaPrevia');
  if (!cont || !app.estado) return;
  const sec = TALLER.secciones.find((s) => s.id === app.estado.seccion_actual);
  if (!sec) return;
  let idx = sec.bloques.findIndex((b) => b.id === app.estado.bloque_actual);
  if (idx < 0) idx = 0;
  const bloque = sec.bloques[idx];
  cont.innerHTML = '';
  cont.appendChild(el('span', 'prev-kicker', 'Sesión ' + sec.numero + ' · Paso ' + (idx + 1) + ' de ' + sec.bloques.length));
  cont.appendChild(el('strong', 'prev-tit', sec.titulo + ' — ' + bloque.titulo));
  if (app.estado.mensaje) {
    cont.appendChild(el('span', 'prev-aviso', '📣 ' + app.estado.mensaje));
  }
}

/* renderSeccionesDocente() se eliminó: la vista En vivo ya no lista todas las
   secciones (era la causa del scroll infinito). El avance se ve en
   renderProgreso(). Se deja esta nota para no reintroducirla. */

function renderMaterialesDocente() {
  const cont = $('#listaMateriales');
  cont.innerHTML = '';

  Object.entries(TALLER.materiales).forEach(([id, m]) => {
    const abierta = m.libre || abrirMaterial(id);
    const a = el('a', 'mat' + (m.libre ? ' libre' : '') + (abierta ? '' : ' bloqueado'));

    if (abierta) {
      a.href = m.archivo;
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.href = '#';
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        alert('Todavía no. El facilitador habilita este material cuando toca.');
      });
    }

    a.appendChild(el('span', 'mat-ico', abierta ? '📄' : '🔒'));

    const c = el('span', 'mat-cuerpo');
    c.appendChild(el('span', 'mat-tit', m.titulo));
    c.appendChild(el('span', 'mat-desc', m.desc));
    a.appendChild(c);

    a.appendChild(el('span', 'mat-momento', m.libre ? 'Libre' : m.momento));
    cont.appendChild(a);
  });
}

/**
 * Qué materiales se abren junto con cada sesión.
 * Un material queda disponible para el docente en cuanto su sesión se abre.
 * Edita esta tabla si cambias los materiales en config.js.
 */
const MATERIALES_POR_SECCION = {
  s1: ['tarjetas-de-bloques'],
  s2: [],
  s3: [],
  s4: ['plan-de-clase', 'rubrica', 'encuesta-salida', 'certificado'],
};

/** ¿Este material ya se puede descargar? */
function abrirMaterial(idMat) {
  return app.seccionesVistas.some((idSec) => {
    const lista = MATERIALES_POR_SECCION[idSec];
    return Array.isArray(lista) && lista.includes(idMat);
  });
}

function renderProyectos() {
  const cont = $('#listaProyectos');
  cont.innerHTML = '';
  if (!TALLER.proyectosBase || !TALLER.proyectosBase.length) {
    cont.appendChild(el('p', 'bloque-nota', 'Todavía no hay proyectos base. El facilitador los agrega en config.js.'));
    return;
  }
  TALLER.proyectosBase.forEach((p) => {
    const a = el('a', 'mat libre');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.appendChild(el('span', 'mat-ico', '🎯'));
    const c = el('span', 'mat-cuerpo');
    c.appendChild(el('span', 'mat-tit', p.titulo));
    c.appendChild(el('span', 'mat-desc', p.desc));
    a.appendChild(c);
    a.appendChild(el('span', 'mat-momento', 'Sesión ' + p.sesion));
    cont.appendChild(a);
  });
}

// ------------------------------------------------------------------
// VISTA FACILITADOR
// ------------------------------------------------------------------
function renderNotas() {
  const n = TALLER.notasFacilitador;
  const cont = $('#notasFacilitador');
  cont.innerHTML = '';

  const c1 = el('div', 'notas-col');
  c1.appendChild(el('h3', null, 'Las cuatro reglas (léelas textualmente)'));
  const ul1 = el('ul');
  n.reglasDelTaller.forEach((r) => ul1.appendChild(el('li', null, r)));
  c1.appendChild(ul1);
  cont.appendChild(c1);

  const c2 = el('div', 'notas-col');
  c2.appendChild(el('h3', null, 'Frases que resuelven'));
  const ul2 = el('ul');
  n.frasesUtiles.forEach((r) => ul2.appendChild(el('li', null, r)));
  c2.appendChild(ul2);
  cont.appendChild(c2);

  const c3 = el('div', 'notas-col');
  c3.appendChild(el('h3', null, 'Respuestas a las cinco objeciones'));
  n.respuestasRapidas.forEach((r) => {
    const p = el('p');
    p.innerHTML = '<strong>«' + r.objecion + '»</strong><br>' + r.respuesta;
    c3.appendChild(p);
  });
  cont.appendChild(c3);
}

function renderControlSecciones() {
  const cont = $('#controlSecciones');
  cont.innerHTML = '';

  TALLER.secciones.forEach((s) => {
    const div = el('div', 'sec');
    div.dataset.sec = s.id;

    div.appendChild(el('span', 'sec-num', String(s.numero)));

    const cuerpo = el('div', 'sec-cuerpo');
    cuerpo.appendChild(el('h3', 'sec-tit', s.titulo));
    cuerpo.appendChild(el('p', 'sec-concepto', s.concepto));

    const acciones = el('div', 'acciones-sec');

    const btn = el('button', 'btn ok', 'Abrir esta sección');
    btn.type = 'button';
    btn.addEventListener('click', () => abrirSeccion(s.id));
    acciones.appendChild(btn);

    // Navegación entre slides de esta sesión
    const nav = el('div', 'nav-slides');
    const prev = el('button', 'btn btn-mini', '◀ Anterior');
    prev.type = 'button';
    prev.addEventListener('click', () => irABloque(s, -1));
    const next = el('button', 'btn btn-mini', 'Siguiente ▶');
    next.type = 'button';
    next.addEventListener('click', () => irABloque(s, 1));
    nav.appendChild(prev);
    nav.appendChild(next);
    acciones.appendChild(nav);

    cuerpo.appendChild(acciones);
    div.appendChild(cuerpo);
    cont.appendChild(div);
  });
}

/** El facilitador avanza o retrocede un slide dentro de una sesión. */
async function irABloque(sec, delta) {
  const actual = app.estado?.bloque_actual;
  let idx = sec.bloques.findIndex((b) => b.id === actual);
  if (idx < 0) idx = 0;

  const nuevo = Math.min(Math.max(idx + delta, 0), sec.bloques.length - 1);
  if (nuevo === idx && idx !== 0) {
    // Ya está en el extremo
    return;
  }
  await abrirSeccion(sec.id, sec.bloques[nuevo].id);
}

function renderControlMateriales() {
  const cont = $('#controlMateriales');
  cont.innerHTML = '';

  Object.entries(TALLER.materiales).forEach(([id, m]) => {
    const a = el('a', 'mat' + (m.libre ? ' libre' : ''));
    a.href = m.archivo;
    a.target = '_blank';
    a.rel = 'noopener';
    a.appendChild(el('span', 'mat-ico', '📄'));
    const c = el('span', 'mat-cuerpo');
    c.appendChild(el('span', 'mat-tit', m.titulo));
    c.appendChild(el('span', 'mat-desc', m.momento + (m.libre ? ' · siempre disponible' : ' · se habilita con su sesión')));
    a.appendChild(c);
    if (!m.libre) a.appendChild(el('span', 'mat-momento', 'Con sesión'));
    cont.appendChild(a);
  });
}

function marcarSeccionActual(idSec, idBloque) {
  document.querySelectorAll('#controlSecciones .sec').forEach((n) => {
    n.classList.toggle('actual', n.dataset.sec === idSec);
  });
}

async function abrirSeccion(idSec, idBloque) {
  const clave = app.clave;

  const sec = TALLER.secciones.find((s) => s.id === idSec);
  const bloque = idBloque
    ? sec?.bloques.find((b) => b.id === idBloque)
    : sec?.bloques[0];

  const vistas = Array.from(new Set([...(app.estado?.secciones_vistas || []), idSec]));
  const patch = {
    seccion_actual: idSec,
    bloque_actual: bloque ? bloque.id : null,
    secciones_vistas: vistas,
  };

  if (SB_LISTO && !clave) {
    mostrarConfigError('No se encontró la clave de facilitador. Vuelve a entrar con tu PIN.');
    return;
  }

  try {
    await escribirEstado(clave, patch);
  } catch (e) {
    // Puede que la fila no exista todavía
    try {
      await crearEstado(app.sala, clave, patch);
      app.estado = { ...(app.estado || {}), ...patch };
      await emitirEstado(app.canal, app.estado);
    } catch (e2) {
      mostrarConfigError(e2.message);
      return;
    }
  }
  marcarSeccionActual(idSec, bloque ? bloque.id : null);
  guardarLS(LS.clave, clave);
  renderVistaPrevia();
}

async function escribirEstado(clave, patch) {
  if (!SB_LISTO) {
    // Modo local: solo para el facilitador
    app.estado = { ...(app.estado || {}), ...patch };
    return;
  }
  app.estado = await guardarEstado(app.sala, clave, patch);
  // Aviso instantáneo por broadcast (no depende de Replication)
  await emitirEstado(app.canal, app.estado);
}

function renderConectados() {
  const cont = $('#listaConectados');
  cont.innerHTML = '';
  if (!app.conectados.length) {
    cont.appendChild(el('p', 'conectados-vacio', 'Todavía nadie.'));
    return;
  }
  app.conectados.forEach((n) => cont.appendChild(el('span', 'conectado', n)));
}

function renderConfig() {
  const p = $('#configEstado');
  if (SB_LISTO) {
    p.textContent = 'Sala: ' + app.sala + ' · Sincronización activa.';
  } else {
    p.textContent =
      'Supabase no está configurado. Puedes abrir secciones, pero solo en esta pantalla: los docentes no lo verán hasta completar el README.md.';
  }
}

function mostrarConfigError(msg) {
  let d = $('#configEstado').parentNode.querySelector('.estado-msg');
  if (!d) {
    d = el('div', 'estado-msg estado-mal');
    $('#configEstado').parentNode.insertBefore(d, $('#configEstado'));
  }
  d.className = 'estado-msg estado-mal';
  d.textContent = msg;
}

// ------------------------------------------------------------------
// Controles del facilitador
// ------------------------------------------------------------------
function conectarTimer() {
  const btn = $('#btnTimer');
  $('#btnTimer').addEventListener('click', () => {
    if (app.timer.corriendo) {
      clearInterval(app.timer.iv);
      app.timer.corriendo = false;
      btn.textContent = 'Continuar';
      btn.classList.remove('peligro');
      btn.classList.add('primary');
    } else {
      app.timer.corriendo = true;
      btn.textContent = 'Pausar';
      btn.classList.remove('primary');
      btn.classList.add('peligro');
      app.timer.iv = setInterval(() => {
        app.timer.seg++;
        pintarTimer();
      }, 1000);
    }
  });
  $('#btnTimerReset').addEventListener('click', () => {
    clearInterval(app.timer.iv);
    app.timer.seg = 0;
    app.timer.corriendo = false;
    btn.textContent = 'Iniciar';
    btn.classList.remove('peligro');
    btn.classList.add('primary');
    pintarTimer();
  });
  pintarTimer();
}

function pintarTimer() {
  const m = Math.floor(app.timer.seg / 60);
  const s = app.timer.seg % 60;
  $('#timerValor').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function conectarControles() {
  const clave = () => app.clave;

  $('#btnEnviarMensaje').addEventListener('click', async () => {
    const m = $('#inpMensaje').value.trim();
    if (!m) return;
    try {
      await escribirEstado(clave(), { mensaje: m });
      guardarLS(LS.mensaje, m);
    } catch (e) {
      mostrarConfigError(e.message);
    }
  });

  $('#btnBorrarMensaje').addEventListener('click', async () => {
    $('#inpMensaje').value = '';
    try {
      await escribirEstado(clave(), { mensaje: '' });
      guardarLS(LS.mensaje, '');
    } catch (e) {
      mostrarConfigError(e.message);
    }
  });

  $('#btnDebug').addEventListener('click', async () => {
    try {
      await initSupabase();
      const est = await leerEstado(app.sala);
      const d = el('div', 'estado-msg estado-ok');
      d.textContent = est
        ? 'Conexión correcta. Sala "' + app.sala + '" existe. Sección actual: ' + est.seccion_actual
        : 'Conexión correcta. La sala "' + app.sala + '" todavía no existe; se crea sola al abrir la primera sección.';
      const cont = $('#configEstado').parentNode;
      const vieja = cont.querySelector('.estado-msg');
      if (vieja) vieja.remove();
      cont.insertBefore(d, $('#configEstado'));
      setConexion('ok', 'En vivo');
    } catch (e) {
      mostrarConfigError('Falló la prueba: ' + e.message);
    }
  });

  $('#btnCopiarLink').addEventListener('click', () => {
    const url = location.origin + location.pathname + '?sala=' + encodeURIComponent(app.sala);
    navigator.clipboard.writeText(url).then(() => {
      const b = $('#btnCopiarLink');
      const t = b.textContent;
      b.textContent = '¡Copiado!';
      setTimeout(() => (b.textContent = t), 2000);
    });
  });
}

// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  init();
  conectarControles();

  // Al volver a la pestaña, releer el estado: los móviles suspenden el
  // websocket en segundo plano y se pierden los avisos.
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    if (!SB_LISTO || !sb) return;
    try {
      const actual = await leerEstado(app.sala);
      if (actual) {
        app.estado = actual;
        if (app.rol === 'docente') aplicarEstado();
        if (app.rol === 'facilitador') {
          marcarSeccionActual(actual.seccion_actual, actual.bloque_actual);
          renderVistaPrevia();
        }
      }
    } catch {}
  });
});
