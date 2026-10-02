/* ==========================================================================
   Taller de Scratch · vistas docente y facilitador
   ========================================================================== */

// ------------------------------------------------------------------
// VISTA DOCENTE
// ------------------------------------------------------------------
/**
 * Dibuja la sesión abierta y el bloque (slide) que el facilitador está mostrando.
 * Si el bloque no existe todavía, se muestra el primero de la sesión.
 */
function renderSesionActual() {
  const cont = $('#sesionActual');
  const bc = $('#bloqueActual');
  if (!cont || !bc) return;

  // Sin estado aún: pantalla de bienvenida mientras el facilitador abre la sesión
  if (!app.estado?.seccion_actual) {
    cont.innerHTML = '';
    cont.appendChild(el('span', 'sesion-kicker', TALLER.entidad));
    cont.appendChild(el('h2', 'sesion-tit', TALLER.bienvenida?.titulo || 'Bienvenido al taller'));
    cont.appendChild(el('p', 'sesion-concepto', TALLER.bienvenida?.intro || ''));
    bc.innerHTML = '';
    bc.appendChild(el('p', 'bloque-texto', 'Cuando el facilitador abra la primera sección, verás aquí el paso actual.'));
    return;
  }

  const secId = app.estado.seccion_actual;
  const sec = TALLER.secciones.find((s) => s.id === secId) || TALLER.secciones[0];

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

  bc.innerHTML = '';

  const cab = el('div', 'bloque-cab');
  cab.appendChild(el('span', 'bloque-min', '⏱ ' + bloque.minutos + ' min'));
  const contBadge = el('span', 'bloque-cont', 'Paso ' + (idx + 1) + ' de ' + sec.bloques.length);
  cab.appendChild(contBadge);
  bc.appendChild(cab);

  bc.appendChild(el('h3', 'bloque-nombre', bloque.titulo));
  bc.appendChild(el('p', 'bloque-texto', bloque.paraDocentes));

  if (bloque.momentoWow) {
    const wow = el('div', 'momento-wow');
    wow.appendChild(el('span', 'wow-ico', '✨'));
    const txt = el('div');
    const lab = el('strong', null, 'Momento clave: ');
    txt.appendChild(lab);
    txt.appendChild(document.createTextNode(bloque.momentoWow));
    wow.appendChild(txt);
    bc.appendChild(wow);
  }

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

/** Tira compacta de avance: las sesiones + pasos de la actual. Sin scroll. */
function renderProgreso() {
  const cont = $('#progresoSesion');
  if (!cont) return;
  cont.innerHTML = '';

  const idActual = app.estado?.seccion_actual;
  const sec = TALLER.secciones.find((s) => s.id === idActual) || TALLER.secciones[0];
  let idx = 0;
  if (sec && app.estado?.bloque_actual) {
    idx = sec.bloques.findIndex((x) => x.id === app.estado.bloque_actual);
    if (idx < 0) idx = 0;
  }

  // Badge grande: Paso X de Y
  const badge = el('div', 'prog-badge');
  if (!idActual) {
    badge.appendChild(el('span', 'prog-badge-num', '—'));
    badge.appendChild(el('span', 'prog-badge-txt', 'Esperando al facilitador'));
  } else {
    badge.appendChild(el('span', 'prog-badge-num', (idx + 1) + ' / ' + sec.bloques.length));
    badge.appendChild(el('span', 'prog-badge-txt', 'Paso actual'));
  }
  cont.appendChild(badge);

  // Puntos de cada paso de la sesión
  if (sec && idActual) {
    const dots = el('div', 'prog-dots');
    sec.bloques.forEach((b, i) => {
      const d = el('span', 'prog-dot' + (i === idx ? ' actual' : '') + (i < idx ? ' hecho' : ''));
      d.title = b.titulo;
      d.setAttribute('aria-label', 'Paso ' + (i + 1) + ': ' + b.titulo);
      dots.appendChild(d);
    });
    cont.appendChild(dots);
  }

  // Título corto del paso
  if (idActual && sec?.bloques[idx]) {
    cont.appendChild(el('span', 'prog-paso-tit', sec.bloques[idx].titulo));
  }

  // Animación al cambiar de paso
  const pasoId = idActual && sec?.bloques[idx] ? sec.bloques[idx].id : '';
  if (pasoId && pasoId !== app.ultimoPasoId) {
    const cambió = !!app.ultimoPasoId;
    app.ultimoPasoId = pasoId;
    if (cambió && app.feedbackPaso !== false) {
      const badge = cont.querySelector('.prog-badge');
      const dot = cont.querySelector('.prog-dot.actual');
      if (badge) {
        badge.classList.remove('prog-pulse');
        void badge.offsetWidth;
        badge.classList.add('prog-pulse');
      }
      if (dot) {
        dot.classList.remove('prog-pulse');
        void dot.offsetWidth;
        dot.classList.add('prog-pulse');
      }
      const slide = document.querySelector('#vistaEnVivo .bloque.slide');
      if (slide) {
        slide.classList.remove('paso-nuevo');
        void slide.offsetWidth;
        slide.classList.add('paso-nuevo');
      }
      // Feedback háptico suave en móviles (si existe)
      try {
        if (navigator.vibrate) navigator.vibrate(12);
      } catch {}
    }
  }
}

/** Botones de descarga del material que toca en este paso, sin cambiar de pestaña. */
function renderMaterialDelPaso() {
  const cont = $('#materialDelPaso');
  if (!cont) return;
  cont.innerHTML = '';

  const ids = MATERIALES_POR_BLOQUE[app.estado?.bloque_actual] || [];
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

/**
 * Espejo exacto de lo que ven los docentes.
 * Usa los mismos componentes visuales (sesion-actual, bloque, pasos, materiales).
 */
function renderVistaPrevia() {
  const ses = $('#prevSesion');
  const bc = $('#prevBloque');
  const mat = $('#prevMaterial');
  const prog = $('#prevProgreso');
  const badge = $('#facEspejoBadge');
  if (!ses || !bc) return;

  // Sin sección abierta todavía
  if (!app.estado?.seccion_actual) {
    ses.innerHTML = '';
    ses.appendChild(el('span', 'sesion-kicker', TALLER.entidad));
    ses.appendChild(el('h2', 'sesion-tit', 'Aún no hay sección abierta'));
    ses.appendChild(el('p', 'sesion-concepto',
      'Cuando pulses «Abrir esta sección», los docentes verán aquí el mismo contenido que tú.'));
    bc.innerHTML = '';
    if (mat) mat.innerHTML = '';
    if (prog) prog.innerHTML = '';
    if (badge) badge.textContent = 'Sin sección abierta';
    renderNotasDelPaso(null);
    return;
  }

  const sec = TALLER.secciones.find((s) => s.id === app.estado.seccion_actual)
    || TALLER.secciones[0];
  let idx = sec.bloques.findIndex((b) => b.id === app.estado.bloque_actual);
  if (idx < 0) idx = 0;
  const bloque = sec.bloques[idx];

  if (badge) {
    badge.textContent = 'Sesión ' + sec.numero + ' · Paso ' + (idx + 1) + '/' + sec.bloques.length;
  }

  // Cabecera compacta: solo contexto del paso (sin producto ni concepto largo)
  ses.innerHTML = '';
  ses.appendChild(el('span', 'sesion-kicker',
    'Sesión ' + sec.numero + ' · Paso ' + (idx + 1) + ' de ' + sec.bloques.length
    + ' · Minutos ' + (bloque.minutos || '—')));
  ses.appendChild(el('h2', 'sesion-tit', bloque.titulo));

  // Mensaje activo del facilitador (si hay)
  if (app.estado.mensaje) {
    const av = el('div', 'prev-aviso', '📣 ' + app.estado.mensaje);
    ses.appendChild(av);
  }

  // Cuerpo del paso: texto y pasos que ve el docente
  bc.innerHTML = '';
  bc.appendChild(el('p', 'bloque-texto', bloque.paraDocentes));

  if (bloque.momentoWow) {
    const wow = el('div', 'momento-wow');
    wow.appendChild(el('span', 'wow-ico', '✨'));
    const txt = el('div');
    txt.appendChild(el('strong', null, 'Momento clave: '));
    txt.appendChild(document.createTextNode(bloque.momentoWow));
    wow.appendChild(txt);
    bc.appendChild(wow);
  }

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

  // Materiales de este paso
  if (mat) {
    mat.innerHTML = '';
    const ids = MATERIALES_POR_BLOQUE[bloque.id] || [];
    const disponibles = ids.filter((id) => TALLER.materiales[id]);
    if (disponibles.length) {
      mat.appendChild(el('h3', 'matpaso-tit', '📄 Material de este paso (lo ven los docentes)'));
      disponibles.forEach((id) => {
        const m = TALLER.materiales[id];
        const a = el('a', 'btn primary btn-mini');
        a.href = m.archivo;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = '⬇ ' + m.titulo;
        mat.appendChild(a);
      });
    }
  }

  // Progreso (mismo lenguaje visual que el docente)
  if (prog) {
    prog.innerHTML = '';
    const badge = el('div', 'prog-badge');
    badge.appendChild(el('span', 'prog-badge-num', (idx + 1) + ' / ' + sec.bloques.length));
    badge.appendChild(el('span', 'prog-badge-txt', 'Paso actual'));
    prog.appendChild(badge);
    const dots = el('div', 'prog-dots');
    sec.bloques.forEach((b, i) => {
      const d = el('span', 'prog-dot' + (i === idx ? ' actual' : '') + (i < idx ? ' hecho' : ''));
      d.title = b.titulo;
      dots.appendChild(d);
    });
    prog.appendChild(dots);
  }

  // Notas privadas del paso actual
  renderNotasDelPaso(bloque);

  // Estado de botones de navegación
  const btnPrev = $('#btnPrevPaso');
  const btnNext = $('#btnNextPaso');
  if (btnPrev) btnPrev.disabled = idx <= 0;
  if (btnNext) btnNext.disabled = idx >= sec.bloques.length - 1;

  // Si está en modo proyección, refrescar diapositiva
  if (document.body.classList.contains('proyiendo')) {
    renderProyeccion();
  }
}

/** Notas privadas del facilitador para el paso actual (guion). */
function renderNotasDelPaso(bloque) {
  const cont = $('#notasDelPaso');
  if (!cont) return;
  cont.innerHTML = '';
  if (!bloque) {
    cont.appendChild(el('p', 'bloque-nota',
      'Abre una sección para ver aquí el guion de ese paso.'));
    return;
  }
  cont.appendChild(el('h3', 'notas-paso-tit', bloque.titulo));
  if (bloque.minutos) {
    cont.appendChild(el('p', 'bloque-nota', '⏱ Minutos ' + bloque.minutos));
  }
  if (bloque.momentoWow) {
    const w = el('div', 'momento-wow');
    w.appendChild(el('span', 'wow-ico', '✨'));
    const tx = el('div');
    tx.appendChild(el('strong', null, 'Busca este momento: '));
    tx.appendChild(document.createTextNode(bloque.momentoWow));
    w.appendChild(tx);
    cont.appendChild(w);
  }
  if (bloque.guioFacilitador) {
    const g = el('div', 'notas-guion');
    g.textContent = bloque.guioFacilitador;
    cont.appendChild(g);
  } else {
    cont.appendChild(el('p', 'bloque-nota', 'Sin notas específicas para este paso.'));
  }
}

// ---------------------------------------------------------------------------
// MODO PROYECCIÓN (pantalla completa solo diapositiva)
// ---------------------------------------------------------------------------
function obtenerPasoActual() {
  if (!app.estado?.seccion_actual) return null;
  const sec = TALLER.secciones.find((s) => s.id === app.estado.seccion_actual);
  if (!sec) return null;
  let idx = sec.bloques.findIndex((b) => b.id === app.estado.bloque_actual);
  if (idx < 0) idx = 0;
  return { sec, idx, bloque: sec.bloques[idx] };
}

function renderProyeccion() {
  const slide = $('#proySlide');
  const pasoLbl = $('#proyPaso');
  if (!slide) return;

  const actual = obtenerPasoActual();
  slide.innerHTML = '';

  if (!actual) {
    slide.appendChild(el('p', 'proy-vacio', 'Abre una sección para proyectar.'));
    if (pasoLbl) pasoLbl.textContent = '—';
    return;
  }

  const { sec, idx, bloque } = actual;
  if (pasoLbl) {
    pasoLbl.textContent = 'Sesión ' + sec.numero + ' · Paso ' + (idx + 1) + '/' + sec.bloques.length;
  }

  slide.appendChild(el('span', 'proy-kicker',
    'Minutos ' + (bloque.minutos || '—') + ' · Paso ' + (idx + 1) + ' de ' + sec.bloques.length));
  slide.appendChild(el('h1', 'proy-tit', bloque.titulo));
  slide.appendChild(el('p', 'proy-texto', bloque.paraDocentes));

  if (bloque.momentoWow) {
    const wow = el('div', 'momento-wow');
    wow.appendChild(el('span', 'wow-ico', '✨'));
    const txt = el('div');
    txt.appendChild(el('strong', null, 'Momento clave: '));
    txt.appendChild(document.createTextNode(bloque.momentoWow));
    wow.appendChild(txt);
    slide.appendChild(wow);
  }

  if (bloque.pasos && bloque.pasos.length) {
    const ul = el('ul', 'proy-pasos');
    bloque.pasos.forEach((p, i) => {
      const li = el('li');
      li.appendChild(el('span', 'paso-n', String(i + 1)));
      li.appendChild(el('span', null, p));
      ul.appendChild(li);
    });
    slide.appendChild(ul);
  }

  if (app.estado?.mensaje) {
    slide.appendChild(el('div', 'proy-aviso', '📣 ' + app.estado.mensaje));
  }

  const btnPrev = $('#proyPrev');
  const btnNext = $('#proyNext');
  if (btnPrev) btnPrev.disabled = idx <= 0;
  if (btnNext) btnNext.disabled = idx >= sec.bloques.length - 1;
}

let __proyBarraTimer = null;

function mostrarBarraProyeccion(ms = 2800) {
  const capa = $('#modoProyeccion');
  if (!capa) return;
  capa.classList.add('barra-visible');
  clearTimeout(__proyBarraTimer);
  if (ms > 0) {
    __proyBarraTimer = setTimeout(() => {
      capa.classList.remove('barra-visible');
    }, ms);
  }
}

function ocultarBarraProyeccion() {
  const capa = $('#modoProyeccion');
  if (!capa) return;
  clearTimeout(__proyBarraTimer);
  capa.classList.remove('barra-visible');
}

function entrarProyeccion() {
  const capa = $('#modoProyeccion');
  if (!capa) return;
  capa.hidden = false;
  document.body.classList.add('proyiendo');
  renderProyeccion();
  mostrarBarraProyeccion(3200); // se ve un momento al entrar
  // Intentar fullscreen del navegador (opcional)
  try {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  } catch {}
}

function salirProyeccion() {
  const capa = $('#modoProyeccion');
  if (capa) {
    capa.hidden = true;
    capa.classList.remove('barra-visible');
  }
  clearTimeout(__proyBarraTimer);
  document.body.classList.remove('proyiendo');
  try {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch {}
}

async function proyNavegar(delta) {
  const actual = obtenerPasoActual();
  if (!actual) {
    const sec = TALLER.secciones[0];
    await abrirSeccion(sec.id, sec.bloques[0].id);
    mostrarBarraProyeccion(2000);
    return;
  }
  await irABloque(actual.sec, delta);
  mostrarBarraProyeccion(2000); // flash de la barra al cambiar de paso
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

/** ¿Este material ya se puede descargar? (según el paso actual) */
function abrirMaterial(idMat) {
  const secId = app.estado?.seccion_actual;
  const sec = TALLER.secciones.find((s) => s.id === secId);
  if (!sec) return false;
  const idxActual = sec.bloques.findIndex((b) => b.id === app.estado?.bloque_actual);
  if (idxActual < 0) return false;
  return sec.bloques.some(
    (b, i) => i <= idxActual && (MATERIALES_POR_BLOQUE[b.id] || []).includes(idMat),
  );
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

  // El facilitador ve su versión con notas
  const fuente = TALLER.materialesFacilitador || TALLER.materiales;

  Object.entries(fuente).forEach(([id, m]) => {
    const a = el('a', 'mat' + (m.libre ? ' libre' : ''));
    a.href = m.archivo;
    a.target = '_blank';
    a.rel = 'noopener';
    a.appendChild(el('span', 'mat-ico', '📄'));
    const c = el('span', 'mat-cuerpo');
    c.appendChild(el('span', 'mat-tit', m.titulo));
    c.appendChild(el('span', 'mat-desc', m.momento + (m.libre ? ' · siempre disponible' : ' · se habilita con su paso')));
    a.appendChild(c);
    if (!m.libre) a.appendChild(el('span', 'mat-momento', 'Con paso'));
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
  renderVistaPrevia();
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

function conectarControles() {
  const clave = () => app.clave;

  // Navegación del espejo: anterior / siguiente / abrir
  const btnPrev = $('#btnPrevPaso');
  const btnNext = $('#btnNextPaso');
  const btnAbrir = $('#btnAbrirSeccionActual');
  if (btnPrev && !btnPrev.dataset.listo) {
    btnPrev.dataset.listo = '1';
    btnPrev.addEventListener('click', async () => {
      const sec = TALLER.secciones.find((s) => s.id === app.estado?.seccion_actual)
        || TALLER.secciones[0];
      await irABloque(sec, -1);
    });
  }
  if (btnNext && !btnNext.dataset.listo) {
    btnNext.dataset.listo = '1';
    btnNext.addEventListener('click', async () => {
      const sec = TALLER.secciones.find((s) => s.id === app.estado?.seccion_actual)
        || TALLER.secciones[0];
      // Si aún no hay sección abierta, abrir la primera
      if (!app.estado?.seccion_actual) {
        await abrirSeccion(sec.id, sec.bloques[0].id);
        return;
      }
      await irABloque(sec, 1);
    });
  }
  if (btnAbrir && !btnAbrir.dataset.listo) {
    btnAbrir.dataset.listo = '1';
    btnAbrir.addEventListener('click', async () => {
      const sec = TALLER.secciones.find((s) => s.id === app.estado?.seccion_actual)
        || TALLER.secciones[0];
      const bloqueId = app.estado?.bloque_actual || sec.bloques[0].id;
      await abrirSeccion(sec.id, bloqueId);
    });
  }

  // Modo proyección
  const btnProy = $('#btnProyectar');
  if (btnProy && !btnProy.dataset.listo) {
    btnProy.dataset.listo = '1';
    btnProy.addEventListener('click', entrarProyeccion);
  }
  const proyPrev = $('#proyPrev');
  const proyNext = $('#proyNext');
  const proyCerrar = $('#proyCerrar');
  if (proyPrev && !proyPrev.dataset.listo) {
    proyPrev.dataset.listo = '1';
    proyPrev.addEventListener('click', () => proyNavegar(-1));
  }
  if (proyNext && !proyNext.dataset.listo) {
    proyNext.dataset.listo = '1';
    proyNext.addEventListener('click', () => proyNavegar(1));
  }
  if (proyCerrar && !proyCerrar.dataset.listo) {
    proyCerrar.dataset.listo = '1';
    proyCerrar.addEventListener('click', salirProyeccion);
  }
  if (!window.__proyTeclado) {
    window.__proyTeclado = true;
    document.addEventListener('keydown', (ev) => {
      if (!document.body.classList.contains('proyiendo')) return;
      if (ev.key === 'Escape') { salirProyeccion(); return; }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); proyNavegar(-1); }
      if (ev.key === 'ArrowRight' || ev.key === ' ') { ev.preventDefault(); proyNavegar(1); }
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.body.classList.contains('proyiendo')) {
        salirProyeccion();
      }
    });
    // Mostrar barra al acercar el mouse abajo; ocultar al subir
    document.addEventListener('mousemove', (ev) => {
      if (!document.body.classList.contains('proyiendo')) return;
      const capa = $('#modoProyeccion');
      if (!capa) return;
      const cercaAbajo = ev.clientY > window.innerHeight - 90;
      if (cercaAbajo) {
        mostrarBarraProyeccion(0); // se queda mientras el mouse esté abajo
      } else if (capa.classList.contains('barra-visible') && !__proyBarraTimer) {
        // solo auto-oculta si no hay timer activo de un cambio de paso
        mostrarBarraProyeccion(900);
      }
    });
    // Al entrar en la barra, mantenerla visible
    const barra = document.querySelector('.proy-barra');
    if (barra) {
      barra.addEventListener('mouseenter', () => mostrarBarraProyeccion(0));
      barra.addEventListener('mouseleave', () => mostrarBarraProyeccion(1200));
    }
  }

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
