/* ==========================================================================
   Taller de Scratch · autenticación y puerta de entrada
   ========================================================================== */

// ------------------------------------------------------------------
// PUERTA DE ENTRADA
//
// Los docentes entran directo: escriben su nombre y ya están dentro.
// El acceso de facilitador exige el PIN y no muestra ninguna opción de rol,
// así que un docente no puede abrir el panel de control ni por curiosidad.
// ------------------------------------------------------------------

/** Marca local (no secreta) de que este navegador ya entró como facilitador. */
function pinGuardado() {
  return leerLS(LS.pinHash, '');
}

/** Nombre de docente: sin espacios raros, máx. 30 y sin hacerse pasar por el facilitador. */
function limpiarNombre(n) {
  const v = String(n || '').replace(/s+/g, ' ').trim().slice(0, 30);
  return v.toLowerCase() === 'facilitador' ? '' : v;
}

/** Comprueba el PIN de participantes en el servidor: 'ok' | 'abierto' | 'mal' | 'error:…' */
async function verificarPuerta(pin) {
  if (!SB_LISTO) return 'abierto';
  try {
    await initSupabase();
    return await verificarPinPart(app.sala, pin);
  } catch (e) {
    const m = mensajeError(e);
    // Si la base aún no tiene el PIN (falta ejecutar supabase.sql), no se bloquea la entrada.
    if (m.startsWith('Falta actualizar')) return 'abierto';
    return 'error:' + m;
  }
}

function init() {
  $('#puertaTitulo').textContent = TALLER.titulo;
  $('#puertaSub').textContent = TALLER.subtitulo;
  app.sala = salaDeUrl();

  // Salir: se conecta ANTES de la auto-entrada (si no, nunca funcionaba tras recargar).
  $('#btnSalir').addEventListener('click', () => {
    try { if (app.canal) app.canal.unsubscribe(); } catch {}
    clearInterval(app.timer.iv);
    clearInterval(app.sondeo);
    guardarLS(LS.pinHash, '');
    guardarLS(LS.rol, '');
    guardarClaveSesion(''); // limpia sessionStorage
    guardarPinParticipante('');
    // NO borramos LS.nombre para que la próxima vez solo dé Enter
    location.reload();
  });

  // Limpieza: versiones antiguas guardaban el PIN en localStorage.
  try { localStorage.removeItem('taller.clave'); } catch { }

  // --- Auto-entrada si ya hay sesión guardada ---
  const rolGuardado = leerLS(LS.rol, '');
  const nombreGuardado = limpiarNombre(leerLS(LS.nombre, ''));
  const claveSesion = leerClaveSesion();

  // Facilitador: solo auto-entra si tenemos hash Y la clave de esta sesión.
  // Si el navegador se cerró, sessionStorage se vació y pedimos el PIN de nuevo.
  if (pinGuardado() && claveSesion && (rolGuardado === 'facilitador' || !rolGuardado)) {
    app.rol = 'facilitador';
    app.nombre = 'Facilitador';
    app.clave = claveSesion;
    entrar();
    return;
  }

  if (rolGuardado === 'docente' && nombreGuardado) {
    // Docente: rol + nombre guardados. Se revalida el PIN de la sala (puede haber cambiado).
    verificarPuerta(pinParticipante()).then((r) => {
      if (r === 'mal') {
        guardarPinParticipante('');
        $('#inpNombreDocente').value = nombreGuardado;
        $('#pinPartError').hidden = false;
        $('#inpPinPart').focus();
        return;
      }
      app.rol = 'docente';
      app.nombre = nombreGuardado;
      app.seccionesVistas = leerVistas();
      entrar();
    });
    return;
  }

  // --- Primera vez / reingreso facilitador: mostrar puerta ---
  if (nombreGuardado) $('#inpNombreDocente').value = nombreGuardado;

  if (!SB_LISTO) {
    const a = $('#puertaAviso');
    a.hidden = false;
    a.className = 'puerta-aviso';
    a.textContent =
      'Modo sin conexión con Supabase: las secciones y descargas funcionan, pero los docentes no verán los cambios en vivo hasta que configures la sincronización. Ver README.md.';
  }

  // Si este navegador ya fue de facilitador pero la sesión expiró, abrimos el formulario de PIN.
  if (pinGuardado() && !claveSesion) {
    $('#formPin').hidden = false;
    $('#inpPin').focus();
  }

  // --- Entrada de docente ---
  $('#formDocente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = ($('#inpPinPart').value || '').trim();
    const btn = $('#formDocente button[type="submit"]');
    const err = $('#pinPartError');
    btn.disabled = true;
    const r = await verificarPuerta(pin);
    btn.disabled = false;
    if (r === 'mal') {
      err.textContent = 'Ese PIN no es correcto. Pídelo al facilitador.';
      err.hidden = false;
      $('#inpPinPart').select();
      return;
    }
    if (r.startsWith('error:')) {
      err.textContent = 'No se pudo comprobar el PIN: ' + r.slice(6);
      err.hidden = false;
      return;
    }
    err.hidden = true;
    guardarPinParticipante(r === 'abierto' ? '' : pin);
    app.rol = 'docente';
    app.nombre = limpiarNombre($('#inpNombreDocente').value) || 'Docente';
    guardarLS(LS.rol, 'docente');
    guardarLS(LS.nombre, app.nombre);
    app.seccionesVistas = leerVistas();
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

    const err = $('#pinError');
    const btn = $('#formPin button[type="submit"]');
    const fallo = (msg) => {
      err.textContent = msg;
      err.hidden = false;
      $('#inpPin').value = '';
      $('#inpPin').focus();
    };

    // La verificación ocurre en el servidor (el PIN no está en el código).
    // Sin Supabase (modo local) no hay nada que proteger: se acepta.
    if (SB_LISTO) {
      btn.disabled = true;
      try {
        await initSupabase();
        const r = await verificarClave(app.sala, pin);
        // 'no_sala': sala nueva; el PIN que escribas será su PIN (mín. 8 caracteres).
        if (r === 'mal') return fallo('Ese código no es correcto.');
        if (r === 'no_sala' && pin.length < 8) return fallo('Sala nueva: el PIN debe tener al menos 8 caracteres.');
      } catch (e2) {
        return fallo('No se pudo verificar el código: ' + mensajeError(e2));
      } finally {
        btn.disabled = false;
      }
    }

    err.hidden = true;
    guardarLS(LS.pinHash, '1');
    guardarLS(LS.rol, 'facilitador');
    app.rol = 'facilitador';
    app.nombre = 'Facilitador';
    app.clave = pin;
    guardarClaveSesion(pin); // solo sessionStorage, no localStorage
    $('#inpPin').value = '';
    entrar();
  });

}

function entrar() {
  $('#puerta').hidden = true;
  $('#app').hidden = false;
  $('#topTitulo').textContent = TALLER.titulo;
  $('#topRol').textContent =
    app.rol === 'facilitador' ? 'Facilitador · ' + TALLER.entidad : 'Docente · ' + TALLER.entidad;
  const pie = $('#pieTexto');
  if (pie) pie.textContent = TALLER.bienvenida.recordatorio;

  if (app.rol === 'facilitador') {
    $('#timerTop').hidden = false;
    $('#panelFacilitador').hidden = false;
    renderVistaPrevia();
    renderNotas();
    renderControlSecciones();
    renderControlMateriales();
    renderConfig();
    conectarTimer();
    conectar();
  } else {
    $('#panelDocente').hidden = false;
    conectarTabsDocente();
    renderSesionActual();
    renderProgreso();
    renderMaterialDelPaso();
    renderMaterialesDocente();
    renderProyectos();
    conectar();
  }

  // Features extra (piso, Scratch, certificados) — definidas en features.js
  if (typeof initExtra === 'function') initExtra();
}
