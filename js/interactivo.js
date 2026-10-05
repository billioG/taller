/* ==========================================================================
   Taller de Scratch · enlace corto + QR, encuestas en vivo y frase final
   (nube de palabras con forma de «NDG.»)
   ========================================================================== */

// ---------------------------------------------------------------------------
// ENLACE CORTO + QR
// ---------------------------------------------------------------------------
/** Enlace para compartir con los docentes: el dominio solo (la sala por defecto no necesita parámetros). */
function enlaceCorto() {
  const base = location.origin + location.pathname;
  const q = [];
  if (TALLER_ID !== TALLER_PRINCIPAL) q.push('t=' + encodeURIComponent(TALLER_ID));
  if (app.sala !== TALLER.salaPorDefecto) q.push('sala=' + encodeURIComponent(app.sala));
  return q.length ? base + '?' + q.join('&') : base;
}

/** Dibuja un QR (SVG generado por la librería local) dentro de `host`. */
function pintarQR(host, url) {
  if (!host) return;
  host.innerHTML = '';
  try {
    const q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    host.innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Código QR para entrar al taller');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
    }
  } catch {
    host.textContent = url;
  }
}

function actualizarEnlaceFacilitador() {
  const url = enlaceCorto();
  const t = $('#enlaceTexto');
  if (t) t.textContent = url.replace(/^https?:\/\//, '');
  pintarQR($('#qrBox'), url);
}

function abrirQRGrande() {
  const url = enlaceCorto();
  pintarQR($('#qrGrande'), url);
  $('#qrGrandeUrl').textContent = url.replace(/^https?:\/\//, '');
  $('#qrGrandePin').textContent = app.pinPart ? 'PIN: ' + app.pinPart : '';
  $('#overlayQR').hidden = false;
}

// ---------------------------------------------------------------------------
// PIN DE PARTICIPANTES (panel del facilitador)
// ---------------------------------------------------------------------------
function pintarPinPart() {
  const v = $('#pinPartValor');
  if (v) v.textContent = app.pinPart || 'Sin PIN (entrada libre)';
}

function generarPin() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(10000 + (a[0] % 90000));
}

async function nuevoPinPart(auto) {
  try {
    const pin = generarPin();
    await fijarPinPart(app.sala, app.clave, pin);
    app.pinPart = pin;
    guardarLS('taller.pinabierto' + SFX, '');
    pintarPinPart();
    mostrarToast((auto ? 'Se generó el PIN de los docentes: ' : 'Nuevo PIN: ') + pin, 'ok', 6000);
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

async function quitarPinPart() {
  if (!confirm('¿Quitar el PIN? Cualquiera con el enlace podrá entrar.')) return;
  try {
    await fijarPinPart(app.sala, app.clave, null);
    app.pinPart = '';
    guardarLS('taller.pinabierto' + SFX, '1');
    pintarPinPart();
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

async function cargarPinPart() {
  $('#btnNuevoPinPart')?.addEventListener('click', () => nuevoPinPart(false));
  $('#btnQuitarPinPart')?.addEventListener('click', quitarPinPart);
  try {
    app.pinPart = await leerPinPart(app.sala, app.clave);
    // Primera vez: se genera uno solo para no dejar la sala abierta por descuido
    if (!app.pinPart && !leerLS('taller.pinabierto' + SFX, '')) { await nuevoPinPart(true); return; }
    pintarPinPart();
  } catch (e) {
    console.warn('[taller] PIN de participantes:', e.message);
    const v = $('#pinPartValor');
    if (v) v.textContent = 'Ejecuta supabase.sql para activar el PIN';
  }
}

// ---------------------------------------------------------------------------
// AVISO DE PINTURA CON LA CARA (sala abierta por el docente)
// ---------------------------------------------------------------------------
function pinturaAviso(p) {
  if (app.rol !== 'docente') return;
  if (p && /^[A-Z0-9]{6}$/.test(p.code || '')) app.pintura = { code: p.code, kind: p.kind === 'race' ? 'race' : 'teams', ts: Date.now() };
  else app.pintura = null;
  const c = $('#interactivoDocente');
  if (c) c.dataset.firma = '';
  renderInteractivoDocente();
}

// ---------------------------------------------------------------------------
// ENCUESTAS EN VIVO
// ---------------------------------------------------------------------------
const ENCUESTAS_RAPIDAS = [
  { pregunta: '¿Qué tan cómodo/a te sientes con la computadora?', opciones: ['1 · Nada', '2', '3', '4', '5 · Muy cómodo/a'] },
  { pregunta: '¿Habías creado material digital interactivo antes?', opciones: ['Nunca', 'Alguna vez', 'Con frecuencia'] },
  { pregunta: '¿Crees que tus estudiantes harían algo así?', opciones: ['Sí', 'Tal vez', 'No'] },
  { pregunta: '¿Cómo vas con el ejercicio?', opciones: ['Ya lo logré', 'Voy en camino', 'Me trabé'] },
  { pregunta: '¿Cuándo lo llevarías a tu aula?', opciones: ['Esta semana', 'Este mes', 'Aún no sé'] },
  { pregunta: '¿Qué dudas tienes hasta ahora?', tipo: 'abierta' },
  { pregunta: '¿Qué fue lo más difícil de este paso?', tipo: 'abierta' },
  { pregunta: 'Una palabra que describa cómo te sientes', tipo: 'abierta' },
];

/** Encuesta de salida del taller: se lanzan una por una desde el panel. */
const ENCUESTA_SALIDA = TALLER.encuestaSalida || [];

/** Devuelve la encuesta del estado solo si tiene forma válida (nunca se pinta algo inesperado). */
function encuestaValida(e) {
  if (!e || typeof e !== 'object') return null;
  if (typeof e.id !== 'string' || !/^[a-z0-9]{1,20}$/.test(e.id)) return null;
  if (typeof e.pregunta !== 'string' || !e.pregunta || e.pregunta.length > 200) return null;
  const libre = e.tipo === 'abierta';
  if (!Array.isArray(e.opciones)) return null;
  if (!libre && (e.opciones.length < 2 || e.opciones.length > 6)) return null;
  if (libre && e.opciones.length) return null;
  if (!e.opciones.every((o) => typeof o === 'string' && o && o.length <= 80)) return null;
  const conteos = Array.isArray(e.conteos) ? e.conteos : [];
  return {
    id: e.id,
    tipo: libre ? 'abierta' : 'opciones',
    mostrar: e.mostrar === true,
    pregunta: e.pregunta,
    opciones: e.opciones,
    abierta: e.abierta === true,
    conteos: e.opciones.map((_, i) => Math.max(0, parseInt(conteos[i], 10) || 0)),
  };
}

/** Barras de resultados (sirve para docentes y facilitador). `miVoto` resalta la opción elegida. */
function dibujarBarras(host, enc, miVoto, alVotar) {
  const total = enc.conteos.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...enc.conteos);
  enc.opciones.forEach((op, i) => {
    const fila = el(alVotar ? 'button' : 'div', 'enc-fila' + (miVoto === i ? ' mio' : ''));
    if (alVotar) {
      fila.type = 'button';
      fila.addEventListener('click', () => alVotar(i));
    }
    const barra = el('span', 'enc-barra');
    barra.style.width = (enc.conteos[i] / max) * 100 + '%';
    fila.appendChild(barra);
    fila.appendChild(el('span', 'enc-op', op));
    const pct = total ? Math.round((enc.conteos[i] / total) * 100) : 0;
    fila.appendChild(el('span', 'enc-n', enc.conteos[i] + ' · ' + pct + '%'));
    host.appendChild(fila);
  });
  host.appendChild(el('p', 'enc-total', total + (total === 1 ? ' respuesta' : ' respuestas')));
}

/** Los docentes votan. */
async function votarAhora(i) {
  const enc = encuestaValida(app.estado?.encuesta);
  if (!enc || !enc.abierta) return;
  try {
    app.estado = await votarEncuesta(app.sala, enc.id, miVotanteId(), i);
    guardarLS('taller.voto.' + app.sala + '.' + enc.id, String(i));
    await emitirEstado(app.canal);
    renderInteractivoDocente();
  } catch (e) {
    mostrarToast(e.message, 'err');
    refrescarEstado();
  }
}

// ---------------------------------------------------------------------------
// PREGUNTAS DE RESPUESTA LIBRE
// ---------------------------------------------------------------------------
let __resp = { poll: '', lista: [], firma: '', pidiendo: false, t: 0 };

/** Lee las respuestas de la pregunta libre activa (máx. 1 lectura cada 1.5 s). */
async function refrescarRespuestas(poll, forzar) {
  if (!SB_LISTO || !sb || !poll || __resp.pidiendo) return false;
  if (__resp.poll !== poll) { __resp = { poll, lista: [], firma: '', pidiendo: false, t: 0 }; forzar = true; }
  if (!forzar && Date.now() - __resp.t < 1500) return false;
  __resp.pidiendo = true;
  try {
    const lista = await leerRespuestas(app.sala, poll);
    __resp.t = Date.now();
    const firma = lista.map((r) => r.id + ':' + r.texto).join('|');
    const cambio = firma !== __resp.firma;
    __resp.lista = lista;
    __resp.firma = firma;
    return cambio;
  } catch (e) {
    console.warn('[taller] respuestas:', e.message);
    return false;
  } finally {
    __resp.pidiendo = false;
  }
}

async function enviarMiRespuesta(enc, texto) {
  try {
    await enviarRespuesta(app.sala, enc.id, miVotanteId(), texto);
    guardarLS('taller.resp.' + app.sala + '.' + enc.id, texto);
    await emitirEstado(app.canal);
    mostrarToast('✓ ¡Respuesta enviada!', 'ok');
    const c = $('#interactivoDocente');
    if (c) c.dataset.firma = '';
    renderInteractivoDocente();
  } catch (e) {
    mostrarToast(e.message, 'err');
  }
}

// ---------------------------------------------------------------------------
// FRASE FINAL
// ---------------------------------------------------------------------------
function fraseEstado() {
  const f = app.estado?.frases_estado || {};
  return { abierta: f.abierta === true, mostrar: f.mostrar === true };
}

async function enviarMiFrase(texto) {
  try {
    await enviarFrase(app.sala, miVotanteId(), texto);
    guardarLS('taller.frase.' + app.sala, texto);
    await emitirEstado(app.canal);
    mostrarToast('✓ ¡Frase enviada!', 'ok');
    renderInteractivoDocente();
  } catch (e) {
    mostrarToast(e.message, 'err');
  }
}

let __frases = { lista: [], firma: '', pidiendo: false, t: 0 };

/** Lee las frases (máx. 1 lectura cada 1.5 s) y devuelve true si cambiaron. */
async function refrescarFrases(forzar) {
  if (!SB_LISTO || !sb || __frases.pidiendo) return false;
  if (!forzar && Date.now() - __frases.t < 1500) return false;
  __frases.pidiendo = true;
  try {
    const lista = await leerFrases(app.sala);
    __frases.t = Date.now();
    const firma = lista.map((f) => f.id + ':' + f.texto).join('|');
    const cambio = firma !== __frases.firma;
    __frases.lista = lista;
    __frases.firma = firma;
    return cambio;
  } catch (e) {
    console.warn('[taller] frases:', e.message);
    return false;
  } finally {
    __frases.pidiendo = false;
  }
}

// ---------------------------------------------------------------------------
// NUBE DE PALABRAS CON FORMA DE TEXTO («NDG.»)
// ---------------------------------------------------------------------------
const NUBE_PALETA = ['#2B4C8C', '#1F7A5C', '#C1275B', '#D9532B', '#1E3663', '#8A6D00'];
const NUBE_FUENTE = 'system-ui, "Segoe UI", Roboto, Arial, sans-serif';
const NUBE_VACIAS = new Set(('de la que el en y a los se del las un por con no una su para es al lo como mas pero sus le ya o fue este ha si porque esta son entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos durante todos uno les ni contra otros ese eso ante ellos e esto antes algunos unos yo otro otras otra el tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tu te ti tus ellas esos esas estoy esta estamos estan habia ser soy eres somos sido tengo tiene tenemos tienen ahora aunque').split(' '));

function sinTildes(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Palabras con su peso (frecuencia), ya sin palabras vacías. */
function palabrasDeFrases(textos) {
  const cuenta = new Map();
  const contar = (filtrar) => {
    cuenta.clear();
    textos.forEach((t) => {
      const ws = String(t).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
      ws.forEach((w) => {
        if (filtrar && NUBE_VACIAS.has(sinTildes(w))) return;
        cuenta.set(w, (cuenta.get(w) || 0) + 1);
      });
    });
  };
  contar(true);
  if (cuenta.size < 3) contar(false);
  return [...cuenta.entries()]
    .map(([w, n]) => ({ texto: w.charAt(0).toUpperCase() + w.slice(1), peso: n }))
    .sort((a, b) => b.peso - a.peso)
    .slice(0, 120);
}

/**
 * Dibuja en `canvas` las palabras de las frases llenando la forma del texto `forma`.
 * Coloca cada palabra solo donde TODOS sus píxeles caen dentro de las letras.
 */
function dibujarNube(canvas, textos, forma) {
  const W = (canvas.width = 1400), H = (canvas.height = 560);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // 1) Máscara con la forma («NDG.»)
  const m = document.createElement('canvas');
  m.width = W; m.height = H;
  const mc = m.getContext('2d', { willReadFrequently: true });
  const fam = '900 {S}px "Arial Black", Impact, ' + NUBE_FUENTE;
  mc.font = fam.replace('{S}', '200');
  const med = mc.measureText(forma);
  const wTxt = med.width;
  const hTxt = (med.actualBoundingBoxAscent || 150) + (med.actualBoundingBoxDescent || 0);
  const k = Math.min((W * 0.95) / wTxt, (H * 0.9) / hTxt);
  const size = 200 * k;
  mc.font = fam.replace('{S}', String(size));
  mc.fillStyle = '#000';
  mc.textBaseline = 'alphabetic';
  mc.fillText(forma, (W - wTxt * k) / 2, (H + hTxt * k) / 2 - (med.actualBoundingBoxDescent || 0) * k);
  const data = mc.getImageData(0, 0, W, H).data;

  const g = 3; // tamaño de celda
  const gw = Math.ceil(W / g), gh = Math.ceil(H / g);
  const libre = new Uint8Array(gw * gh);
  let minX = gw, maxX = 0, minY = gh, maxY = 0;
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      const px = Math.min(W - 1, cx * g + 1), py = Math.min(H - 1, cy * g + 1);
      if (data[(py * W + px) * 4 + 3] > 128) {
        libre[cy * gw + cx] = 1;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      }
    }
  }

  const palabras = palabrasDeFrases(textos);
  if (!palabras.length) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.drawImage(m, 0, 0);
    ctx.restore();
    ctx.fillStyle = '#6B6157';
    ctx.font = '600 28px ' + NUBE_FUENTE;
    ctx.textAlign = 'center';
    ctx.fillText('Aquí aparecerán las frases del taller', W / 2, H - 24);
    return 0;
  }

  // silueta tenue de la forma, para que se lea «NDG.» aunque haya pocas frases
  ctx.save(); ctx.globalAlpha = 0.07; ctx.drawImage(m, 0, 0); ctx.restore();

  // 2) Colocación
  const t = document.createElement('canvas');
  const tc = t.getContext('2d', { willReadFrequently: true });
  const maxPeso = palabras[0].peso;
  const hMask = (maxY - minY + 1) * g;
  const tamMax = Math.max(40, hMask * 0.3), tamMin = 9;
  let colocadas = 0;
  const t0 = performance.now();

  function intentar(texto, tam, rotar, color) {
    tc.font = '800 ' + tam + 'px ' + NUBE_FUENTE;
    const w = Math.ceil(tc.measureText(texto).width) + 4, h = Math.ceil(tam * 1.2);
    const cw = rotar ? h : w, ch = rotar ? w : h;
    t.width = cw; t.height = ch;
    tc.clearRect(0, 0, cw, ch);
    tc.font = '800 ' + tam + 'px ' + NUBE_FUENTE;
    tc.textBaseline = 'middle';
    tc.fillStyle = '#000';
    if (rotar) { tc.translate(cw / 2, ch / 2); tc.rotate(-Math.PI / 2); tc.textAlign = 'center'; tc.fillText(texto, 0, 0); }
    else { tc.textAlign = 'center'; tc.fillText(texto, cw / 2, ch / 2); }
    const px = tc.getImageData(0, 0, cw, ch).data;
    const celdas = [];
    const vistos = new Set();
    for (let y = 0; y < ch; y += 2) {
      for (let x = 0; x < cw; x += 2) {
        if (px[(y * cw + x) * 4 + 3] > 90) {
          const key = Math.floor(y / g) * 4096 + Math.floor(x / g);
          if (!vistos.has(key)) { vistos.add(key); celdas.push([Math.floor(x / g), Math.floor(y / g)]); }
        }
      }
    }
    if (!celdas.length) return false;
    const anchoC = Math.ceil(cw / g), altoC = Math.ceil(ch / g);
    const rangoX = maxX - minX + 1 - anchoC, rangoY = maxY - minY + 1 - altoC;
    if (rangoX < 0 || rangoY < 0) return false;
    for (let intento = 0; intento < 220; intento++) {
      const ox = minX + Math.floor(Math.random() * (rangoX + 1));
      const oy = minY + Math.floor(Math.random() * (rangoY + 1));
      let ok = true;
      for (let i = 0; i < celdas.length; i++) {
        if (!libre[(oy + celdas[i][1]) * gw + ox + celdas[i][0]]) { ok = false; break; }
      }
      if (!ok) continue;
      // ocupar (con 1 celda de margen)
      for (let i = 0; i < celdas.length; i++) {
        const bx = ox + celdas[i][0], by = oy + celdas[i][1];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = bx + dx, yy = by + dy;
          if (xx >= 0 && yy >= 0 && xx < gw && yy < gh) libre[yy * gw + xx] = 0;
        }
      }
      // pintar
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = '800 ' + tam + 'px ' + NUBE_FUENTE;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.translate(ox * g + cw / 2, oy * g + ch / 2);
      if (rotar) ctx.rotate(-Math.PI / 2);
      ctx.fillText(texto, 0, 0);
      ctx.restore();
      colocadas++;
      return true;
    }
    return false;
  }

  // 2a) palabras principales, de la más grande a la más chica
  palabras.forEach((p, idx) => {
    let tam = tamMin + (tamMax - tamMin) * Math.pow(p.peso / maxPeso, 0.6);
    const color = NUBE_PALETA[idx % NUBE_PALETA.length];
    while (tam >= tamMin && performance.now() - t0 < 1400) {
      if (intentar(p.texto, tam, idx % 4 === 3, color) || intentar(p.texto, tam, !(idx % 4 === 3), color)) return;
      tam *= 0.9;
    }
  });

  // 2b) relleno: repetir palabras chicas hasta que ya no quepa nada
  let fallos = 0, vuelta = 0;
  while (fallos < 160 && colocadas < 1500 && performance.now() - t0 < 1700) {
    const p = palabras[vuelta % palabras.length];
    const tam = tamMin + Math.random() * 14;
    const color = NUBE_PALETA[(vuelta + 2) % NUBE_PALETA.length];
    if (intentar(p.texto, tam, Math.random() < 0.3, color)) fallos = 0; else fallos++;
    vuelta++;
  }
  return colocadas;
}

/** Dibuja la nube solo si las frases cambiaron desde la última vez. */
function pintarNube(canvas) {
  if (!canvas) return;
  const firma = __frases.firma + '|' + TALLER.nube.texto;
  if (canvas.dataset.firma === firma) return;
  canvas.dataset.firma = firma;
  dibujarNube(canvas, __frases.lista.map((f) => f.texto), TALLER.nube.texto);
}

function descargarNube(canvas) {
  if (!canvas || !canvas.width) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'frases-del-taller.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// ---------------------------------------------------------------------------
// DOCENTES: tarjeta de encuesta / frase / imagen
// ---------------------------------------------------------------------------
async function renderInteractivoDocente() {
  const cont = $('#interactivoDocente');
  if (!cont || app.rol !== 'docente') return;
  const e = app.estado || {};
  const enc = encuestaValida(e.encuesta);
  const fr = fraseEstado();

  if (enc && enc.tipo === 'abierta' && enc.mostrar) await refrescarRespuestas(enc.id, false);

  // Nueva encuesta abierta: avisar y llevar a «En vivo»
  if (enc && enc.abierta && app.encuestaVista !== enc.id) {
    app.encuestaVista = enc.id;
    mostrarToast(enc.tipo === 'abierta' ? '❓ Nueva pregunta: ¡responde!' : '📊 Nueva encuesta: ¡vota!', 'alerta', 6000);
    sonar();
    if (typeof window.__irAEnVivo === 'function') window.__irAEnVivo();
  }
  if (fr.abierta && !app.frasesAvisadas) {
    app.frasesAvisadas = true;
    mostrarToast('💬 Escribe una frase que resuma el taller', 'alerta', 7000);
    sonar();
    if (typeof window.__irAEnVivo === 'function') window.__irAEnVivo();
  }
  if (!fr.abierta) app.frasesAvisadas = false;

  // Evitar repintar (y perder lo que escribe el docente) si nada cambió
  const miVoto = enc ? leerLS('taller.voto.' + app.sala + '.' + enc.id, '') : '';
  const miFrase = leerLS('taller.frase.' + app.sala, '');
  const pint = app.pintura && Date.now() - app.pintura.ts < 12000 ? app.pintura : null;
  const miResp = enc && enc.tipo === 'abierta' ? leerLS('taller.resp.' + app.sala + '.' + enc.id, '') : '';
  const firma = JSON.stringify([enc, miVoto, fr, miFrase, fr.mostrar ? __frases.firma : '', miResp, enc && enc.mostrar ? __resp.firma : '', pint && pint.code]);
  if (cont.dataset.firma === firma) return;
  const escribiendo = cont.querySelector('textarea');
  if (escribiendo && document.activeElement === escribiendo && fr.abierta) {
    cont.dataset.firma = firma; // no interrumpir mientras escribe
    return;
  }
  cont.dataset.firma = firma;
  cont.innerHTML = '';

  if (pint) {
    const card = el('section', 'interactivo-card pintura');
    card.appendChild(el('span', 'interactivo-kicker', '🎨 Pintura con la cara · ' + (pint.kind === 'race' ? 'competencia abierta' : 'sala por equipos abierta')));
    card.appendChild(el('h3', 'interactivo-tit', 'Código de la sala: ' + pint.code));
    const a = el('a', 'btn primary', '🏁 Abrir el juego y unirme');
    a.href = 'material/participantes/pintura-con-la-cara.html?sala=' + pint.code + '&taller=' + encodeURIComponent(app.sala);
    a.target = '_blank';
    a.rel = 'noopener';
    card.appendChild(a);
    const qr = el('div', 'qr-mini');
    card.appendChild(qr);
    cont.appendChild(card);
    pintarQR(qr, new URL('p', location.href).href + '?' + pint.code);
  }

  if (enc && enc.tipo === 'abierta') {
    const card = el('section', 'interactivo-card');
    card.appendChild(el('span', 'interactivo-kicker', '❓ Pregunta abierta' + (enc.abierta ? '' : ' · cerrada')));
    card.appendChild(el('h3', 'interactivo-tit', enc.pregunta));
    if (enc.abierta) {
      const ta = document.createElement('textarea');
      ta.className = 'frase-input';
      ta.maxLength = 200;
      ta.rows = 3;
      ta.placeholder = 'Escribe tu respuesta…';
      ta.value = miResp;
      ta.setAttribute('aria-label', 'Tu respuesta');
      const cuenta = el('span', 'frase-cuenta', ta.value.length + '/200');
      ta.addEventListener('input', () => { cuenta.textContent = ta.value.length + '/200'; });
      const btn = el('button', 'btn primary', miResp ? 'Actualizar mi respuesta' : 'Enviar respuesta');
      btn.type = 'button';
      btn.addEventListener('click', async () => {
        const v = ta.value.trim();
        if (!v) { mostrarToast('Escribe tu respuesta primero', 'err'); return; }
        btn.disabled = true;
        await enviarMiRespuesta(enc, v);
        btn.disabled = false;
      });
      card.appendChild(ta);
      const fila = el('div', 'frase-fila');
      fila.appendChild(cuenta);
      fila.appendChild(btn);
      card.appendChild(fila);
    } else if (miResp) {
      card.appendChild(el('p', 'bloque-nota', 'Tu respuesta: «' + miResp + '»'));
    }
    if (enc.mostrar) {
      const muro = el('div', 'resp-muro');
      __resp.lista.forEach((r) => muro.appendChild(el('div', 'resp-chip', r.texto)));
      if (!__resp.lista.length) muro.appendChild(el('p', 'bloque-nota', 'Todavía no hay respuestas.'));
      card.appendChild(muro);
    }
    cont.appendChild(card);
  } else if (enc) {
    const card = el('section', 'interactivo-card');
    card.appendChild(el('span', 'interactivo-kicker', '📊 Encuesta en vivo' + (enc.abierta ? '' : ' · cerrada')));
    card.appendChild(el('h3', 'interactivo-tit', enc.pregunta));
    const votado = miVoto !== '' ? parseInt(miVoto, 10) : null;
    const lista = el('div', 'enc-lista');
    if (enc.abierta && votado === null) {
      enc.opciones.forEach((op, i) => {
        const b = el('button', 'enc-opcion', op);
        b.type = 'button';
        b.addEventListener('click', () => votarAhora(i));
        lista.appendChild(b);
      });
    } else {
      dibujarBarras(lista, enc, votado, enc.abierta ? votarAhora : null);
      if (enc.abierta) lista.appendChild(el('p', 'bloque-nota', 'Toca otra opción si quieres cambiar tu voto.'));
    }
    card.appendChild(lista);
    cont.appendChild(card);
  }

  if (fr.abierta) {
    const card = el('section', 'interactivo-card frase');
    card.appendChild(el('span', 'interactivo-kicker', '💬 Frase final'));
    card.appendChild(el('h3', 'interactivo-tit', 'Escribe una frase en la que resumas el taller'));
    const ta = document.createElement('textarea');
    ta.className = 'frase-input';
    ta.maxLength = 140;
    ta.rows = 3;
    ta.placeholder = 'Ej: Aprendí que programar es como seguir una receta';
    ta.value = miFrase;
    ta.setAttribute('aria-label', 'Tu frase');
    const cuenta = el('span', 'frase-cuenta', ta.value.length + '/140');
    ta.addEventListener('input', () => { cuenta.textContent = ta.value.length + '/140'; });
    const btn = el('button', 'btn primary', miFrase ? 'Actualizar mi frase' : 'Enviar mi frase');
    btn.type = 'button';
    btn.addEventListener('click', async () => {
      const v = ta.value.trim();
      if (!v) { mostrarToast('Escribe tu frase primero', 'err'); return; }
      btn.disabled = true;
      await enviarMiFrase(v);
      btn.disabled = false;
    });
    card.appendChild(ta);
    const fila = el('div', 'frase-fila');
    fila.appendChild(cuenta);
    fila.appendChild(btn);
    card.appendChild(fila);
    cont.appendChild(card);
  } else if (fr.mostrar) {
    const card = el('section', 'interactivo-card nube');
    card.appendChild(el('span', 'interactivo-kicker', '✨ Lo que dijimos entre todos'));
    const canvas = document.createElement('canvas');
    canvas.className = 'nube-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Nube con las frases del taller');
    card.appendChild(canvas);
    const btn = el('button', 'btn', '⬇ Descargar imagen');
    btn.type = 'button';
    btn.addEventListener('click', () => descargarNube(canvas));
    card.appendChild(btn);
    cont.appendChild(card);
    await refrescarFrases(!__frases.firma);
    pintarNube(canvas);
  }
}

// ---------------------------------------------------------------------------
// FACILITADOR: paneles de encuesta y frases
// ---------------------------------------------------------------------------
function iniciarPanelEncuesta() {
  const cont = $('#encPresets');
  if (!cont || cont.dataset.listo) return;
  cont.dataset.listo = '1';
  ENCUESTAS_RAPIDAS.forEach((q) => {
    const b = el('button', 'btn btn-mini', q.etiqueta || q.pregunta);
    b.type = 'button';
    b.addEventListener('click', () => lanzarEncuesta(q.pregunta, q.opciones || [], q.tipo));
    cont.appendChild(b);
  });
  cont.parentNode.insertBefore(el('h3', 'enc-sub', 'Encuesta de salida (cinco preguntas, una por una)'), cont.nextSibling);
  const salida = el('div', 'enc-presets');
  ENCUESTA_SALIDA.forEach((q) => {
    const b = el('button', 'btn btn-mini', q.etiqueta);
    b.type = 'button';
    b.addEventListener('click', () => lanzarEncuesta(q.pregunta, q.opciones || [], q.tipo));
    salida.appendChild(b);
  });
  cont.parentNode.insertBefore(salida, cont.nextSibling.nextSibling);
  const tipoSel = $('#encTipo');
  const sincronizarTipo = () => {
    const libre = tipoSel.value === 'abierta';
    $('#encOpcionesWrap').hidden = libre;
    $('#btnLanzarEnc').textContent = libre ? 'Lanzar pregunta abierta' : 'Lanzar encuesta';
  };
  tipoSel.addEventListener('change', sincronizarTipo);
  sincronizarTipo();
  $('#btnLanzarEnc').addEventListener('click', () => {
    const p = $('#encPregunta').value.trim();
    const libre = tipoSel.value === 'abierta';
    const ops = libre ? [] : $('#encOpciones').value.split('\n').map((x) => x.trim()).filter(Boolean);
    if (!p) { mostrarToast('Escribe la pregunta', 'err'); return; }
    if (!libre && (ops.length < 2 || ops.length > 6)) { mostrarToast('Pon entre 2 y 6 opciones, una por línea', 'err'); return; }
    if (ops.some((o) => o.length > 80) || p.length > 200) { mostrarToast('Texto demasiado largo', 'err'); return; }
    lanzarEncuesta(p, ops, libre ? 'abierta' : 'opciones').then(() => { $('#encPregunta').value = ''; $('#encOpciones').value = ''; });
  });
}

async function lanzarEncuesta(pregunta, opciones, tipo) {
  try {
    const id = Date.now().toString(36);
    const libre = tipo === 'abierta';
    await escribirEstado(app.clave, {
      encuesta: libre
        ? { id, tipo: 'abierta', pregunta, opciones: [], abierta: true, mostrar: false }
        : { id, tipo: 'opciones', pregunta, opciones, abierta: true, conteos: opciones.map(() => 0) },
    });
    mostrarToast(libre ? '❓ Pregunta lanzada' : '📊 Encuesta lanzada', 'ok');
    renderInteractivoFacilitador();
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

async function cambiarEstadoEncuesta(abierta) {
  try {
    app.estado = await encuestaEstado(app.sala, app.clave, abierta);
    await emitirEstado(app.canal);
    mostrarToast(abierta ? 'Votación reabierta' : 'Votación cerrada', 'ok');
    renderInteractivoFacilitador();
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

async function quitarEncuesta() {
  try {
    await escribirEstado(app.clave, { encuesta: null });
    renderInteractivoFacilitador();
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

async function ponerFrases(estado, aviso) {
  try {
    await escribirEstado(app.clave, { frases_estado: estado });
    mostrarToast(aviso, 'ok');
    renderInteractivoFacilitador(true);
  } catch (e) {
    mostrarToast(mensajeError(e), 'err');
  }
}

function iniciarPanelFrases() {
  const b = $('#btnAbrirFrases');
  if (!b || b.dataset.listo) return;
  b.dataset.listo = '1';
  b.addEventListener('click', () => ponerFrases({ abierta: true, mostrar: false }, '💬 Frases abiertas: los docentes ya pueden escribir'));
  $('#btnMostrarNube').addEventListener('click', () => ponerFrases({ abierta: false, mostrar: true }, '✨ Imagen publicada para todos'));
  $('#btnOcultarNube').addEventListener('click', () => ponerFrases({ abierta: false, mostrar: false }, 'Frases cerradas'));
  $('#btnLimpiarFrases').addEventListener('click', async () => {
    if (!confirm('¿Borrar TODAS las frases recibidas?')) return;
    try {
      await limpiarFrases(app.sala, app.clave);
      await emitirEstado(app.canal);
      await refrescarFrases(true);
      renderInteractivoFacilitador(true);
    } catch (e) {
      mostrarToast(mensajeError(e), 'err');
    }
  });
  $('#btnDescargarNube').addEventListener('click', () => descargarNube($('#nubeFac')));
  $('#btnProyectarNube').addEventListener('click', async () => {
    await refrescarFrases(true);
    $('#overlayNube').hidden = false;
    const c = $('#nubeGrande');
    delete c.dataset.firma;
    pintarNube(c);
  });
}

async function renderInteractivoFacilitador(forzar) {
  if (app.rol !== 'facilitador' || !SB_LISTO) return;
  const e = app.estado || {};

  // --- encuesta activa
  const act = $('#encActiva');
  if (act) {
    const enc = encuestaValida(e.encuesta);
    act.innerHTML = '';
    if (enc) {
      const card = el('div', 'enc-activa');
      card.appendChild(el('h3', 'interactivo-tit', enc.pregunta));
      card.appendChild(el('span', 'interactivo-kicker', enc.abierta ? '● Votación abierta' : 'Votación cerrada'));
      if (enc.tipo === 'abierta') {
        await refrescarRespuestas(enc.id, !!forzar);
        card.appendChild(el('p', 'enc-total', __resp.lista.length + (__resp.lista.length === 1 ? ' respuesta' : ' respuestas')));
        const lista = el('div', 'frases-lista');
        __resp.lista.forEach((r) => {
          const fila = el('div', 'frase-item');
          fila.appendChild(el('span', 'frase-texto', r.texto));
          const x = el('button', 'btn btn-mini ghost', '✕');
          x.type = 'button';
          x.title = 'Quitar esta respuesta';
          x.addEventListener('click', async () => {
            try {
              await borrarRespuesta(app.sala, r.id, app.clave);
              await emitirEstado(app.canal);
              await refrescarRespuestas(enc.id, true);
              renderInteractivoFacilitador(true);
            } catch (err) { mostrarToast(mensajeError(err), 'err'); }
          });
          fila.appendChild(x);
          lista.appendChild(fila);
        });
        card.appendChild(lista);
      } else {
        const barras = el('div', 'enc-lista');
        dibujarBarras(barras, enc, null, null);
        card.appendChild(barras);
      }
      const acc = el('div', 'fila-form');
      const bc = el('button', 'btn ' + (enc.abierta ? 'primary' : ''), enc.abierta ? 'Cerrar votación' : 'Reabrir votación');
      bc.type = 'button';
      bc.addEventListener('click', () => cambiarEstadoEncuesta(!enc.abierta));
      if (enc.tipo === 'abierta') {
        const bm = el('button', 'btn', enc.mostrar ? 'Ocultar respuestas a los docentes' : 'Mostrar respuestas a los docentes');
        bm.type = 'button';
        bm.addEventListener('click', async () => {
          try {
            await escribirEstado(app.clave, { encuesta: { id: enc.id, tipo: 'abierta', pregunta: enc.pregunta, opciones: [], abierta: enc.abierta, mostrar: !enc.mostrar } });
            renderInteractivoFacilitador(true);
          } catch (err) { mostrarToast(mensajeError(err), 'err'); }
        });
        acc.appendChild(bm);
      }
      const bq = el('button', 'btn ghost', 'Quitar de las pantallas');
      bq.type = 'button';
      bq.addEventListener('click', quitarEncuesta);
      acc.appendChild(bc);
      acc.appendChild(bq);
      card.appendChild(acc);
      act.appendChild(card);
    }
  }

  // --- frases
  const fr = fraseEstado();
  const estadoTxt = $('#frasesEstado');
  if (estadoTxt) {
    estadoTxt.textContent = fr.abierta ? '● Frases abiertas: los docentes están escribiendo'
      : fr.mostrar ? '✨ Imagen visible para todos' : 'Frases cerradas';
  }
  if (fr.abierta || fr.mostrar || forzar || __frases.lista.length) {
    const cambio = await refrescarFrases(!!forzar);
    if (cambio || forzar) {
      $('#frasesConteo').textContent = __frases.lista.length + (__frases.lista.length === 1 ? ' frase recibida' : ' frases recibidas');
      const lista = $('#frasesLista');
      lista.innerHTML = '';
      __frases.lista.forEach((f) => {
        const fila = el('div', 'frase-item');
        fila.appendChild(el('span', 'frase-texto', f.texto));
        const x = el('button', 'btn btn-mini ghost', '✕');
        x.type = 'button';
        x.title = 'Quitar esta frase';
        x.addEventListener('click', async () => {
          try {
            await borrarFrase(app.sala, f.id, app.clave);
            await emitirEstado(app.canal);
            await refrescarFrases(true);
            renderInteractivoFacilitador(true);
          } catch (err) { mostrarToast(mensajeError(err), 'err'); }
        });
        fila.appendChild(x);
        lista.appendChild(fila);
      });
      pintarNube($('#nubeFac'));
    }
  }
}

// ---------------------------------------------------------------------------
// ARRANQUE
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  $('#qrCerrar')?.addEventListener('click', () => { $('#overlayQR').hidden = true; });
  $('#nubeCerrar')?.addEventListener('click', () => { $('#overlayNube').hidden = true; });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    const q = $('#overlayQR'), n = $('#overlayNube');
    if (q && !q.hidden) q.hidden = true;
    if (n && !n.hidden) n.hidden = true;
  });
  $('#btnProyectarQR')?.addEventListener('click', abrirQRGrande);
  $('#btnCopiarInvitacion')?.addEventListener('click', () => {
    const pin = app.pinPart ? '\nPIN de la sala: ' + app.pinPart : '';
    const txt = TALLER.titulo + ' · ' + ((TALLER.fecha && TALLER.fecha.texto) || '') +
      '\nEntra aquí: ' + enlaceCorto() + pin +
      '\nAntes del taller puedes leer los materiales en la pestaña «Materiales».';
    const ok = () => mostrarToast('✓ Invitación copiada: pégala en WhatsApp o en un correo', 'ok', 5000);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, () => window.prompt('Copia la invitación:', txt));
    else window.prompt('Copia la invitación:', txt);
  });
});

/** Se llama al entrar (desde entrar() vía initExtra). */
function initInteractivo() {
  if (app.rol === 'facilitador') {
    const ok = !!SB_LISTO;
    $('#seccionEncuesta').hidden = !ok;
    $('#seccionFrases').hidden = !ok;
    actualizarEnlaceFacilitador();
    if (ok) {
      iniciarPanelEncuesta();
      iniciarPanelFrases();
      renderInteractivoFacilitador(true);
      cargarPinPart();
    }
  } else {
    if (app.estado) renderInteractivoDocente();
    // El aviso de Pintura caduca solo si el docente cierra la sala
    setInterval(() => {
      if (app.pintura && Date.now() - app.pintura.ts >= 12000) {
        app.pintura = null;
        const c = $('#interactivoDocente');
        if (c) c.dataset.firma = '';
        renderInteractivoDocente();
      }
    }, 4000);
  }
}
