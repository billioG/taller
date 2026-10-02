/* Tarjetas de bloques en pantalla: ordena las tarjetas tocándolas en el orden correcto. */
(function () {
  var JUEGOS = [
    {
      titulo: 'Juego 1 · El saludo que responde',
      consigna: 'Ordena las tarjetas para que el personaje salude, pregunte y responda con tu nombre.',
      cartas: [
        { id: 'a', t: 'al presionar bandera verde', c: 'amarillo' },
        { id: 'b', t: 'decir «¡Hola! ¿Cómo te llamas?» durante 2 segundos', c: 'morado' },
        { id: 'c', t: 'preguntar «¿Cómo te llamas?» y esperar', c: 'celeste' },
        { id: 'd', t: 'decir (unir «Hola » respuesta) durante 2 segundos', c: 'morado' },
        { id: 'e', t: 'decir «¡Buena respuesta!» durante 1 segundo', c: 'morado' }
      ],
      reglas: [
        { primero: 'a', msg: 'Toda pila empieza con un sombrero amarillo. ¿Cuál es el que inicia el programa?' },
        { antes: ['b', 'c'], msg: '¿Qué pasaría si el personaje pregunta antes de saludar? Prueba cambiar el orden.' },
        { antes: ['c', 'd'], msg: 'El bloque «unir … respuesta» necesita la respuesta: ¿ya la preguntaste?' },
        { antes: ['c', 'e'], msg: 'La «buena respuesta» solo tiene sentido después de preguntar.' }
      ],
      exito: '¡Funciona! Esto es una secuencia: las instrucciones se leen de arriba abajo, como una receta.'
    },
    {
      titulo: 'Juego 2 · El personaje que se mueve',
      consigna: 'Ordena las tarjetas para que el personaje se mueva, gire y cambie de disfraz 10 veces.',
      cartas: [
        { id: 'a', t: 'al presionar bandera verde', c: 'amarillo' },
        { id: 'r', t: 'repetir (10)', c: 'naranja' },
        { id: 'm', t: 'mover 10 pasos', c: 'azul' },
        { id: 'g', t: 'girar ↻ 15 grados', c: 'azul' },
        { id: 'd', t: 'cambiar disfraz', c: 'morado' }
      ],
      reglas: [
        { primero: 'a', msg: 'Todo programa empieza con su sombrero amarillo.' },
        { antes: ['r', 'm'], msg: 'Lo que se repite va dentro del bloque «repetir». ¿Dónde lo pondrías para que «mover» se repita?' },
        { antes: ['r', 'g'], msg: 'El giro también debe quedar dentro de «repetir».' },
        { antes: ['r', 'd'], msg: 'El cambio de disfraz también debe quedar dentro de «repetir».' }
      ],
      exito: '¡Muy bien! Todo lo que está dentro de «repetir» se hace 10 veces: eso es un bucle.'
    },
    {
      titulo: 'Juego 3 · El semáforo',
      consigna: 'Hay dos pilas: una para el verde y otra para el rojo. Ordena las tarjetas para que cada mensaje cambie su disfraz.',
      cartas: [
        { id: 'v1', t: 'al recibir «mensaje verde»', c: 'amarillo' },
        { id: 'v2', t: 'cambiar disfraz a verde', c: 'morado' },
        { id: 'r1', t: 'al recibir «mensaje rojo»', c: 'amarillo' },
        { id: 'r2', t: 'cambiar disfraz a rojo', c: 'morado' },
        { id: 'k', t: 'al hacer clic en este objeto', c: 'amarillo' }
      ],
      reglas: [
        { antes: ['v1', 'v2'], msg: 'Un sombrero amarillo va antes de lo que provoca. ¿Qué tarjeta debe ir antes de «cambiar disfraz a verde»?' },
        { antes: ['r1', 'r2'], msg: 'Lo mismo con el rojo: el sombrero «al recibir» va primero.' }
      ],
      exito: '¡Bien! Cada «al recibir» es un sombrero: despierta su propia pila cuando le llega el mensaje.'
    },
    {
      titulo: 'Juego 4 · El contador',
      consigna: 'Ordena las tarjetas para llevar un puntaje y avisar cuando el número es más bajo.',
      cartas: [
        { id: 'f', t: 'fijar [puntos] a 0', c: 'variables' },
        { id: 'p', t: 'cambiar [puntos] en 1', c: 'variables' },
        { id: 'n', t: 'cambiar [puntos] en −1', c: 'variables' },
        { id: 's', t: 'si (respuesta) > (número) entonces', c: 'naranja' },
        { id: 'd', t: 'decir «Más bajo» durante 1 segundo', c: 'morado' }
      ],
      reglas: [
        { primero: 'f', msg: 'Una variable se inicia primero. ¿Cuál tarjeta la pone en 0?' },
        { antes: ['s', 'd'], msg: 'El mensaje va dentro del «si»: la condición va antes.' }
      ],
      exito: '¡Listo! Una variable guarda un número que cambia, y la condición decide qué se hace.'
    }
  ];

  function barajar(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  function montar(juego, host) {
    var orden = [];
    var sec = el('section', 'juego');
    sec.appendChild(el('h2', null, juego.titulo));
    sec.appendChild(el('p', null, juego.consigna));
    var zona = el('div', 'zona');
    var colA = el('div', 'col');
    colA.appendChild(el('h3', null, 'Tarjetas'));
    var mazo = el('div', 'mazo');
    colA.appendChild(mazo);
    var colB = el('div', 'col');
    colB.appendChild(el('h3', null, 'Tu orden (de arriba abajo)'));
    var lista = el('ol', 'orden');
    colB.appendChild(lista);
    zona.appendChild(colA);
    zona.appendChild(colB);
    sec.appendChild(zona);
    var acc = el('div', 'acciones');
    var bOk = el('button', 'btn-j primario', 'Comprobar');
    var bReset = el('button', 'btn-j', 'Reiniciar');
    bOk.type = 'button'; bReset.type = 'button';
    acc.appendChild(bOk); acc.appendChild(bReset);
    sec.appendChild(acc);
    var res = el('div', 'resultado');
    res.setAttribute('role', 'status');
    res.setAttribute('aria-live', 'polite');
    sec.appendChild(res);
    host.appendChild(sec);

    var barajadas = barajar(juego.cartas);
    function porId(id) { return juego.cartas.filter(function (c) { return c.id === id; })[0]; }

    function pintar() {
      mazo.innerHTML = ''; lista.innerHTML = '';
      barajadas.forEach(function (c) {
        if (orden.indexOf(c.id) >= 0) return;
        var b = el('button', 'tj tj-' + c.c, c.t);
        b.type = 'button';
        b.addEventListener('click', function () { orden.push(c.id); res.textContent = ''; res.className = 'resultado'; pintar(); });
        mazo.appendChild(b);
      });
      if (!mazo.children.length) mazo.appendChild(el('p', 'vacio', 'Ya colocaste todas las tarjetas. Pulsa «Comprobar».'));
      orden.forEach(function (id, i) {
        var c = porId(id);
        var li = el('li');
        var b = el('button', 'tj tj-' + c.c, c.t);
        b.type = 'button';
        b.title = 'Toca para devolverla';
        b.addEventListener('click', function () { orden.splice(i, 1); res.textContent = ''; res.className = 'resultado'; pintar(); });
        li.appendChild(b);
        lista.appendChild(li);
      });
      if (!orden.length) lista.appendChild(el('li', 'vacio', 'Toca las tarjetas en el orden que creas correcto.'));
    }

    bOk.addEventListener('click', function () {
      if (orden.length < juego.cartas.length) {
        res.className = 'resultado aviso-j';
        res.textContent = 'Coloca las ' + juego.cartas.length + ' tarjetas antes de comprobar.';
        return;
      }
      var fallos = [];
      juego.reglas.forEach(function (r) {
        if (r.primero && orden[0] !== r.primero) fallos.push(r.msg);
        if (r.antes && orden.indexOf(r.antes[0]) > orden.indexOf(r.antes[1])) fallos.push(r.msg);
      });
      if (!fallos.length) { res.className = 'resultado bien'; res.textContent = '✅ ' + juego.exito; }
      else { res.className = 'resultado mal'; res.textContent = '🤔 ' + fallos.slice(0, 2).join(' ') + ' Inténtalo de nuevo.'; }
    });
    bReset.addEventListener('click', function () { orden = []; barajadas = barajar(juego.cartas); res.textContent = ''; res.className = 'resultado'; pintar(); });
    pintar();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('juegos');
    if (host) JUEGOS.forEach(function (j) { montar(j, host); });
  });
})();
