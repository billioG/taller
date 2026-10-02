/* ==========================================================================
   Taller de Scratch · Contenido del curso
   --------------------------------------------------------------------------
   ESTE ES EL ÚNICO ARCHIVO QUE NECESITAS EDITAR PARA PERSONALIZAR EL TALLER.

   Todo lo que ven los docentes vive aquí: las secciones, los textos que se
   muestran en pantalla, los minutos de cada bloque y los materiales que se
   pueden descargar.

   REGLA DE ORO
   ------------
   - `libre: true`  en un material  =  se puede descargar desde el minuto uno.
   - Una sección sin `abierta: true` = el facilitador tiene que desbloquearla.
   - Los bloques marcados con `soloFacilitador: true` NO se muestran a los
     docentes. Ahí van tus notas de guiado, no lo que leen ellos.

   Formato de tiempo:  "0-15"  significa  del minuto 0 al minuto 15.
   ========================================================================== */

const TALLER = {

  // ------------------------------------------------------------------
  // DATOS GENERALES
  // ------------------------------------------------------------------
  titulo: 'Taller de Programación Visual con Scratch',
  subtitulo: 'Una sesión de dos horas para construir un recurso interactivo de su propia asignatura',
  entidad: 'Yo Aprendo',
  version: '1.0',

  // Si cambias esto, cambia también el archivo CNAME
  dominio: 'taller.yoaprendo.online',

  // ------------------------------------------------------------------
  // PIN DE FACILITADOR
  //
  // El PIN ya NO vive en este archivo: se guarda como hash bcrypt en la base
  // de datos (tabla sala_claves) y se verifica en el servidor.
  // Para cambiarlo, en el SQL Editor de Supabase:
  //
  //    select public.fijar_clave('taller-1', 'TU-PIN-NUEVO');   -- mín. 8 caracteres
  // ------------------------------------------------------------------

  // Nube de frases del cierre: las palabras de las frases llenan esta forma.
  nube: { texto: 'NDG.' },

  // Código de la sala. Todos los que entren por el link entran a la misma.
  salaPorDefecto: 'taller-1',

  // Lo que ven los docentes al entrar, antes de empezar
  bienvenida: {
    titulo: 'Hoy sales con algo que tus estudiantes pueden abrir mañana',
    intro: 'En dos horas vas a construir un recurso interactivo con el contenido de TU asignatura. No necesitas saber programar: vas a pensar en secuencia, como una receta de cocina.',
    recordatorio: 'Ten a mano un tema del programa del bimestre. Elige tu línea: formación ciudadana, inglés, matemáticas, emprendimiento o expresión artística.',
  },

  // ------------------------------------------------------------------
  // MATERIALES DESCARGABLES — VERSIÓN PARTICIPANTE (lo que ven los docentes)
  // ------------------------------------------------------------------
  materiales: {
    'guia-participante': {
      titulo: 'Guía del participante',
      desc: 'Qué vas a hacer, qué traer y qué NO haremos.',
      archivo: 'material/participantes/guia-participante.html',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'hoja-de-bloques': {
      titulo: 'Hoja de referencia de bloques',
      desc: 'Todos los bloques del taller en una hoja. Imprímela y tenla al lado.',
      archivo: 'material/participantes/hoja-de-bloques.html',
      libre: true,
      momento: 'Para toda la sesión',
    },
    'tarjetas-de-bloques': {
      titulo: 'Tarjetas de bloques',
      desc: 'Para imprimir grande y recortar. Se usan en la demostración.',
      archivo: 'material/participantes/tarjetas-de-bloques.html',
      libre: false,
      momento: 'Demostración',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase',
      desc: 'El formato que llenas al final para llevar tu proyecto al aula.',
      archivo: 'material/participantes/plan-de-clase.html',
      libre: false,
      momento: 'Cierre',
    },
    'rubrica': {
      titulo: 'Mi rúbrica',
      desc: 'Para revisar tu propio proyecto antes de mostrarlo.',
      archivo: 'material/participantes/rubrica.html',
      libre: false,
      momento: 'Cierre',
    },
    'encuesta-salida': {
      titulo: 'Encuesta de salida',
      desc: 'Cinco preguntas. Se llena en el cierre de la sesión.',
      archivo: 'material/participantes/encuesta-salida.html',
      libre: false,
      momento: 'Cierre',
    },
    'encuesta-30-dias': {
      titulo: 'Seguimiento a 30 días',
      desc: 'Para enviarla tres semanas después.',
      archivo: 'material/participantes/encuesta-30-dias.html',
      libre: true,
      momento: 'Después del taller',
    },
    'certificado': {
      titulo: 'Certificado',
      desc: 'Para imprimir en carta y firmar.',
      archivo: 'material/participantes/certificado.html',
      libre: false,
      momento: 'Cierre',
    },
    'pintura-con-la-cara': {
      titulo: '🎨 Pintura con la cara',
      desc: 'Desafío interactivo: ordena bloques para pintar con el movimiento de la cara (extensión de vídeo / detección facial). Ideal para expresión artística.',
      archivo: 'material/participantes/pintura-con-la-cara.html',
      libre: true,
      momento: 'Línea artística · práctica',
    },
  },

  // ------------------------------------------------------------------
  // CERTIFICADO
  // ------------------------------------------------------------------
  certificado: {
    habilitado: true,
    titulo: 'Certificado de finalización',
    subtitulo: 'Taller de Programación Visual con Scratch',
    duracion: '2 horas · 1 sesión',
    entidad: 'Yo Aprendo',
    // Se genera cuando el facilitador pulsa "Finalizar taller"
    // Usa el nombre que el participante escribió al entrar
  },

  // ------------------------------------------------------------------
  // PISO / PALABRA (request/grant) — tipo Google Meet pero en ambas direcciones
  // ------------------------------------------------------------------
  piso: {
    habilitado: true,
    // Participante solicita → facilitador concede/quita
    // Facilitador invita → participante acepta/rechaza
    timeoutSolicitud: 30000, // ms antes de expirar una solicitud
  },

  // ------------------------------------------------------------------
  // SCRATCH EMBEBIDO (iframe al editor del proyecto del facilitador)
  // ------------------------------------------------------------------
  scratch: {
    habilitado: true,
    // URL base de Scratch para embeber (se usa /embed: el editor no admite iframes)
    // El facilitador pone su project ID durante la sesión
    editorBaseUrl: 'https://scratch.mit.edu/projects/',
    sufijo: '/embed',
  },

  // ------------------------------------------------------------------
  // MATERIALES — VERSIÓN FACILITADOR (con notas de guiado, tiempos, respuestas)
  // ------------------------------------------------------------------
  materialesFacilitador: {
    'sesion-unica': {
      titulo: 'Guía detallada · Sesión única (2 horas)',
      desc: 'Paso a paso minuto a minuto, con el porqué de cada bloque, preguntas probables y sus respuestas.',
      archivo: 'material/facilitador/sesion-unica.html',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'guia-participante': {
      titulo: 'Guía del participante (facilitador)',
      desc: 'Versión con notas de timing, respuestas esperadas y tips.',
      archivo: 'material/facilitador/guia-participante.html',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'hoja-de-bloques': {
      titulo: 'Hoja de referencia (facilitador)',
      desc: 'Versión con notas de qué enfatizar y errores comunes.',
      archivo: 'material/facilitador/hoja-de-bloques.html',
      libre: true,
      momento: 'Para toda la sesión',
    },
    'tarjetas-de-bloques': {
      titulo: 'Tarjetas de bloques (facilitador)',
      desc: 'Incluye guía de cómo conducir la actividad con las tarjetas.',
      archivo: 'material/facilitador/tarjetas-de-bloques.html',
      libre: false,
      momento: 'Demostración',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase (facilitador)',
      desc: 'Con ejemplos completos, rúbrica de corrección y plan B tipo.',
      archivo: 'material/facilitador/plan-de-clase.html',
      libre: false,
      momento: 'Cierre',
    },
    'rubrica': {
      titulo: 'Rúbrica (facilitador)',
      desc: 'Con criterios de calificación detallados y ejemplos de cada nivel.',
      archivo: 'material/facilitador/rubrica.html',
      libre: false,
      momento: 'Cierre',
    },
    'encuesta-salida': {
      titulo: 'Encuesta de salida (facilitador)',
      desc: 'Con guía de interpretación de respuestas para un eventual nivel 2.',
      archivo: 'material/facilitador/encuesta-salida.html',
      libre: false,
      momento: 'Cierre',
    },
    'encuesta-30-dias': {
      titulo: 'Seguimiento a 30 días (facilitador)',
      desc: 'Con plantilla de análisis de resultados y decisiones.',
      archivo: 'material/facilitador/encuesta-30-dias.html',
      libre: false,
      momento: 'Después del taller',
    },
    'certificado': {
      titulo: 'Certificado (facilitador)',
      desc: 'Igual que el del participante, para que lo revises antes.',
      archivo: 'material/facilitador/certificado.html',
      libre: false,
      momento: 'Cierre',
    },
    'pintura-con-la-cara': {
      titulo: '🎨 Pintura con la cara',
      desc: 'Desafío interactivo de bloques con detección facial. Úsalo como ejemplo avanzado de expresión artística o estación para quien termine antes.',
      archivo: 'material/participantes/pintura-con-la-cara.html?modo=docente',
      libre: true,
      momento: 'Línea artística · práctica',
    },
  },

  // Proyectos base de Scratch. Pega aquí los links de tus proyectos reales.
  proyectosBase: [
    {
      titulo: 'Proyecto base vacío',
      desc: 'Un proyecto limpio para empezar desde cero.',
      url: 'https://scratch.mit.edu/projects/1043346752/',
      sesion: 1,
    },
  ],

  // ------------------------------------------------------------------
  // LA SESIÓN ÚNICA — 120 MINUTOS
  // ------------------------------------------------------------------
  secciones: [

    // ==================================================================
    // SESIÓN ÚNICA (2 HORAS) — didáctica + momentos wow
    // ==================================================================
    {
      id: 's1',
      numero: 1,
      titulo: 'Construye tu recurso interactivo',
      concepto: 'Secuencia, condición e interacción — en lenguaje de aula, no de código',
      duracion: 120,
      producto: 'Un recurso publicado sobre tu asignatura + el esquema de una clase de 45 minutos listo para el aula.',
      bloques: [
        {
          id: 's1b1',
          titulo: 'Apertura: el error que enseña',
          minutos: '0-10',
          momentoWow: 'El facilitador hace clic en la bandera verde… y no pasa nada. En 30 segundos entiendes por qué un programa es una lista de instrucciones.',
          paraDocentes:
            'Regla de oro de hoy: aquí todos se equivocan, incluido quien facilita. Tu único objetivo es salir con algo que funcione. No hay examen ni comparación entre proyectos.',
          pasos: [
            'Escribe tu nombre y entra a la sala (solo lo ve el facilitador).',
            'Elige tu línea: ciudadana, inglés, matemáticas, emprendimiento o artística.',
            'Observa el “error a propósito”: bandera verde sin bloques. ¿Qué falta?',
          ],
          guioFacilitador:
            'MOMENTO WOW 1 — El silencio de la bandera: abre Scratch, personaje visible, CERO bloques, clic en bandera verde. Pregunta: «¿Por qué no pasó nada?». Deja que respondan. Cierra con: «La computadora solo hace lo que le escribimos, en orden, como una receta». Luego las 4 reglas en voz alta. Diagnóstico rápido (manos al aire, sin tabular): ¿ha creado material digital alguna vez? Del 1 al 5, comodidad con la PC. ¿Cree que sus estudiantes harían algo así?',
          soloFacilitador: false,
        },
        {
          id: 's1b2',
          titulo: 'Demostración: de cero a “me respondió”',
          minutos: '10-25',
          momentoWow: 'En vivo, el recurso saluda, pregunta y reacciona a lo que escribes. Dejas de ver “programación” y empiezas a ver una actividad de clase.',
          paraDocentes:
            'Vas a ver el recorrido completo en voz alta: saludo → pregunta → respuesta. Fíjate en el ORDEN de los bloques. Después te toca a ti con el mismo patrón.',
          pasos: [
            'Observa la demo: un personaje que pregunta y responde según lo que escribes.',
            'Con las tarjetas (si las tienes), ordena: ¿qué va primero, qué va después?',
            'Pregunta clave: ¿qué pasaría si el saludo viniera después de la respuesta?',
          ],
          guioFacilitador:
            'MOMENTO WOW 2 — Narrar cada bloque: “Ahora le digo que espere una respuesta… ahora comparo…”. Al repartir tarjetas NO corrijas el orden: pregunta qué pasaría si está mal. Que el error salga solo. Cierra con la analogía: secuencia = receta; si pones el horno al final, el pastel no se cocina. Deja el proyecto demo abierto 10 segundos en silencio para que “sientan” que funciona.',
          soloFacilitador: false,
        },
        {
          id: 's1b3',
          titulo: 'Lo hacemos juntos: tu primer “sí / inténtalo de nuevo”',
          minutos: '25-60',
          momentoWow: 'Por primera vez TU proyecto responde: si aciertas, estrella; si no, te invita a intentar otra vez. Es la misma lógica que una actividad bien diseñada en el aula.',
          paraDocentes:
            'Todos al mismo tiempo, paso a paso. No adelantes: el poder está en armar la secuencia con calma. Al final pruebas con la bandera verde — ese clic es tuyo.',
          pasos: [
            'Proyecto nuevo + personaje (el que quieras).',
            'Secuencia: saludo → preguntar → esperar respuesta.',
            'Condición: si la respuesta es correcta → estrella; si no → “inténtalo de nuevo”.',
            'Bandera verde. Si funciona, respira: ya tienes interacción.',
          ],
          guioFacilitador:
            'MOMENTO WOW 3 — El primer “¡respondió!”. Ve mesa por mesa cuando oigas la primera risa o sorpresa. Celebra en voz alta sin señalar a nadie en particular: “Escuchen eso: eso es interacción”. No respondas dudas solo por chat: dilas en voz alta. Si alguien lleva >2 min trabado: “cierre Scratch y ábralo de nuevo”. Anuncia tiempo a los 15 y 25 min de este bloque. Vocabulario de aula: secuencia, condición, interacción.',
          soloFacilitador: false,
        },
        {
          id: 's1b4',
          titulo: 'Tu asignatura cobra vida',
          minutos: '60-100',
          momentoWow: 'El contenido del programa de estudios deja el PDF y se vuelve algo que el estudiante toca, responde y recibe retroalimentación.',
          paraDocentes:
            'Ahora el contenido es TUYO. Elige ruta básica, media o avanzada — no hay que justificarlo. La básica “funciona mañana en clase”; la avanzada suma caminos o puntaje. Lo importante: que hable de tu materia.',
          pasos: [
            'CIUDADANA: derechos y deberes, o “¿Qué harías tú?” con dos desenlaces.',
            'INGLÉS: diálogo o vocabulario; el personaje corrige y modela la respuesta.',
            'MATEMÁTICAS: adivina el número (más alto / más bajo) o quiz con puntaje.',
            'EMPRENDIMIENTO: “Mi negocio” — precio, ganancia o pérdida a la vista.',
            'ARTÍSTICA: cuento o pieza que el estudiante dirige, o prueba «Pintura con la cara» (en Materiales).',
          ],
          guioFacilitador:
            'MOMENTO WOW 4 — El tema del programa en pantalla. Anuncia las tres rutas SIN jerarquía. Básica = “lista para el aula”, nunca “la fácil”. Quien termine antes → tutor de mesa 10 min. Minuto 85: si más de la mitad sigue en básica, repite en voz alta el patrón si/entonces con un ejemplo de ciudadana o mates. Pide a 2 voluntarios (si hay confianza) que muestren 20 segundos: no para evaluar, para contagiar.',
          soloFacilitador: false,
        },
        {
          id: 's1b5',
          titulo: 'El enlace que funciona en el celular',
          minutos: '100-112',
          momentoWow: 'Compartes el enlace, lo abres en el teléfono y se ve igual. Mañana un estudiante puede entrar sin instalar nada.',
          paraDocentes:
            'Publica, copia el enlace y pruébalo en otra pestaña o en el celular. Si abre, ya es material de clase. Luego escribe el aprendizaje esperado y qué debe hacer el estudiante para demostrarlo.',
          pasos: [
            'Comparte el proyecto en Scratch y copia el enlace.',
            'Ábrelo tú mismo (otra pestaña o celular). Si carga, listo.',
            'Escribe el aprendizaje esperado tal como está en tu programa.',
            'Define 2 o 3 criterios de éxito — no más.',
          ],
          guioFacilitador:
            'MOMENTO WOW 5 — El celular. Pide que alguien abra el enlace en el teléfono y lo levante. Ese gesto vale más que cualquier diapositiva sobre “recursos digitales”. Ayuda a quienes no encuentran “Compartir”. Plan de clase: máximo 3 criterios. Si el tiempo aprieta, el enlace publicado es el mínimo no negociable.',
          soloFacilitador: false,
        },
        {
          id: 's1b6',
          titulo: 'Compromiso: día, grupo y hora',
          minutos: '112-120',
          momentoWow: 'No es “algún día”: es el martes con 2° B. El recurso ya existe; solo falta abrirlo con estudiantes de carne y hueso.',
          paraDocentes:
            'Cierra el círculo: una fecha concreta de implementación (día, grupo, hora). Responde la encuesta de salida. Si el facilitador genera certificados, recoge el tuyo con tu nombre.',
          pasos: [
            'Escribe: implementaré [tema] el [fecha] con [grupo] a las [hora].',
            'Completa la encuesta de salida (5 preguntas).',
            'Recoge tu certificado cuando se habilite.',
          ],
          guioFacilitador:
            'MOMENTO WOW 6 — La fecha en voz alta. Ronda rápida: cada quien dice una frase: “Voy a implementar [tema] el [fecha] con [grupo]”. Cierre: “El enlace ya está en sus manos. La fecha ya está en su calendario. Lo único que falta es abrir Scratch el día que dijeron.” Anuncia el seguimiento a 30 días. Pulsa Finalizar taller para certificados. Celebrar sin discurso largo.',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Un recurso que pregunta y da retroalimentación inmediata — listo para una clase mañana.',
        media: 'Suma puntaje, intentos o dos caminos según la respuesta.',
        avanzada: 'Decisiones que cambian el desenlace o varios niveles con el mismo contenido curricular.',
      },
    },
  ],

  // ------------------------------------------------------------------
  // NOTAS PRIVADAS DEL FACILITADOR
  // ------------------------------------------------------------------
  // Solo el facilitador las ve. Los docentes nunca.
  notasFacilitador: {
    reglasDelTaller: [
      'Aquí todos se equivocan. Todos. Incluido yo.',
      'Nadie mira el proyecto de nadie. Solo el suyo.',
      'Siempre hay una forma fácil y una forma difícil. Usted elige.',
      'Terminar la sesión con algo funcionando es el único objetivo.',
    ],
    frasesUtiles: [
      'Alguien se traba: "Cuénteme qué está viendo." No le des la solución.',
      'Alguien termina muy rápido: "Ahora ayúdeme a alguien de su mesa diez minutos."',
      'Alguien se disculpa: "Gracias por decirlo. Le va a pasar a todo el grupo."',
      'Se acaba el tiempo: "Guarden ahora lo que tengan. Guardado es mejor que perdido."',
      'Vuelve una pregunta ya contestada: repite la respuesta, no regañes.',
    ],
    respuestasRapidas: [
      {
        objecion: 'Los chicos ya lo saben mejor',
        respuesta:
          'Tiene razón en una parte: ellos mueven los bloques más rápido. Pero dígame algo: ¿cuántos de mis estudiantes saben por qué la Constitución de 1917 cambió la historia de este país? Usted sí. Y nadie más en esta sala lo sabe.',
      },
      {
        objecion: 'No tengo tiempo',
        respuesta:
          'Por eso vamos a salir hoy con el proyecto terminado. No hay tarea. Si algo queda pendiente, queda pendiente.',
      },
      {
        objecion: 'Esto es cosa de niños',
        respuesta:
          'Vamos a trabajar con SU contenido. Es su programa de estudio, no un juego de niños. La herramienta es la misma que usan ellos, pero el contenido es suyo.',
      },
      {
        objecion: 'Me voy a ver mal frente a mis compañeros',
        respuesta:
          'Nadie va a ver su proyecto. Cero veces. Le prometo algo más: yo ya me equivoqué primero, a propósito.',
      },
      {
        objecion: 'Soy cero con la computadora',
        respuesta:
          'Si puede usar el celular, puede usar esto. Solo le pido una cosa: que no se quede en silencio cuando se quede atorado.',
      },
    ],
  },
};