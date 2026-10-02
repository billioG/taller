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

  // Limpieza: versiones antiguas guardaban el PIN en localStorage.
  try { localStorage.removeItem('taller.clave'); } catch { }

  // --- Auto-entrada si ya hay sesión guardada ---
  const rolGuardado = leerLS(LS.rol, '');
  const nombreGuardado = leerLS(LS.nombre, '');
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
    // Docente: rol + nombre guardados
    app.rol = 'docente';
    app.nombre = nombreGuardado;
    app.seccionesVistas = JSON.parse(leerLS(LS.seccionesVistas, '[]'));
    entrar();
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
  $('#formDocente').addEventListener('submit', (e) => {
    e.preventDefault();
    app.rol = 'docente';
    app.nombre = $('#inpNombreDocente').value.trim() || 'Docente';
    guardarLS(LS.rol, 'docente');
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
    guardarLS(LS.rol, 'facilitador');
    app.rol = 'facilitador';
    app.nombre = 'Facilitador';
    app.clave = pin;
    guardarClaveSesion(pin); // solo sessionStorage, no localStorage
    $('#inpPin').value = '';
    entrar();
  });

  // Volver a la puerta desde la app
  $('#btnSalir').addEventListener('click', () => {
    if (app.canal) app.canal.unsubscribe();
    clearInterval(app.timer.iv);
    guardarLS(LS.pinHash, '');
    guardarLS(LS.rol, '');
    guardarClaveSesion(''); // limpia sessionStorage
    // NO borramos LS.nombre para que la próxima vez solo dé Enter
    location.reload();
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
