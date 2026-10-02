/* Formularios que se llenan directamente en pantalla y luego se guardan como PDF. */
document.addEventListener('DOMContentLoaded', function () {
  var raiz = document.querySelector('.pagina');
  if (!raiz) return;
  raiz.querySelectorAll('table tbody td').forEach(function (td) {
    var txt = td.textContent.trim();
    if (txt === '' && !td.children.length) {
      td.setAttribute('contenteditable', 'true');
      td.classList.add('editable');
      td.setAttribute('role', 'textbox');
    } else if (txt === '○') {
      td.classList.add('circulo');
      td.tabIndex = 0;
      td.setAttribute('role', 'radio');
      td.setAttribute('aria-checked', 'false');
      var alternar = function () {
        var fila = td.parentNode;
        fila.querySelectorAll('.circulo').forEach(function (o) { o.textContent = '○'; o.classList.remove('sel'); o.setAttribute('aria-checked', 'false'); });
        td.textContent = '●'; td.classList.add('sel'); td.setAttribute('aria-checked', 'true');
      };
      td.addEventListener('click', alternar);
      td.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alternar(); } });
    }
  });
  raiz.querySelectorAll('.lineas .c, .escribir').forEach(function (n) {
    n.setAttribute('contenteditable', 'true');
    n.setAttribute('role', 'textbox');
  });
  raiz.querySelectorAll('.op').forEach(function (op) {
    op.tabIndex = 0;
    var elegir = function () {
      var vecino = op.previousElementSibling;
      while (vecino && vecino.classList.contains('op')) { vecino.classList.remove('sel'); vecino = vecino.previousElementSibling; }
      vecino = op.nextElementSibling;
      while (vecino && vecino.classList.contains('op')) { vecino.classList.remove('sel'); vecino = vecino.nextElementSibling; }
      op.classList.add('sel');
    };
    op.addEventListener('click', elegir);
    op.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); elegir(); } });
  });
  var cab = raiz.querySelector('.cabecera');
  if (cab) {
    var a = document.createElement('div');
    a.className = 'aviso aviso-azul aviso-relleno';
    a.innerHTML = '<p class="aviso-tit">Se llena en pantalla</p><p>Haz clic en cada casilla y escribe directamente. Al terminar, pulsa «Guardar como PDF» (arriba) para conservar tu copia. No necesitas imprimir.</p>';
    cab.parentNode.insertBefore(a, cab.nextSibling);
  }
});
