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
├── supabase.sql          esquema, políticas RLS y funciones (ejecutar completo)
├── assets/               logo e isotipo Yo Aprendo (SVG)
├── marca/                línea gráfica / brief de marca
├── js/
│   ├── config.js         ← EDITA ESTE. Contenido, materiales y textos.
│   ├── supabase.js       cliente Supabase
│   ├── core.js           estado y utilidades
│   ├── auth.js           puerta y PIN
│   ├── sync.js           sincronización en vivo
│   ├── views.js          vistas docente / facilitador
│   ├── features.js       cronómetro, piso, Scratch, certificados
│   └── app.js            arranque
├── vendor/supabase.js    supabase-js fijado (sin CDN en tiempo de ejecución)
├── css/styles.css
├── material/             8 páginas imprimibles (HTML)
└── pdf/                  los mismos 8, ya en PDF
```

---

## PIN de facilitador

El PIN **no está en el código ni en el repositorio**. Vive en la base de datos como hash bcrypt (tabla `sala_claves`, invisible para la API) y se verifica en el servidor.

Para fijarlo o cambiarlo, en Supabase → **SQL Editor** (mínimo 8 caracteres):

```sql
select public.fijar_clave('taller-1', 'TU-PIN-NUEVO');
```

> Si venías de la versión anterior, el PIN viejo (`YoAprendo26`) estuvo publicado en este repositorio: **cámbialo con la línea de arriba antes de usar el taller**.

El PIN se escribe en un campo oculto y solo se guarda en **sessionStorage** (se borra al cerrar la pestaña). Si cierras el navegador o pulsas **Salir**, la próxima vez te lo pedirá de nuevo.

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
3. En la ventana de facilitador, haz clic en **Abrir esta sección** (la sesión única).
4. Avanza al **siguiente paso** con la flecha ▶.
5. La pantalla de docente debe cambiar de paso en menos de un segundo.
6. En la pantalla de docente, confirma que **no** aparecen los botones de control.

Si ambos puntos funcionan, ya estás listo para el taller.

> **Importante:** el PIN se fija en Supabase con `select public.fijar_clave('taller-1', 'TU-PIN');` (ver «PIN de facilitador»). No hay PIN en `config.js`.

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
    momento: 'Cierre'
  }
}
```

3. Si debe abrirse con un paso concreto, agrégalo a `MATERIALES_POR_BLOQUE` en `js/app.js`:

```js
const MATERIALES_POR_BLOQUE = {
  s1b2: ['tarjetas-de-bloques'],
  s1b5: ['plan-de-clase'],
  s1b6: ['mi-material'],
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

La seguridad no está en el código del navegador (que cualquiera puede ver), sino en una política de la base de datos: solo se puede escribir si la clave que llega en la cabecera coincide con el hash guardado (tabla privada `sala_claves`). Los avisos en vivo (broadcast) no se creen: cada pantalla relee el estado real de la base. Todo esto está en `supabase.sql`.

**La clave que escribas es tu contraseña de facilitador.** No se la pases a nadie.

---

## Si algo no funciona

| Síntoma | Causa probable | Solución |
|---|---|---|
| El PIN no entra | PIN distinto al fijado en la base | Vuelve a fijarlo con `select public.fijar_clave('taller-1', 'NUEVO');` |
| El PIN entra pero no guarda secciones | Se rotó el PIN con la sesión abierta | Pulsa Salir y vuelve a entrar con el PIN nuevo |
| Los docentes no ven los cambios | La app no está conectada a Supabase | Si arriba dice «Sin sincronizar», falta pegar URL y anonKey en `js/supabase.js`. Si dice «En vivo» y aun así no llega, recarga la pestaña del docente |
| «El servidor rechazó el cambio (401)» | La anon key está mal copiada | Vuelve a copiarla en Project Settings → API |
| «Could not find the … function/column» | No se ejecutó la versión nueva de `supabase.sql` | Ejecuta `supabase.sql` completo (es idempotente) |
| Conectados en 0 aunque haya gente dentro | El websocket se suspendió (móviles en segundo plano) | Al volver a la pestaña la app re-lee el estado sola. Si persiste, recarga |
| Veo el panel de facilitador queriendo ver el de docente | La sesión de facilitador sigue activa en esta pestaña | Usa ventana de incógnito para la vista de docente, o dale **Salir** primero |
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