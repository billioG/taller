# Cómo crear un taller nuevo

La plataforma es **una sola** (sala, PIN, cronómetro, encuestas, nube de frases, certificado con QR…).
Lo único que cambia entre talleres es un archivo en esta carpeta.

| Taller | Archivo | Enlace | Sala |
|---|---|---|---|
| Scratch (el primero de la lista) | `scratch.js` | `taller.yoaprendo.online` | `taller-1` |
| Ejemplo | `ejemplo.js` | `taller.yoaprendo.online/?t=ejemplo` | `ejemplo-1` |

## Pasos

1. **Copia** `ejemplo.js` como `talleres/mi-taller.js` (solo letras minúsculas, números y guiones).
2. En ese archivo cambia `id`, `salaPorDefecto` (por ejemplo `mi-taller-1`) y todos los textos.
3. **Registra el taller**: abre `js/taller.js` y añade `'mi-taller'` a la lista `LISTA`.
4. Sube los cambios a GitHub. El taller queda en `taller.yoaprendo.online/?t=mi-taller`.
5. **El PIN:** la primera vez que entres como facilitador a esa sala, escribe un PIN de 8 o más caracteres. Ese será el PIN de ese taller. Cada taller tiene su propio PIN, sus propias encuestas, sus frases y sus certificados.
6. No hay que ejecutar nada nuevo en Supabase: es la misma base de datos para todos los talleres.

## Qué se cambia en el archivo del taller

| Campo | Para qué sirve |
|---|---|
| `titulo`, `tituloCorto`, `subtitulo`, `descripcion`, `entidad` | Textos de la pantalla de entrada y de la pestaña del navegador |
| `fecha` | Cuenta regresiva de la sala de espera |
| `nube.texto` | Palabra que dibuja la nube de frases del cierre |
| `salaPorDefecto` | Sala del taller (distinta en cada taller) |
| `bienvenida` | Mensaje que ven los docentes al entrar |
| `secciones` → `bloques` | Pasos de la sesión: minutos, qué lee el docente, pasos y guion del facilitador |
| `materialesPorBloque` | Qué material se habilita al abrir cada paso |
| `materiales` / `materialesFacilitador` | Lista de materiales (con `libre`, `alFinalizar`, `momento`) |
| `documentos` | Documentos hechos con la plantilla (ver abajo) |
| `encuestaSalida` | Preguntas de salida que se lanzan una por una |
| `certificado` | Firma, texto central y lista de logros del diploma |
| `espera.piezas` | Palabras que flotan detrás de la cuenta regresiva |
| `scratch`, `proyectosBase` | Solo si el taller usa Scratch en vivo (`habilitado: false` lo oculta) |

## Documentos con la plantilla

En lugar de escribir una página HTML, define el documento en `documentos` y enlázalo así:

```js
materiales: {
  'plan-de-clase': {
    titulo: 'Plan de una clase',
    desc: 'Se llena en pantalla.',
    archivo: 'material/ver.html?t=mi-taller&m=plan-de-clase',
    libre: false,
    momento: 'Diseño',
  },
},
documentos: {
  'plan-de-clase': {
    titulo: 'Plan de una clase',
    subtitulo: 'Llénalo en pantalla y guárdalo como PDF.',
    // rellenable: false   ← documento de solo lectura
    bloques: [ /* ver tipos abajo */ ],
  },
},
```

Tipos de bloque:

| `tipo` | Campos | Resultado |
|---|---|---|
| `aviso` | `titulo`, `texto`, `color: 'azul'` | Recuadro destacado |
| `h2` | `texto` | Título de sección (si es pregunta, ponle ¿ ?) |
| `p` | `texto` | Párrafo |
| `lista` | `items`, `numerada` | Lista con viñetas o números |
| `preguntas` | `items: [{ q, nota }]` | Preguntas con una nota debajo |
| `tarjetas` | `items: [{ titulo, texto }]` | 2 o 3 tarjetas en fila |
| `tabla` | `cols`, `filas`, `anchos` | Tabla; una celda `''` se llena en pantalla y `'○'` es un círculo para marcar |
| `campos` | `etiquetas` | Etiqueta + casilla para llenar |
| `rubrica` | `criterios: [{ nombre, revisar }]`, `niveles` | Tabla de criterios con círculos |
| `escribir` | `etiqueta`, `lineas` | Líneas para escribir |

En los textos, `**así**` pone negrita. Todo lo demás se muestra como texto (nunca como HTML).

## Páginas propias

Si necesitas algo más especial (un juego, una actividad interactiva), crea tu página en
`material/<taller>/…` y pon su ruta en `archivo`. Si la página usa la sala, añade `conSala: true`
al material y la app le agrega `?taller=<sala>` al enlace.

## Lo que hay que saber

- **Cada taller guarda sus datos aparte** en el navegador (nombre, rol, pasos vistos). Entrar como
  facilitador en uno no te abre otro.
- Los **materiales de Scratch** (`material/participantes`, `material/facilitador`) son solo del
  taller de Scratch. Un taller nuevo no los muestra: usa los suyos.
- El **primer taller de la lista** es el que se abre sin `?t=`.
