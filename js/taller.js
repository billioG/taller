/* ==========================================================================
   Selector de taller
   --------------------------------------------------------------------------
   La app es una sola; cada taller es un archivo en /talleres/<id>.js que
   define `const TALLER = {...}`. Se elige con ?t=<id> en el enlace
   (sin ?t= se abre el primero de la lista).

   Para AGREGAR un taller: crea talleres/<id>.js (copia talleres/ejemplo.js)
   y añade su id a esta lista. Lee talleres/LEEME.md.
   ========================================================================== */
(function () {
  var LISTA = ['scratch', 'ejemplo'];
  var m = /[?&]t=([a-z0-9-]+)/.exec(location.search);
  var id = m && LISTA.indexOf(m[1]) >= 0 ? m[1] : LISTA[0];
  window.TALLER_ID = id;
  window.TALLER_PRINCIPAL = LISTA[0];
  // Raíz del sitio, deducida de dónde está este script (sirve también desde /material/).
  var raiz = document.currentScript.src.replace(/js\/taller\.js.*$/, '');
  // Carga síncrona (mantiene el orden de los scripts) y permitida por la CSP ('self').
  document.write('<script src="' + raiz + 'talleres/' + id + '.js"><\/script>');
})();
