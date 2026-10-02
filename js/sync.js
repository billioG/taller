/* ==========================================================================
   Taller de Scratch · sincronización y estado
   ========================================================================== */

// ------------------------------------------------------------------
// SINCRONIZACIÓN
// ------------------------------------------------------------------
async function conectar() {
  if (!SB_LISTO) {
    setConexion('mal', 'Sin sincronizar');
    if (app.rol === 'docente') {
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

  // Timeout de seguridad: si en 10s no conecta, cae a modo local
  const timeoutId = setTimeout(() => {
    if (!app.canal) {
      setConexion('mal', 'Tiempo agotado — modo local');
      console.warn('[taller] Supabase timeout, modo local');
      if (app.rol === 'docente') {
        app.seccionesVistas = [TALLER.secciones[0].id];
        app.estado = {
          seccion_actual: TALLER.secciones[0].id,
          bloque_actual: TALLER.secciones[0].bloques[0].id,
          secciones_vistas: app.seccionesVistas,
          mensaje: leerLS(LS.mensaje, ''),
        };
        aplicarEstado();
      }
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
    (estado) => {
      clearTimeout(timeoutId);
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
    (vivo) => {
      if (vivo) clearTimeout(timeoutId);
      setConexion(vivo ? 'ok' : 'mal', vivo ? 'En vivo' : 'Reconectando…');
    }
  );

  // Cargar estado inicial
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
      if (app.clave) {
        await crearEstado(app.sala, app.clave, {});
        setConexion('ok', 'Sala creada');
      } else {
        setConexion('espera', 'Sin clave');
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
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
  // Aviso instantáneo por broadcast (no depende de Replication)
  await emitirEstado(app.canal, app.estado);
}
