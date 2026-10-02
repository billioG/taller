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
  contenedor.className = 'toast' + (tipo === 'ok' ? ' ok' : tipo === 'err' ? ' err' : '');
  contenedor.textContent = mensaje;
  document.body.appendChild(contenedor);
  setTimeout(() => {
    contenedor.style.opacity = '0';
    contenedor.style.transform = 'translateY(20px)';
    setTimeout(() => contenedor.remove(), 300);
  }, duracion);
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
    // Leer estado actual para obtener conectados
    const estado = await leerEstado(app.sala);
    const conectados = app.conectados.filter(n => n !== 'Facilitador');

    if (!conectados.length) {
      mostrarToast('No hay participantes para certificar', 'err');
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
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

function generarHtmlCertificado(c) {
  // Logo inline (cubo oficial) para que imprima sin depender de rutas externas
  const cubo = `<svg viewBox="0 0 100 100" width="52" height="52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="none" stroke="#2B4C8C" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M50,50 L18,32 M50,50 L82,32 M50,50 L50,85" fill="none" stroke="#2B4C8C" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Certificado — ${c.nombre}</title>
<style>
@page { size: letter; margin: 14mm 15mm; }
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:11.5pt;line-height:1.5;color:#202124;background:#fff}
.cert{border:3px solid #2B4C8C;border-radius:14px;padding:34px 38px;text-align:center;margin:16px auto;max-width:700px;background:linear-gradient(180deg,#FBF7EF,#fff)}
.cert-logo{margin:0 auto 12px}
.cert-sello{font-size:10pt;text-transform:uppercase;letter-spacing:.18em;color:#2B4C8C;font-weight:800;margin-bottom:8px}
.cert-tit{font-size:24pt;margin:0 0 4px;color:#2B4C8C;letter-spacing:.02em}
.cert-sub{font-size:13pt;margin:0 0 6px}
.cert-linea{width:78%;margin:18px auto 6px;border-bottom:1px solid #6B6157;height:36pt;font-size:18pt;font-weight:700;color:#202124;display:flex;align-items:flex-end;justify-content:center}
.cert-dur{font-size:11pt;margin:0 0 14px;color:#6B6157}
.cert-modulos{display:grid;grid-template-columns:1fr 1fr;gap:5px 26px;text-align:left;max-width:560px;margin:20px auto 22px;font-size:10pt;padding:0}
.cert-modulos li{list-style:none;padding:4px 0 4px 22px;position:relative;border-bottom:1px solid #E4DCCC}
.cert-modulos li::before{content:"▸";position:absolute;left:0;color:#2B4C8C}
.firmas{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:34px}
.firma{border-top:1px solid #202124;padding-top:6px;font-size:9.5pt;color:#6B6157}
.saberes{font-size:9pt;color:#6B6157;letter-spacing:.06em;margin:8px 0 0}
@media print{.no-print{display:none!important}body{background:#fff}.cert{background:#FBF7EF!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="cert">
  <div class="cert-logo">${cubo}</div>
  <div class="cert-sello">${c.entidad} · Certifica</div>
  <h1 class="cert-tit">${c.titulo}</h1>
  <p class="cert-sub">${c.subtitulo}</p>
  <p class="cert-dur">${c.duracion}</p>
  <p style="margin:0;">Se otorga a</p>
  <div class="cert-linea">${c.nombre}</div>
  <p class="saberes">Saber · Saber hacer · Saber ser</p>
  <p style="margin:18px auto 0;text-align:left;max-width:520px;">
    Por haber construido un proyecto interactivo funcional sobre un contenido
    de su propia asignatura, junto con un plan de clase para aplicarlo
    con sus estudiantes.
  </p>
  <ul class="cert-modulos">
    <li>Construcción de un recurso interactivo funcional</li>
    <li>Secuencia, condición e interacción</li>
    <li>Diseño de una actividad evaluable</li>
    <li>Esquema de una clase de 45 minutos</li>
  </ul>
  <div class="firmas">
    <div class="firma">Firma del facilitador</div>
    <div class="firma">Fecha: ${c.fecha}</div>
  </div>
</div>
<div style="text-align:center;margin-top:20px;color:#6B6157;font-size:9pt" class="no-print">
  Generado automáticamente · ${c.entidad} · Formación Continua
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
  const piso = { ...(app.estado?.piso || {}) };
  if (nuevoEstado === PISO_ESTADOS.NADA) {
    delete piso[nombre];
  } else {
    piso[nombre] = { estado: nuevoEstado, desde: Date.now() };
  }
  await escribirEstado(app.clave, { piso });
}

async function solicitarPiso() {
  if (app.rol !== 'docente') return;
  await actualizarPisoEnEstado(app.nombre, PISO_ESTADOS.SOLICITANDO);
  renderPisoParticipante();
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
  const miEstado = app.estado?.piso?.[app.nombre]?.estado || PISO_ESTADOS.NADA;

  if (miEstado === PISO_ESTADOS.NADA) {
    cont.hidden = true;
    return;
  }
  cont.hidden = false;
  acc.innerHTML = '';
  estadoDiv.textContent = '';

  if (miEstado === PISO_ESTADOS.SOLICITANDO) {
    estadoDiv.textContent = '⏳ Esperando respuesta del facilitador…';
    const btnCancel = el('button', 'btn peligro', 'Cancelar solicitud');
    btnCancel.addEventListener('click', () => limpiarPiso(app.nombre));
    acc.appendChild(btnCancel);
  } else if (miEstado === PISO_ESTADOS.INVITADO) {
    estadoDiv.textContent = '📨 El facilitador te invita a tomar la palabra';
    const btnAceptar = el('button', 'btn primary', 'Aceptar');
    btnAceptar.addEventListener('click', () => { actualizarPisoEnEstado(app.nombre, PISO_ESTADOS.ACEPTADO); renderPisoParticipante(); });
    acc.appendChild(btnAceptar);
    const btnRechazar = el('button', 'btn peligro', 'Rechazar');
    btnRechazar.addEventListener('click', () => limpiarPiso(app.nombre));
    acc.appendChild(btnRechazar);
  } else if (miEstado === PISO_ESTADOS.CONCEDIDO || miEstado === PISO_ESTADOS.ACEPTADO) {
    estadoDiv.textContent = '🎤 ¡Tienes la palabra!';
    const btnTerminar = el('button', 'btn peligro', 'Terminar mi participación');
    btnTerminar.addEventListener('click', () => limpiarPiso(app.nombre));
    acc.appendChild(btnTerminar);
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
  const url = TALLER.scratch.editorBaseUrl + pid + '/editor' + TALLER.scratch.iframeParams;
  await escribirEstado(app.clave, { scratch_project_id: pid, scratch_url: url });
  $('#scratchEstado').textContent = '✅ Cargado para los docentes';
  mostrarToast('Scratch cargado en vista docentes', 'ok');
}

async function limpiarScratch() {
  scratchProjectIdActual = null;
  await escribirEstado(app.clave, { scratch_project_id: null, scratch_url: null });
  $('#scratchEstado').textContent = '';
  $('#inpScratchProjectId').value = '';
  mostrarToast('Scratch quitado de la vista docentes', 'info');
}

function renderScratchDocente() {
  const cont = $('#scratchIframeContenedor');
  const info = $('#scratchInfo');
  const pid = app.estado?.scratch_project_id;
  if (!pid) {
    cont.innerHTML = '';
    info.hidden = true;
    $('#tabScratch').hidden = true;
    return;
  }
  const url = TALLER.scratch.editorBaseUrl + pid + '/editor' + TALLER.scratch.iframeParams;
  cont.innerHTML = `<iframe src="${url}" title="Scratch: proyecto ${pid}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  info.hidden = false;
  info.textContent = `Proyecto Scratch #${pid} — Editor en vivo`;
  $('#tabScratch').hidden = false;
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
          mostrarToast('📢 ' + e.mensaje, 'info', 6000);
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
}

// ---------------------------------------------------------------------------
// CONECTAR CONTROLES ADICIONALES (se llama desde conectarControles)
// ---------------------------------------------------------------------------
function conectarControlesExtra() {
  // Finalizar taller
  $('#btnFinalizarTaller')?.addEventListener('click', generarCertificados);

  // Piso facilitador
  // (los botones se crean dinámicamente en renderPisoFacilitador)

  // Piso participante: botón solicitar
  // Se añade un botón en la vista En vivo
  if (TALLER.piso?.habilitado && app.rol === 'docente') {
    const btnSolicitar = el('button', 'btn btn-mini primary', '🙋 Pedir la palabra');
    btnSolicitar.id = 'btnSolicitarPiso';
    btnSolicitar.type = 'button';
    btnSolicitar.addEventListener('click', solicitarPiso);
    // Insertar en la zona de piso participante
    const acc = $('#pisoAcciones');
    if (acc && !document.getElementById('btnSolicitarPiso')) {
      acc.prepend(btnSolicitar);
    }
  }

  // Scratch
  $('#btnCargarScratch')?.addEventListener('click', cargarScratchEnDocentes);
  $('#btnLimpiarScratch')?.addEventListener('click', limpiarScratch);

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

