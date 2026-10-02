/* ==========================================================================
   Taller de Scratch · arranque
   Carga: config → supabase → core → auth → sync → views → features → app
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  init();
  conectarControles();

  // Al volver a la pestaña, releer el estado (móviles suspenden el websocket).
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
