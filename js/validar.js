/* Verificación pública de certificados: consulta certificado_verificar(codigo). */
(function () {
  var URL_BASE = 'https://pjnvhdxytjxbaiwvlylj.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnZoZHh5dGp4YmFpd3ZseWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDI4OTMsImV4cCI6MjEwNjM3ODg5M30.lotSgYcgFJH2OqbkXje7NyaLpZh3ura2kDkDxHYMjns';
  var FORMATO = /^YA-[0-9A-F]{5}-[0-9A-F]{5}$/;
  var res = document.getElementById('res');
  var inp = document.getElementById('c');

  function limpiar() { while (res.firstChild) res.removeChild(res.firstChild); }
  function caja(clase, ico, titulo, texto) {
    limpiar();
    var d = document.createElement('div');
    d.className = 'estado ' + clase;
    var i = document.createElement('div'); i.className = 'ico'; i.textContent = ico;
    var s = document.createElement('strong'); s.textContent = titulo;
    d.appendChild(i); d.appendChild(s);
    if (texto) { var p = document.createElement('p'); p.style.margin = '6px 0 0'; p.textContent = texto; d.appendChild(p); }
    res.appendChild(d);
    return d;
  }
  function fila(dl, k, v) {
    var dt = document.createElement('dt'); dt.textContent = k;
    var dd = document.createElement('dd'); dd.textContent = v;
    dl.appendChild(dt); dl.appendChild(dd);
  }
  function fechaLarga(f) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(f || '');
    if (!m) return f || '';
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function verificar(codigo) {
    codigo = String(codigo || '').trim().toUpperCase();
    if (!FORMATO.test(codigo)) { caja('mal', '✕', 'Código no válido', 'Revisa que tenga el formato YA-XXXXX-XXXXX.'); return; }
    caja('', '…', 'Verificando…');
    fetch(URL_BASE + '/rest/v1/rpc/certificado_verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY },
      body: JSON.stringify({ p_codigo: codigo })
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!d || !d.nombre) { caja('mal', '✕', 'Certificado NO encontrado', 'El código ' + codigo + ' no corresponde a ningún certificado emitido.'); return; }
      caja('ok', '✓', 'Certificado auténtico');
      var dl = document.createElement('dl');
      fila(dl, 'Otorgado a', d.nombre);
      fila(dl, 'Taller', d.titulo ? d.titulo : 'Taller de Programación Visual con Scratch');
      fila(dl, 'Emitido por', d.entidad || 'Yo Aprendo');
      fila(dl, 'Fecha', fechaLarga(d.fecha));
      fila(dl, 'Código', codigo);
      res.appendChild(dl);
    }).catch(function () {
      caja('mal', '!', 'No se pudo verificar', 'Revisa tu conexión e inténtalo de nuevo.');
    });
  }

  document.getElementById('f').addEventListener('submit', function (e) {
    e.preventDefault();
    verificar(inp.value);
  });
  var m = /[?&]c=([^&#]+)/.exec(location.search);
  if (m) { try { inp.value = decodeURIComponent(m[1]).toUpperCase(); } catch (x) {} verificar(inp.value); }
})();
