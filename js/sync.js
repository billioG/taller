/* ==========================================================================
   Taller de Scratch · sincronización y estado
   ========================================================================== */

// ------------------------------------------------------------------
// SINCRONIZACIÓN
// ------------------------------------------------------------------
const SONDEO_MS = 20000; // red de seguridad por si se pierde un aviso en vivo

/** Estado inicial en modo local (sin Supabase o sin conexión). */
function estadoLocalDocente() {
  app.seccionesVistas = [TALLER.secciones[0].id];
  app.estado = {
    seccion_actual: TALLER.secciones[0].id,
    bloque_actual: TALLER.secciones[0].bloques[0].id,
    secciones_vistas: app.seccionesVistas,
    mensaje: leerLS(LS.mensaje, ''),
  };
  aplicarEstado();
}

/** Aplica un estado leído de la base a la pantalla según el rol. */
function aplicarEstadoRemoto(estado) {
  if (!estado) return;
  app.estado = estado;
  if (app.rol === 'docente') aplicarEstado();
  if (app.rol === 'facilitador') {
    marcarSeccionActual(estado.seccion_actual, estado.bloque_actual);
    renderVistaPrevia();
    if (typeof aplicarEstadoFacilitadorExtra === 'function') aplicarEstadoFacilitadorExtra();
  }
}

let __refrescando = false;
let __refrescarPendiente = false;

/** Relee el estado real desde la base (un solo vuelo a la vez). */
async function refrescarEstado() {
  if (!SB_LISTO || !sb) return;
  if (__refrescando) { __refrescarPendiente = true; return; }
  __refrescando = true;
  try {
    aplicarEstadoRemoto(await leerEstado(app.sala));
  } catch (e) {
    console.warn('[taller] No se pudo refrescar el estado:', e && e.message);
  } finally {
    __refrescando = false;
    if (__refrescarPendiente) {
      __refrescarPendiente = false;
      refrescarEstado();
    }
  }
}

let __suaveT = null;
/** Avisos en vivo: se agrupan varios en uno (30 votos seguidos = una sola lectura). */
function refrescarSuave() {
  clearTimeout(__suaveT);
  __suaveT = setTimeout(refrescarEstado, 350);
}

async function conectar() {
  if (app.canal) return; // ya conectado (evita suscribir dos veces el mismo canal)
  if (!SB_LISTO) {
    setConexion('mal', 'Sin sincronizar');
    if (app.rol === 'docente') estadoLocalDocente();
    return;
  }

  setConexion('espera', 'Conectando…');

  // Timeout de seguridad: si en 10s no conecta, cae a modo local
  const timeoutId = setTimeout(() => {
    if (!app.estado) {
      setConexion('mal', 'Tiempo agotado — modo local');
      console.warn('[taller] Supabase timeout, modo local');
      if (app.rol === 'docente') estadoLocalDocente();
    }
  }, 10000);

  try {
    await initSupabase();
  } catch (e) {
    clearTimeout(timeoutId);
    setConexion('mal', 'Error Supabase: ' + e.message);
    return;
  }

  app.canal = suscribir(
    app.sala,
    app.nombre,
    () => refrescarSuave(),
    (nombres) => {
      app.conectados = nombres;
      if (app.rol === 'facilitador') {
        renderConectados();
        if (typeof renderPisoFacilitador === 'function') renderPisoFacilitador();
        const p = $('#pillConectados');
        p.hidden = false;
        $('#txtConectados').textContent = nombres.length;
      }
    },
    (vivo) => {
      if (vivo) clearTimeout(timeoutId);
      setConexion(vivo ? 'ok' : 'mal', vivo ? 'En vivo' : 'Reconectando…');
      if (vivo) refrescarEstado(); // al reconectar, ponerse al día
    },
    (p) => { if (typeof pinturaAviso === 'function') pinturaAviso(p); },
    (p) => { if (typeof listoAviso === 'function') listoAviso(p); }
  );

  // Cargar estado inicial
  try {
    const previo = await leerEstado(app.sala);
    clearTimeout(timeoutId);
    if (previo) {
      aplicarEstadoRemoto(previo);
    } else if (app.rol === 'facilitador') {
      if (app.clave) {
        aplicarEstadoRemoto(await crearEstado(app.sala, app.clave));
        setConexion('ok', 'Sala creada');
      } else {
        setConexion('espera', 'Sin clave');
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    setConexion('mal', 'Error de conexión');
    mostrarConfigError(mensajeError(err));
  }

  // Facilitador: si el PIN guardado en la sesión ya no es válido (rotado), volver a pedirlo.
  if (app.rol === 'facilitador' && app.clave && app.estado) {
    try {
      if ((await verificarClave(app.sala, app.clave)) === 'mal') {
        guardarClaveSesion('');
        guardarLS(LS.pinHash, '');
        location.reload();
        return;
      }
    } catch {}
  }

  // Red de seguridad: sondeo periódico (solo con la pestaña visible)
  clearInterval(app.sondeo);
  app.sondeo = setInterval(() => {
    if (document.visibilityState === 'visible') refrescarEstado();
  }, SONDEO_MS);
}

function setConexion(estado, texto) {
  const p = $('#pillConexion');
  p.classList.remove('pill-ok', 'pill-mal');
  if (estado === 'ok') p.classList.add('pill-ok');
  if (estado === 'mal') p.classList.add('pill-mal');
  $('#txtConexion').textContent = texto;
}

/** Facilitador: guarda cambios en la base y avisa a todos. */
async function escribirEstado(clave, patch) {
  if (!SB_LISTO) {
    // Modo local: actualiza estado en memoria y refresca UI del facilitador
    app.estado = { ...(app.estado || {}), ...patch };
    if (app.rol === 'facilitador') {
      marcarSeccionActual(app.estado.seccion_actual, app.estado.bloque_actual);
      if (typeof renderVistaPrevia === 'function') renderVistaPrevia();
    }
    return;
  }
  app.estado = await guardarEstado(app.sala, clave, patch);
  await emitirEstado(app.canal);
}
