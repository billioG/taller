/* ==========================================================================
   Material a partir de plantilla.
   Lee talleres/<id>.js → TALLER.documentos[<m>] y dibuja el documento con los
   mismos estilos de los demás materiales. Enlace: material/ver.html?t=<id>&m=<doc>

   Tipos de bloque: aviso, h2, p, lista, preguntas, tarjetas, tabla, rubrica,
   campos, escribir. Todo el texto se inserta como texto (nunca como HTML);
   **así** se pone en negrita. Lee talleres/LEEME.md.
   ========================================================================== */
(function () {
  var pagina = document.getElementById('pagina');
  var barra = document.getElementById('barra');

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }
  // Texto con **negrita**, sin HTML.
  function rico(host, texto) {
    String(texto == null ? '' : texto).split('**').forEach(function (parte, i) {
      if (!parte) return;
      host.appendChild(i % 2 ? el('strong', null, parte) : document.createTextNode(parte));
    });
    return host;
  }
  function celda(tag, texto, ancho, centrado) {
    var c = el(tag);
    if (texto !== '' && texto != null) rico(c, texto); // vacío = casilla para llenar
    if (ancho) c.style.width = ancho;
    if (centrado) c.style.textAlign = 'center';
    return c;
  }

  function dibujar(b, host) {
    var n;
    switch (b.tipo) {
      case 'aviso':
        n = el('div', 'aviso' + (b.color === 'azul' ? ' aviso-azul' : ''));
        if (b.titulo) n.appendChild(el('p', 'aviso-tit', b.titulo));
        n.appendChild(rico(el('p'), b.texto));
        break;
      case 'h2': n = el('h2', null, b.texto); break;
      case 'p': n = rico(el('p'), b.texto); break;
      case 'lista':
        n = el(b.numerada ? 'ol' : 'ul');
        (b.items || []).forEach(function (t) { n.appendChild(rico(el('li'), t)); });
        break;
      case 'preguntas':
        n = el('ul', 'limpia');
        (b.items || []).forEach(function (it) {
          var li = el('li');
          li.appendChild(el('strong', null, it.q));
          if (it.nota) { li.appendChild(el('br')); li.appendChild(rico(el('span'), it.nota)); }
          n.appendChild(li);
        });
        break;
      case 'tarjetas':
        n = el('div', (b.items || []).length === 2 ? 'cols-2' : 'cols-3');
        (b.items || []).forEach(function (it) {
          var t = el('div', 'tarjeta');
          t.appendChild(el('h3', null, it.titulo));
          t.appendChild(rico(el('p'), it.texto));
          n.appendChild(t);
        });
        break;
      case 'tabla':
        n = el('table');
        if (b.cols) {
          var th = el('thead'), trh = el('tr');
          b.cols.forEach(function (c, i) { trh.appendChild(celda('th', c, b.anchos && b.anchos[i])); });
          th.appendChild(trh); n.appendChild(th);
        }
        var tb = el('tbody');
        (b.filas || []).forEach(function (f) {
          var tr = el('tr');
          f.forEach(function (c, i) { tr.appendChild(celda('td', c, !b.cols && b.anchos && b.anchos[i], c === '○')); });
          tb.appendChild(tr);
        });
        n.appendChild(tb);
        break;
      case 'campos': // etiqueta + casilla para llenar
        n = el('table');
        var tb2 = el('tbody');
        (b.etiquetas || []).forEach(function (e) {
          var tr = el('tr');
          var t1 = el('td'); t1.style.width = '28%'; t1.appendChild(el('strong', null, e));
          tr.appendChild(t1); tr.appendChild(el('td'));
          tb2.appendChild(tr);
        });
        n.appendChild(tb2);
        break;
      case 'rubrica': // criterios × niveles con círculos para marcar
        var niveles = b.niveles || [1, 3, 5];
        n = el('table');
        var th2 = el('thead'), tr2 = el('tr');
        tr2.appendChild(celda('th', 'Criterio', '19%'));
        tr2.appendChild(celda('th', '¿Qué reviso?', '34%'));
        niveles.forEach(function (v) { tr2.appendChild(celda('th', String(v), '9%')); });
        tr2.appendChild(celda('th', 'Mi nota', '20%'));
        th2.appendChild(tr2); n.appendChild(th2);
        var tb3 = el('tbody');
        (b.criterios || []).forEach(function (c) {
          var tr = el('tr');
          var t1 = el('td'); t1.appendChild(el('strong', null, c.nombre)); tr.appendChild(t1);
          tr.appendChild(celda('td', c.revisar));
          niveles.forEach(function () { tr.appendChild(celda('td', '○', null, true)); });
          tr.appendChild(el('td'));
          tb3.appendChild(tr);
        });
        n.appendChild(tb3);
        break;
      case 'escribir':
        n = el('div', 'recorte');
        n.appendChild(el('div', 'rotulo', b.etiqueta || 'Para llenar'));
        var l = el('div', 'lineas');
        for (var i = 0; i < (b.lineas || 1); i++) l.appendChild(el('div', 'c'));
        n.appendChild(l);
        break;
      default: return;
    }
    host.appendChild(n);
  }

  function cerrar() {
    var a = el('a', 'secundario', '✕ Cerrar');
    a.href = '../index.html' + (TALLER_ID !== TALLER_PRINCIPAL ? '?t=' + encodeURIComponent(TALLER_ID) : '');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.close();
      setTimeout(function () { location.href = a.href; }, 300);
    });
    return a;
  }

  var m = (/[?&]m=([a-z0-9-]+)/.exec(location.search) || [])[1];
  var doc = typeof TALLER !== 'undefined' && TALLER.documentos && m && TALLER.documentos[m];
  if (!doc) {
    pagina.appendChild(el('h1', null, 'No se encontró el material'));
    pagina.appendChild(el('p', null, 'Revisa el enlace: el documento «' + (m || '') + '» no existe en este taller.'));
    barra.appendChild(cerrar());
    return;
  }

  document.title = doc.titulo + ' · ' + (TALLER.tituloCorto || TALLER.titulo);
  var txt = el('span', 'barra-txt');
  txt.appendChild(el('strong', null, doc.titulo));
  txt.appendChild(document.createTextNode(doc.subtitulo || ''));
  barra.appendChild(txt);
  var pdf = el('a', null, '⬇ Guardar como PDF');
  pdf.href = '#';
  pdf.addEventListener('click', function (e) { e.preventDefault(); window.print(); });
  barra.appendChild(pdf);
  barra.appendChild(cerrar());

  var cab = el('div', 'cabecera');
  var izq = el('div');
  izq.appendChild(el('h1', null, doc.titulo));
  if (doc.subtitulo) izq.appendChild(el('p', 'h1-sub', doc.subtitulo));
  cab.appendChild(izq);
  var marca = el('div', 'marca');
  var img = el('img'); img.src = '../assets/logo-icon.svg'; img.alt = '';
  marca.appendChild(img);
  marca.appendChild(el('span', null, TALLER.entidad || ''));
  cab.appendChild(marca);
  pagina.appendChild(cab);

  (doc.bloques || []).forEach(function (b) { dibujar(b, pagina); });
  pagina.appendChild(el('div', 'pie-pagina', TALLER.titulo + ' · ' + (TALLER.entidad || '')));

  // Documento de solo lectura: se desactiva el relleno en pantalla (y su aviso).
  if (doc.rellenable === false) window.__sinRelleno = true;
})();
