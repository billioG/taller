/* ==========================================================================
   Taller de Scratch · cronómetro, certificados, piso, Scratch, toasts
   ========================================================================== */

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

// ============================================================================
// NUEVAS FUNCIONALIDADES: Certificados, Piso/Palabra, Scratch, Animaciones
// ============================================================================

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------
function mostrarToast(mensaje, tipo = 'info', duracion = 4000) {
  const contenedor = document.createElement('div');
  contenedor.className = 'toast' + (tipo === 'ok' ? ' ok' : tipo === 'err' ? ' err' : tipo === 'alerta' ? ' alerta' : '');
  contenedor.setAttribute('role', 'status');
  contenedor.textContent = mensaje;
  document.body.appendChild(contenedor);
  setTimeout(() => {
    contenedor.style.opacity = '0';
    contenedor.style.transform = 'translateY(20px)';
    setTimeout(() => contenedor.remove(), 300);
  }, duracion);
}

/** Aviso sonoro corto (opcional: si el navegador no deja, se ignora) + vibración. */
function sonar() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ctx = app.audioCtx || (app.audioCtx = new Ctx());
      const t0 = ctx.currentTime;
      [880, 1175].forEach((hz, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = hz;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.18 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.18 + 0.16);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + i * 0.18);
        o.stop(t0 + i * 0.18 + 0.18);
      });
    }
  } catch {}
  try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch {}
}

/** Mensaje del facilitador a pantalla grande (docentes). */
let __ovTimer = null;
function mostrarMensajeGrande(texto) {
  const ov = $('#overlayMensaje');
  if (!ov) return;
  $('#ovTexto').textContent = texto;
  ov.hidden = false;
  sonar();
  clearTimeout(__ovTimer);
  __ovTimer = setTimeout(() => { ov.hidden = true; }, 15000);
  const cerrar = $('#ovCerrar');
  if (cerrar) cerrar.focus();
}

// ---------------------------------------------------------------------------
// CERTIFICADOS
// ---------------------------------------------------------------------------
async function generarCertificados() {
  if (!TALLER.certificado?.habilitado) return;
  const clave = app.clave;
  if (!clave) {
    mostrarConfigError('No hay clave de facilitador.');
    return;
  }

  const btn = $('#btnFinalizarTaller');
  const originalText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }

  try {
    // Participantes conectados (sin repetir ni contar al facilitador)
    const conectados = [...new Set((app.conectados || []).filter(n => n && n !== 'Facilitador'))];

    if (!conectados.length) {
      mostrarToast('No hay participantes conectados con nombre para certificar', 'err');
      return;
    }

    // Guardar lista de certificados en el estado
    const certificados = conectados.map(nombre => ({
      nombre,
      fecha: new Date().toISOString().split('T')[0],
      entidad: TALLER.certificado.entidad,
      duracion: TALLER.certificado.duracion,
      titulo: TALLER.certificado.titulo,
      subtitulo: TALLER.certificado.subtitulo,
    }));

    await escribirEstado(clave, {
      certificados_generados: certificados,
      taller_finalizado: true,
    });

    renderCertificadosGenerados(certificados);
    mostrarToast(`${certificados.length} certificados generados`, 'ok');

    // Notificar a cada participante (broadcast ya lo hace via estado)
    // El participante verá su certificado en su pestaña Materiales
  } catch (e) {
    mostrarToast('Error: ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = originalText; }
  }
}

async function reabrirTaller() {
  try {
    await escribirEstado(app.clave, { taller_finalizado: false, certificados_generados: null });
    renderCertificadosGenerados([]);
    mostrarToast('Taller reabierto: los docentes ya no ven «finalizado»', 'ok');
  } catch (e) {
    mostrarToast('Error: ' + e.message, 'err');
  }
}

function renderCertificadosGenerados(certificados) {
  const cont = $('#certificadosGenerados');
  cont.innerHTML = '';
  if (!certificados?.length) {
    cont.appendChild(el('p', 'certificados-vacio', 'Ningún certificado generado aún.'));
    return;
  }
  certificados.forEach(c => {
    const item = el('div', 'cert-item');
    item.appendChild(el('span', 'cert-nombre', c.nombre));
    const btn = el('button', 'btn btn-mini cert-descargar', 'Descargar');
    btn.type = 'button';
    btn.addEventListener('click', () => descargarCertificado(c));
    item.appendChild(btn);
    cont.appendChild(item);
  });
}

function descargarCertificado(cert) {
  // Generar HTML del certificado y abrir para imprimir/guardar como PDF
  const html = generarHtmlCertificado(cert);
  const w = window.open('', '_blank');
  if (!w) {
    mostrarToast('Tu navegador bloqueó la ventana. Permite ventanas emergentes para imprimir el certificado.', 'err', 7000);
    return;
  }
  w.opener = null;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

function generarHtmlCertificado(c) {
  // Logo inline (cubo oficial)
  const cubo = `<svg viewBox="0 0 100 100" width="48" height="48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="none" stroke="#202124" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M50,50 L18,32 M50,50 L82,32 M50,50 L50,85" fill="none" stroke="#202124" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`;

  // Firma del facilitador (PNG embebido para imprimir sin red)
  const firmaSrc = 'data:image/png;base64,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';

  // TODO lo que viene de la base/red se escapa: el nombre lo escribe cada participante.
  const nombre = esc(c.nombre || '________________');
  const fechaOk = /^\d{4}-\d{2}-\d{2}$/.test(c.fecha || '');
  const mesAnio = esc((fechaOk ? new Date(c.fecha + 'T12:00:00Z') : new Date())
    .toLocaleDateString('es', { month: 'long', year: 'numeric', timeZone: 'UTC' }));

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Certificado — ${nombre}</title>
<style>
@page { size: letter landscape; margin: 12mm 14mm; }
*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%}
body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  font-size:11pt;line-height:1.45;color:#202124;background:#fff;
  display:flex;align-items:center;justify-content:center;
}
.cert{
  border:3px solid #202124;border-radius:12px;
  padding:22px 40px 18px;
  text-align:center;
  width:100%;max-width:980px;
  background:#fff;
  display:flex;flex-direction:column;justify-content:center;
  min-height:180mm;
}
.cert-logo{margin:0 auto 6px}
.cert-sello{font-size:9.5pt;text-transform:uppercase;letter-spacing:.18em;color:#202124;font-weight:800;margin-bottom:4px}
.cert-tit{font-size:22pt;margin:0 0 2px;color:#202124;letter-spacing:.02em}
.cert-sub{font-size:12pt;margin:0 0 10px;color:#202124}
.cert-linea{
  width:70%;margin:10px auto 4px;border-bottom:1.5px solid #202124;
  min-height:28pt;font-size:18pt;font-weight:700;color:#202124;
  display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;
}
.cert-body{
  margin:12px auto 0;text-align:center;max-width:720px;
  font-size:11pt;line-height:1.5;
}
.cert-modulos{
  display:grid;grid-template-columns:1fr 1fr;gap:4px 28px;
  text-align:left;max-width:640px;margin:14px auto 8px;font-size:10pt;padding:0;
}
.cert-modulos li{list-style:none;padding:3px 0 3px 18px;position:relative;border-bottom:1px solid #cfcfcf}
.cert-modulos li::before{content:"▸";position:absolute;left:0;color:#202124}
.firma-bloque{margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:2px}
.firma-bloque img{height:64px;width:auto;object-fit:contain}
.firma-linea{width:200px;border-top:1px solid #202124;margin-top:2px;padding-top:4px;font-size:9pt;color:#202124}
@media print{
  .no-print{display:none!important}
  body{background:#fff}
  .cert{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;border-color:#202124}
}
</style>
</head>
<body>
<div class="cert">
  <div class="cert-logo">${cubo}</div>
  <div class="cert-sello">Yo Aprendo · Certifica</div>
  <h1 class="cert-tit">${esc(c.titulo || 'Certificado de finalización')}</h1>
  <p class="cert-sub">${esc(c.subtitulo || 'Taller de Programación Visual con Scratch')}</p>
  <p style="margin:0;">Se otorga a</p>
  <div class="cert-linea">${nombre}</div>
  <p class="cert-body">
    Por haber construido un proyecto interactivo funcional sobre un contenido
    de su propia asignatura, junto con un plan de clase para aplicarlo
    con sus estudiantes, dado en el mes de ${mesAnio}.
  </p>
  <ul class="cert-modulos">
    <li>Construcción de un recurso interactivo funcional</li>
    <li>Secuencia, condición e interacción</li>
    <li>Diseño de una actividad evaluable</li>
    <li>Esquema de una clase de 45 minutos</li>
  </ul>
  <div class="firma-bloque">
    <img src="${firmaSrc}" alt="Firma">
    <div class="firma-linea">Firma del facilitador</div>
  </div>
</div>
<div class="no-print" style="position:fixed;bottom:12px;left:0;right:0;text-align:center;color:#202124;font-size:9pt">
  Usa imprimir → orientación horizontal (horizontal / landscape)
</div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// PISO / PALABRA (Solicitud / Concesión bidireccional)
// ---------------------------------------------------------------------------
const PISO_ESTADOS = {
  NADA: 'nada',
  SOLICITANDO: 'solicitando',      // participante pidió
  CONCEDIDO: 'concedido',          // facilitador dio el piso
  INVITADO: 'invitado',            // facilitador invitó
  ACEPTADO: 'aceptado',            // participante aceptó invitación
};

let pisoLocal = { estado: PISO_ESTADOS.NADA, quien: null, timeoutId: null };

function renderPisoFacilitador() {
  const cont = $('#listaPiso');
  cont.innerHTML = '';
  if (!app.conectados.length) {
    cont.appendChild(el('p', 'piso-vacio', 'Todavía nadie conectado.'));
    return;
  }
  app.conectados.forEach(nombre => {
    if (nombre === 'Facilitador') return;
    const item = el('div', 'piso-item');
    const estado = app.estado?.piso?.[nombre]?.estado || PISO_ESTADOS.NADA;
    if (estado === PISO_ESTADOS.CONCEDIDO || estado === PISO_ESTADOS.ACEPTADO) {
      item.classList.add('tiene-piso');
    }
    if (estado === PISO_ESTADOS.SOLICITANDO) item.classList.add('pidiendo');
    item.appendChild(el('span', 'piso-nombre', nombre));
    const badge = el('span', 'piso-badge', textoEstadoPiso(estado));
    item.appendChild(badge);
    const acc = el('div', 'piso-acciones');
    if (estado === PISO_ESTADOS.NADA) {
      const btnInv = el('button', 'btn btn-mini', 'Invitar');
      btnInv.addEventListener('click', () => invitarPiso(nombre));
      acc.appendChild(btnInv);
      const btnSol = el('button', 'btn btn-mini primary', 'Conceder piso');
      btnSol.addEventListener('click', () => concederPiso(nombre));
      acc.appendChild(btnSol);
    } else if (estado === PISO_ESTADOS.SOLICITANDO) {
      const btnCon = el('button', 'btn btn-mini primary', 'Conceder');
      btnCon.addEventListener('click', () => concederPiso(nombre));
      acc.appendChild(btnCon);
      const btnRech = el('button', 'btn btn-mini ghost', 'Ignorar');
      btnRech.addEventListener('click', () => limpiarPiso(nombre));
      acc.appendChild(btnRech);
    } else if (estado === PISO_ESTADOS.INVITADO) {
      const btnCan = el('button', 'btn btn-mini peligro', 'Cancelar invitación');
      btnCan.addEventListener('click', () => limpiarPiso(nombre));
      acc.appendChild(btnCan);
    } else if (estado === PISO_ESTADOS.CONCEDIDO || estado === PISO_ESTADOS.ACEPTADO) {
      const btnQuitar = el('button', 'btn btn-mini peligro', 'Quitar piso');
      btnQuitar.addEventListener('click', () => quitarPiso(nombre));
      acc.appendChild(btnQuitar);
    }
    item.appendChild(acc);
    cont.appendChild(item);
  });
}

function textoEstadoPiso(estado) {
  switch (estado) {
    case PISO_ESTADOS.SOLICITANDO: return '🙋 Pidió la palabra';
    case PISO_ESTADOS.CONCEDIDO: return '🎤 Tiene la palabra';
    case PISO_ESTADOS.INVITADO: return '📨 Invitado';
    case PISO_ESTADOS.ACEPTADO: return '🎤 Tiene la palabra (invitado)';
    default: return '';
  }
}

async function actualizarPisoEnEstado(nombre, nuevoEstado) {
  if (!SB_LISTO) {
    const piso = { ...(app.estado?.piso || {}) };
    if (nuevoEstado === PISO_ESTADOS.NADA) delete piso[nombre];
    else piso[nombre] = { estado: nuevoEstado, desde: Date.now() };
    app.estado = { ...(app.estado || {}), piso };
    return;
  }
  // Transición atómica en el servidor; los docentes no necesitan clave,
  // el servidor limita qué pueden hacer. El facilitador la envía y puede todo.
  try {
    const clave = app.rol === 'facilitador' ? app.clave : null;
    app.estado = await pisoActualizar(app.sala, nombre, nuevoEstado, clave);
    await emitirEstado(app.canal);
  } catch (e) {
    mostrarToast(e.message, 'err');
    refrescarEstado();
    throw e;
  }
}

async function solicitarPiso() {
  if (app.rol !== 'docente') return;
  await actualizarPisoEnEstado(app.nombre, PISO_ESTADOS.SOLICITANDO);
  mostrarToast('🙋 Pediste la palabra. El facilitador lo está viendo.', 'ok', 4000);
  renderPisoParticipante();
  // La solicitud caduca sola si el facilitador no responde
  clearTimeout(pisoLocal.timeoutId);
  const ms = TALLER.piso?.timeoutSolicitud || 30000;
  pisoLocal.timeoutId = setTimeout(async () => {
    if (app.estado?.piso?.[app.nombre]?.estado === PISO_ESTADOS.SOLICITANDO) {
      try { await actualizarPisoEnEstado(app.nombre, PISO_ESTADOS.NADA); } catch {}
      renderPisoParticipante();
      mostrarToast('Tu solicitud caducó. Puedes volver a pedir la palabra.', 'info');
    }
  }, ms);
}

async function invitarPiso(nombre) {
  await actualizarPisoEnEstado(nombre, PISO_ESTADOS.INVITADO);
  renderPisoFacilitador();
  mostrarToast(`Invitado a ${nombre}`, 'info');
}

async function concederPiso(nombre) {
  await actualizarPisoEnEstado(nombre, PISO_ESTADOS.CONCEDIDO);
  if (app.rol === 'facilitador') renderPisoFacilitador();
  else renderPisoParticipante();
  mostrarToast(nombre === app.nombre ? 'Tienes la palabra' : `Piso concedido a ${nombre}`, 'ok');
}

async function quitarPiso(nombre) {
  await actualizarPisoEnEstado(nombre, PISO_ESTADOS.NADA);
  if (app.rol === 'facilitador') renderPisoFacilitador();
  else renderPisoParticipante();
  mostrarToast(`Piso quitado a ${nombre}`, 'info');
}

async function limpiarPiso(nombre) {
  await actualizarPisoEnEstado(nombre, PISO_ESTADOS.NADA);
  if (app.rol === 'facilitador') renderPisoFacilitador();
  else renderPisoParticipante();
}

function renderPisoParticipante() {
  const cont = $('#pisoParticipante');
  const acc = $('#pisoAcciones');
  const estadoDiv = $('#pisoEstado');
  if (!cont || !acc || !estadoDiv) return;
  if (!TALLER.piso?.habilitado || app.rol !== 'docente') {
    cont.hidden = true;
    return;
  }
  const miEstado = app.estado?.piso?.[app.nombre]?.estado || PISO_ESTADOS.NADA;

  // Aviso fuerte cuando el facilitador te invita o te da la palabra
  if (miEstado !== app.pisoPrev) {
    if (miEstado === PISO_ESTADOS.INVITADO) {
      mostrarToast('📨 El facilitador te invita a hablar', 'alerta', 8000);
      sonar();
    } else if (miEstado === PISO_ESTADOS.CONCEDIDO) {
      mostrarToast('🎤 ¡Tienes la palabra!', 'ok', 6000);
      sonar();
    } else if (app.pisoPrev === PISO_ESTADOS.SOLICITANDO && miEstado === PISO_ESTADOS.NADA && app.pisoPrevSolicitud) {
      mostrarToast('El facilitador no pudo darte la palabra ahora', 'info', 5000);
    }
    app.pisoPrev = miEstado;
  }
  app.pisoPrevSolicitud = miEstado === PISO_ESTADOS.SOLICITANDO;

  cont.className = 'piso-participante ' + (
    miEstado === PISO_ESTADOS.NADA ? 'p-nada'
    : miEstado === PISO_ESTADOS.SOLICITANDO ? 'p-solicitando'
    : miEstado === PISO_ESTADOS.INVITADO ? 'p-invitado' : 'p-tiene');
  cont.hidden = false;
  acc.innerHTML = '';
  estadoDiv.textContent = '';

  const accion = (txt, cls, fn) => {
    const b = el('button', 'btn ' + cls, txt);
    b.type = 'button';
    b.addEventListener('click', async () => {
      b.disabled = true;
      try { await fn(); } catch {}
      renderPisoParticipante();
    });
    acc.appendChild(b);
  };

  if (miEstado === PISO_ESTADOS.NADA) {
    accion('🙋 Pedir la palabra', 'primary', solicitarPiso);
  } else if (miEstado === PISO_ESTADOS.SOLICITANDO) {
    estadoDiv.textContent = '⏳ Esperando respuesta del facilitador…';
    accion('Cancelar solicitud', 'peligro', () => limpiarPiso(app.nombre));
  } else if (miEstado === PISO_ESTADOS.INVITADO) {
    estadoDiv.textContent = '📨 El facilitador te invita a tomar la palabra';
    accion('Aceptar', 'primary', () => actualizarPisoEnEstado(app.nombre, PISO_ESTADOS.ACEPTADO));
    accion('Rechazar', 'peligro', () => limpiarPiso(app.nombre));
  } else if (miEstado === PISO_ESTADOS.CONCEDIDO || miEstado === PISO_ESTADOS.ACEPTADO) {
    estadoDiv.textContent = '🎤 ¡Tienes la palabra!';
    accion('Terminar mi participación', 'peligro', () => limpiarPiso(app.nombre));
  }
}

// ---------------------------------------------------------------------------
// SCRATCH IFRAME EMBEBIDO
// ---------------------------------------------------------------------------
let scratchProjectIdActual = null;

async function cargarScratchEnDocentes() {
  const input = $('#inpScratchProjectId');
  const pid = input.value.trim();
  if (!/^\d+$/.test(pid)) {
    mostrarToast('ID inválido (solo números)', 'err');
    return;
  }
  scratchProjectIdActual = pid;
  const url = urlScratch(pid, Date.now());
  try {
    await escribirEstado(app.clave, { scratch_project_id: pid, scratch_url: url });
  } catch (e) {
    mostrarToast('Error: ' + e.message, 'err');
    return;
  }
  $('#scratchEstado').textContent = '✅ Cargado para los docentes';
  mostrarToast('Scratch cargado en vista docentes', 'ok');
}

async function limpiarScratch() {
  scratchProjectIdActual = null;
  try {
    await escribirEstado(app.clave, { scratch_project_id: null, scratch_url: null });
  } catch (e) {
    mostrarToast('Error: ' + e.message, 'err');
    return;
  }
  $('#scratchEstado').textContent = '';
  $('#inpScratchProjectId').value = '';
  mostrarToast('Scratch quitado de la vista docentes', 'info');
}

/** URL del iframe de Scratch. Solo con ID numérico; /embed porque el editor no admite iframes. */
function urlScratch(pid, v) {
  return TALLER.scratch.editorBaseUrl + pid + (TALLER.scratch.sufijo || '/embed') + (v ? '?v=' + v : '');
}

/** Versión de refresco guardada por el facilitador en scratch_url (?v=NNN). */
function versionScratch() {
  const m = /[?]v=(\d{1,15})$/.exec(String(app.estado?.scratch_url || ''));
  return m ? m[1] : '';
}

/** Facilitador: obliga a los docentes a recargar el visor de Scratch con la última versión guardada. */
async function refrescarScratch() {
  const pid = String(app.estado?.scratch_project_id || scratchProjectIdActual || '');
  if (!/^\d{1,20}$/.test(pid)) {
    mostrarToast('Primero carga un proyecto de Scratch', 'err');
    return;
  }
  try {
    await escribirEstado(app.clave, { scratch_project_id: pid, scratch_url: urlScratch(pid, Date.now()) });
    mostrarToast('Vista de Scratch actualizada para los docentes', 'ok');
  } catch (e) {
    mostrarToast('Error: ' + e.message, 'err');
  }
}

function renderScratchDocente() {
  const cont = $('#scratchIframeContenedor');
  const info = $('#scratchInfo');
  if (!cont || !info) return;
  const pid = String(app.estado?.scratch_project_id || '');
  if (!/^\d{1,20}$/.test(pid)) {
    cont.innerHTML = '';
    delete cont.dataset.pid;
    info.hidden = true;
    $('#tabScratch').hidden = true;
    if (app.rol === 'docente' && !$('#vistaScratch').hidden && window.__irAEnVivo) window.__irAEnVivo();
    return;
  }
  // Solo se recrea el iframe si cambió el proyecto o el facilitador pulsó «Actualizar»
  const ver = versionScratch();
  const clave = pid + '|' + ver;
  if (cont.dataset.pid !== clave) {
    if (cont.dataset.pid && app.rol === 'docente') mostrarToast('🐱 El facilitador actualizó el proyecto de Scratch', 'info', 5000);
    cont.innerHTML = '';
    const f = document.createElement('iframe');
    f.src = urlScratch(pid, ver);
    f.title = 'Scratch: proyecto ' + pid;
    f.setAttribute('allow', 'clipboard-write; fullscreen');
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
    f.setAttribute('referrerpolicy', 'no-referrer');
    cont.appendChild(f);
    cont.dataset.pid = clave;
  }
  info.hidden = false;
  info.textContent = 'Proyecto Scratch #' + pid + ' — en vivo';
  if (app.rol === 'docente') $('#tabScratch').hidden = false;
}

// ---------------------------------------------------------------------------
// ANIMACIÓN DE MENSAJE NUEVO + TOAST
// ---------------------------------------------------------------------------
function aplicarEstado() {
  const e = app.estado;
  if (!e) return;

  // Mensaje del facilitador: animación y toast SOLO cuando el texto cambia.
  const aviso = $('#aviso');
  if (aviso) {
    if (e.mensaje) {
      aviso.hidden = false;
      const at = $('#avisoTexto');
      if (at) at.textContent = e.mensaje;
      if (e.mensaje !== app.ultimoMensajeVisto) {
        app.ultimoMensajeVisto = e.mensaje;
        aviso.classList.add('nuevo');
        setTimeout(() => aviso.classList.remove('nuevo'), 2500);
        if (app.rol === 'docente') {
          mostrarMensajeGrande(e.mensaje);
        }
      }
    } else {
      aviso.hidden = true;
      app.ultimoMensajeVisto = '';
    }
  }

  // Secciones abiertas
  if (Array.isArray(e.secciones_vistas)) {
    app.seccionesVistas = e.secciones_vistas;
  }

  // Scratch
  if (e.scratch_project_id !== undefined) {
    renderScratchDocente();
  }

  // Piso
  if (e.piso) {
    if (app.rol === 'facilitador') renderPisoFacilitador();
    else renderPisoParticipante();
  }

  // Certificados generados
  if (e.certificados_generados) {
    renderCertificadosGenerados(e.certificados_generados);
  }

  renderProgreso();
  renderMaterialDelPaso();
  renderMaterialesDocente();
  renderSesionActual();
  if (typeof renderInteractivoDocente === 'function') renderInteractivoDocente();

  // Docente: avisar y ofrecer su certificado en cuanto se finaliza el taller
  if (app.rol === 'docente') {
    notificarCertificadoDocente();
  }
}

/** Muestra un panel al docente cuando su certificado ya está listo. */
function notificarCertificadoDocente() {
  if (app.rol !== 'docente') return;
  const certs = app.estado?.certificados_generados || [];
  if (!certs.length && !app.estado?.taller_finalizado) {
    app.certificadoNotificado = false;
    const panel = $('#certListoPanel');
    if (panel) panel.hidden = true;
    return;
  }

  const mio = certs.find((c) => c.nombre && app.nombre
    && c.nombre.trim().toLowerCase() === String(app.nombre).trim().toLowerCase());

  // Crear panel si no existe
  let panel = $('#certListoPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'certListoPanel';
    panel.className = 'cert-listo-panel';
    panel.hidden = true;
    const host = $('#vistaEnVivo') || $('#panelDocente') || document.body;
    host.appendChild(panel);
  }

  if (!mio && !app.estado?.taller_finalizado) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  panel.innerHTML = '';

  if (mio) {
    panel.appendChild(el('div', 'cert-listo-ico', '🎓'));
    panel.appendChild(el('strong', 'cert-listo-tit', '¡Tu certificado está listo!'));
    panel.appendChild(el('p', 'cert-listo-txt',
      'Se generó con tu nombre: «' + mio.nombre + '». Puedes verlo e imprimirlo ahora.'));
    const acciones = el('div', 'cert-listo-acciones');
    const btnVer = el('button', 'btn primary', 'Ver / imprimir certificado');
    btnVer.type = 'button';
    btnVer.addEventListener('click', () => {
      if (typeof descargarCertificado === 'function') descargarCertificado(mio);
    });
    const btnMat = el('button', 'btn ghost', 'Ir a Materiales');
    btnMat.type = 'button';
    btnMat.addEventListener('click', () => {
      if (typeof window.__irAMateriales === 'function') window.__irAMateriales();
    });
    const btnCerrar = el('button', 'btn ghost', 'Cerrar');
    btnCerrar.type = 'button';
    btnCerrar.addEventListener('click', () => { panel.hidden = true; });
    acciones.appendChild(btnVer);
    acciones.appendChild(btnMat);
    acciones.appendChild(btnCerrar);
    panel.appendChild(acciones);

    // Solo la primera vez: toast + punto en pestaña Materiales + opcional ir a materiales
    if (!app.certificadoNotificado) {
      app.certificadoNotificado = true;
      mostrarToast('🎓 Tu certificado está listo', 'ok', 7000);
      const punto = $('#tabPuntoMat');
      if (punto) punto.hidden = false;
      // Llevar a Materiales para que lo vean sin buscar
      if (typeof window.__irAMateriales === 'function') {
        setTimeout(() => window.__irAMateriales(), 400);
      }
    }
  } else {
    // Taller finalizado pero sin match de nombre
    panel.appendChild(el('div', 'cert-listo-ico', '🎓'));
    panel.appendChild(el('strong', 'cert-listo-tit', 'Taller finalizado'));
    panel.appendChild(el('p', 'cert-listo-txt',
      'El facilitador cerró la sesión. Si no ves tu certificado, confirma que entraste con tu nombre o pide la plantilla.'));
    const btnCerrar = el('button', 'btn ghost', 'Cerrar');
    btnCerrar.type = 'button';
    btnCerrar.addEventListener('click', () => { panel.hidden = true; });
    panel.appendChild(btnCerrar);
  }
}

// ---------------------------------------------------------------------------
// CONECTAR CONTROLES ADICIONALES (se llama desde conectarControles)
// ---------------------------------------------------------------------------
function conectarControlesExtra() {
  // Finalizar taller
  $('#btnFinalizarTaller')?.addEventListener('click', generarCertificados);

  // Piso facilitador
  // (los botones se crean dinámicamente en renderPisoFacilitador)

  // Piso participante: el botón lo dibuja renderPisoParticipante()
  if (TALLER.piso?.habilitado && app.rol === 'docente') renderPisoParticipante();

  // Scratch
  $('#btnCargarScratch')?.addEventListener('click', cargarScratchEnDocentes);
  $('#btnLimpiarScratch')?.addEventListener('click', limpiarScratch);
  $('#btnRefrescarScratch')?.addEventListener('click', refrescarScratch);
  $('#btnReiniciarFinal')?.addEventListener('click', reabrirTaller);
  $('#pillPiso')?.addEventListener('click', () => {
    $('#seccionPiso')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Mostrar/ocultar secciones de facilitador según config
  if (TALLER.certificado?.habilitado) $('#seccionFinalizar').hidden = false;
  if (TALLER.piso?.habilitado) $('#seccionPiso').hidden = false;
  if (TALLER.scratch?.habilitado) $('#seccionScratch').hidden = false;
}

// ---------------------------------------------------------------------------
// INICIALIZACIÓN EXTRA (se llama al final de entrar())
// ---------------------------------------------------------------------------
function initExtra() {
  conectarControlesExtra();
  if (typeof initInteractivo === 'function') initInteractivo();
  // Render inicial de piso/scratch si ya hay estado
  if (app.estado) {
    if (app.estado.scratch_project_id) renderScratchDocente();
    if (app.estado.piso) {
      if (app.rol === 'facilitador') renderPisoFacilitador();
      else renderPisoParticipante();
    }
    if (app.estado.certificados_generados) renderCertificadosGenerados(app.estado.certificados_generados);
  }
}


/** Refresca los paneles del facilitador que dependen del estado en vivo (piso, certificados). */
function aplicarEstadoFacilitadorExtra() {
  if (typeof renderPisoFacilitador === 'function') renderPisoFacilitador();
  renderCertificadosGenerados(app.estado?.certificados_generados || []);
  if (typeof renderInteractivoFacilitador === 'function') renderInteractivoFacilitador();

  // Quién pide la palabra: píldora fija arriba + toast + sonido solo con solicitudes nuevas
  const piso = app.estado?.piso || {};
  const pidiendo = Object.keys(piso).filter((n) => piso[n] && piso[n].estado === PISO_ESTADOS.SOLICITANDO);
  const pill = $('#pillPiso');
  if (pill) {
    pill.hidden = !pidiendo.length;
    const t = $('#txtPiso');
    if (t) t.textContent = pidiendo.length;
  }
  const nuevos = pidiendo.filter((n) => !(app.pidiendoPrev || []).includes(n));
  app.pidiendoPrev = pidiendo;
  if (nuevos.length) {
    mostrarToast('🙋 ' + nuevos.join(', ') + (nuevos.length > 1 ? ' piden' : ' pide') + ' la palabra', 'alerta', 9000);
    sonar();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const ov = $('#overlayMensaje');
  const cerrar = $('#ovCerrar');
  if (cerrar && ov) cerrar.addEventListener('click', () => { ov.hidden = true; });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && ov && !ov.hidden) ov.hidden = true;
  });
});
