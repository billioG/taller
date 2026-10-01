# Taller de Scratch · App para docentes

Webapp que acompaña el taller de programación visual con Scratch. Los docentes entran con un link, ven la sesión en vivo y descargan el material. Tú, desde el panel de facilitador, abres cada sección cuando la clase está lista.

---

## Qué hace

| Vista | Para quién | Qué ve |
|---|---|---|
| **Docente** | Participantes | Escribe su nombre y entra directo. **Modo presentación**: una sola pantalla con el paso actual, que avanza solo cuando tú avanzas. Pestaña «Materiales» para descargas. Sin scroll infinito. |
| **Facilitador** | Tú, con PIN | Vista previa de lo que ven los docentes, mensaje general, cronómetro, botones para abrir secciones y avanzar paso a paso, lista de conectados. Notas privadas colapsadas. |

**Los docentes no pueden ser facilitadores.** No hay botón de rol: entran, escriben su nombre y ya están dentro del taller. El panel de control está detrás de un PIN que solo tú conoces.

La sincronización usa **Broadcast de Supabase**: cuando avanzas, el cambio llega en menos de un segundo. La base de datos queda como respaldo para quien entra tarde. **No hay que activar Replication ni nada en el dashboard**: con crear la tabla basta.

> Si quieres ver la pantalla del docente en tu misma computadora, ábrela en una ventana de incógnito. Si la abres normal, el navegador recuerda tu PIN y te mete directo al panel de facilitador.

---

## Estructura

```
taller/
├── index.html            la app
├── CNAME                 taller.yoaprendo.online
├── supabase.sql          el esquema de la base de datos
├── js/
│   ├── config.js         ← EDITA ESTE. Contenido, materiales, textos y PIN.
│   ├── supabase.js       sincronización
│   └── app.js            lógica
├── css/styles.css
├── material/             8 páginas imprimibles (HTML)
└── pdf/                  los mismos 8, ya en PDF
```

---

## Cambiar el PIN de facilitador

El PIN por defecto es **1234**. Cámbialo antes de publicar.

1. Elige el PIN nuevo.
2. Abre la app en el navegador, presiona F12 y pega esto en la consola:

```js
await crypto.subtle.digest('SHA-256', new TextEncoder().encode('taller-scratch:MIPIN'))
  .then(b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''))
```

3. Copia el resultado.
4. Pégalo en `js/config.js`, en el campo `pinHash`:

```js
pinHash: 'el-resultado-copiado-aquí',
```

5. Sube el cambio a GitHub.

En la app solo se guarda el hash, nunca el PIN. Si alguien lee el código fuente ve una cadena de letras y números, no tu clave.

> El PIN queda guardado en el navegador de tu computadora, así que no lo escribes cada sesión. Si quieres cerrarte la sesión y borrarlo, usa el botón **Salir** de arriba a la derecha.

---

## Despliegue en GitHub Pages

### 1. Sube el código

```bash
cd "C:/Users/billi/OneDrive/Documentos/Proyecto predeterminado"
git init
git add .
git commit -m "Taller de Scratch"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

> Si quieres el taller en `taller.yoaprendo.online` y el simulador STEAM en la raíz
> del dominio, este repositorio es el correcto. Si prefieres repos separados,
> mueve la carpeta `taller/` a su propio repositorio.

### 2. Activa GitHub Pages

En el repositorio: **Settings → Pages → Source → Deploy from a branch → main / (root) → Save**.

Espera un minuto. La app queda en `https://TU-USUARIO.github.io/TU-REPO/taller/`.

### 3. Conecta el dominio

El archivo `taller/CNAME` ya contiene `taller.yoaprendo.online`. GitHub Pages lo lee automáticamente.

En el proveedor DNS de `yoaprendo.online` agrega:

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | taller | `TU-USUARIO.github.io` |

Reemplaza `TU-USUARIO` por tu usuario de GitHub.

> **Si usas Cloudflare**, apaga el modo nube (nube gris) para el registro `CNAME`.
> Con la nube activada, GitHub no puede emitir el certificado HTTPS.

Espera entre 5 minutos y 24 horas. Cuando https://taller.yoaprendo.online cargue, listo.

> **Antes de probar con docentes reales**, abre el link en tu celular con datos
> móviles, no con wifi. Así confirmas que el certificado HTTPS está bien.

---

## Configurar Supabase (para la sincronización en vivo)

Sin esto, la app funciona igual: todas las secciones y descargas están disponibles, pero los docentes no ven los cambios en vivo. Son 15 minutos, una sola vez.

### 1. Crea el proyecto

1. Entra en [supabase.com](https://supabase.com) y crea una cuenta.
2. **New project**. Ponle nombre `taller-scratch`. Guarda la contraseña de la base de datos (no la vas a necesitar, pero supabase la pide).
3. Espera un minuto a que se cree.

### 2. Crea la tabla

1. En el menú lateral, **SQL Editor → New query**.
2. Pega todo el contenido de `supabase.sql`.
3. Dale **Run**.

Debe salir `Success. No rows returned`. Ya está.

### 3. Copia las dos llaves

**Project Settings → API**:

| Dónde lo encuentras | Qué copias |
|---|---|
| **Project URL** | `https://xxxx.supabase.co` |
| **anon public** | una cadena larga que empieza con `eyJ...` |

> Copia la que dice **anon public**. **Jamás** la `service_role`: esa le da
> control total de la base de datos y no debe salir nunca de tu servidor.

### 4. Pégalas en la app

Abre `js/supabase.js` y reemplaza:

```js
const CFG = {
  url: 'https://pjnvhdxytjxbaiwvlylj.supabase.co',        // ← tu Project URL
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbnZoZHh5dGp4YmFpd3ZseWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDI4OTMsImV4cCI6MjEwNjM3ODg5M30.lotSgYcgFJH2OqbkXje7NyaLpZh3ura2kDkDxHYMjns',    // ← tu anon public
};
```

### 5. Sube el cambio

```bash
git add taller/js/supabase.js
git commit -m "Conectar Supabase"
git push
```

Espera un minuto a que GitHub Pages despliegue.

### 6. Prueba antes de usarlo en serio

1. Abre la app en una ventana normal y entra como facilitador con tu PIN.
2. Abre la app en **otra ventana o en un celular** con el mismo link. Entra como docente (solo nombre).
3. En la ventana de facilitador, haz clic en **Abrir esta sección** en la sesión 2.
4. La pantalla de docente debe saltar a la sesión 2 en menos de un segundo.
5. En la pantalla de docente, confirma que **no** aparecen los botones de control.

Si ambos puntos funcionan, ya estás listo para el taller.

> **Importante:** el PIN que usas en la app tiene que ser el mismo que guardaste en
> la fila de Supabase. Si no coinciden, la base de datos rechaza la escritura
> aunque el PIN sea correcto en el navegador. Si te pasa, abre la tabla
> `estado_sala` en Supabase y revisa la columna `clave`.

---

## Cómo se usa el día del taller

### Antes

- [ ] Comparte el link por el chat de la videollamada o por WhatsApp: `https://taller.yoaprendo.online`
- [ ] Verifica que la pestaña del proyecto base de Scratch esté abierta y con la cuenta iniciada
- [ ] Cambia el enlace de los proyectos base por los tuyos, en `config.js`
- [ ] Repasa las cuatro reglas de las notas privadas

### Durante

1. Entras con tu PIN. La lista de conectados se llena sola.
2. Entras como docente en un dispositivo aparte (tu celular) para verificar que todo llega.
3. Cada vez que cambies de sesión, haces clic en **Abrir esta sección**. Todos saltan al instante.
4. Dentro de una sesión, usa **◀ Anterior** y **Siguiente ▶** para avanzar paso a paso.
5. Si necesitas avisar algo sin cambiar de sección, usa el **mensaje general**. Sale en amarillo arriba, en todas las pantallas.
6. El cronómetro está abajo, en tu panel.

### El link que compartes

Uno solo para todos:

```
https://taller.yoaprendo.online
```

Los docentes escriben su nombre y entran. Tú usas **el mismo link** y le pones el PIN en «Acceso de facilitador». No hay links distintos, no hay que explicar nada.

Si quieres dos grupos separados que no se interfieran, usa una sala distinta en la URL: `https://taller.yoaprendo.online?sala=grupo-b`. Cambia también `salaPorDefecto` en `config.js` para que ese sea el link que compartas.

### Después de cada sesión

- [ ] Anota quién se quedó con tarea pendiente
- [ ] Guarda el enlace del proyectobase de la siguiente sesión en `config.js`

---

## Personalizar el contenido

Todo está en **`js/config.js`**. No hay que tocar nada más.

### Cambiar los textos que ven los docentes

Cada sesión tiene bloques. Para cambiar lo que aparece en pantalla cuando abres el paso 3:

```js
{
  id: 's1b3',
  titulo: 'Práctica guiada: lo hacemos juntos',
  minutos: '35-75',
  paraDocentes: 'Sigue los mismos pasos que yo.',  // ← esto ven ellos
  pasos: ['Crea un proyecto nuevo', 'Agrega los bloques'],
  guioFacilitador: 'No respondas por el chat...',  // ← esto solo lo ves tú
  soloFacilitador: false
}
```

`paraDocentes` es lo que aparece en la pantalla del docente. `guioFacilitador` nunca se envía a los docentes: vive solo en tu navegador.

### Agregar un material

1. Copia la página en `material/`, por ejemplo `material/mi-material.html`.
2. Agrégalo en `config.js`:

```js
materiales: {
  'mi-material': {
    titulo: 'Mi material',
    desc: 'Para qué sirve',
    archivo: 'material/mi-material.html',
    libre: false,
    momento: 'Sesión 2'
  }
}
```

3. Si debe abrirse con una sesión, agrégalo a `MATERIALES_POR_SECCION` en `js/app.js`:

```js
const MATERIALES_POR_SECCION = {
  s1: ['tarjetas-de-bloques'],
  s2: ['mi-material'],
  // ...
};
```

### Marcar un material como siempre disponible

Ponle `libre: true`. Los docentes lo pueden bajar desde el minuto uno, sin que tú lo abras.

### Cambiar los proyectos base de Scratch

En `config.js`:

```js
proyectosBase: [
  { titulo: 'Mi proyecto base', desc: 'Para empezar', url: 'https://scratch.mit.edu/projects/...', sesion: 1 }
]
```

---

## Los PDFs

En `pdf/` están los 8 materiales ya convertidos, listos para descargar.

Cada material existe en dos formatos:

- **HTML** (`material/`): se abre en el navegador, tiene un botón «Guardar como PDF». Sirve para imprimir o para ver en pantalla.
- **PDF** (`pdf/`): descarga directa. Se abre o se imprime sin más.

Para regenerar los PDFs después de editar el HTML, en PowerShell:

```powershell
cd "C:\ruta\al\taller"
$docs = @("guia-participante","hoja-de-bloques","plan-de-clase","rubrica","encuesta-salida","encuesta-30-dias","certificado","tarjetas-de-bloques")
foreach ($d in $docs) {
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --no-pdf-header-footer `
    "--print-to-pdf=$PWD\pdf\$d.pdf" "file:///$PWD/material/$d.html"
}
```

---

## Seguridad: qué puede y qué no puede hacer cada quien

| Acción | Docente | Facilitador |
|---|---|---|
| Ver secciones ya abiertas | Sí | Sí |
| Descargar materiales libres | Sí | Sí |
| Descargar materiales de su sesión | Sí | Sí |
| **Abrir una sección** | **No** | **Sí** |
| **Enviar mensaje general** | **No** | **Sí** |
| Ver la lista de conectados | No | Sí |

La seguridad no está en el código del navegador (que cualquiera puede ver), sino en una política de la base de datos: solo se puede escribir si la clave que llega en la cabecera coincide con la de la fila. Eso está en `supabase.sql`.

**La clave que escribas es tu contraseña de facilitador.** No se la pases a nadie.

---

## Si algo no funciona

| Síntoma | Causa probable | Solución |
|---|---|---|
| El PIN no entra | Hash desactualizado en config.js | Recalcula el hash con la consola y pégalo en `pinHash` |
| El PIN entra pero no guarda secciones | El PIN de la app no es el mismo de la fila en Supabase | Abre `estado_sala` en Supabase y revisa la columna `clave` |
| Los docentes no ven los cambios | La app no está conectada a Supabase | Si arriba dice «Sin sincronizar», falta pegar URL y anonKey en `js/supabase.js`. Si dice «En vivo» y aun así no llega, recarga la pestaña del docente |
| El mensaje «Rechazado: 401» | La anon key está mal copiada | Vuelve a copiarla en Project Settings → API |
| El mensaje «Could not find the ... column» | La tabla se creó con otro esquema | Borra la tabla en Supabase y vuelve a correr `supabase.sql` completo |
| Conectados en 0 aunque haya gente dentro | El websocket se suspendió (móviles en segundo plano) | Al volver a la pestaña la app re-lee el estado sola. Si persiste, recarga |
| Veo el panel de facilitador queriendo ver el de docente | El navegador recuerda tu PIN | Usa ventana de incógnito para la vista de docente, o dale **Salir** primero |
| El dominio no carga | Certificado HTTPS pendiente | Espera. Puede tardar hasta 24 horas. Verifica que el CNAME esté en el registro. |
| La página se ve sin estilos | Archivo CSS no subido | Revisa que `css/styles.css` esté en el repositorio |
| El link del proyecto base da 404 | El ID cambió en Scratch | Reemplaza la URL en `config.js` |

---

## Personalización rápida: cambiar textos de las objeciones

Son las que más se ajustan al grupo. Están en `config.js`, dentro de `notasFacilitador.respuestasRapidas`:

```js
{
  objecion: 'Los chicos ya lo saben mejor',
  respuesta: 'Tiene razón en una parte: ellos mueven los bloques más rápido...'
}
```

Cámbialas con el tono real de tu grupo. Funcionan mejor si están adaptadas.

---

*Taller de Programación Visual con Scratch · YoAprendo · taller.yoaprendo.online*