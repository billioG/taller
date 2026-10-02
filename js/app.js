/* ==========================================================================
   Taller de Scratch · arranque
   Carga: config → supabase → core → auth → sync → views → features → app
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  init();
  conectarControles();

  // Al volver a la pestaña, releer el estado (móviles suspenden el websocket).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refrescarEstado();
  });
});
