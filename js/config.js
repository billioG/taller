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
  entidad: 'YoAprendo',
  version: '1.0',

  // Si cambias esto, cambia también el archivo CNAME
  dominio: 'taller.yoaprendo.online',

  // ------------------------------------------------------------------
  // PIN DE FACILITADOR
  //
  // Es el código que pides en la puerta para entrar al panel de control.
  // Aquí solo se guarda su hash SHA-256, nunca el PIN en texto plano.
  //
  // CÓMO CAMBIAR EL PIN:
  // 1. Elige el PIN nuevo.
  // 2. En la consola del navegador (F12) pega esto y copia el resultado:
  //
  //    await crypto.subtle.digest('SHA-256',
  //      new TextEncoder().encode('taller-scratch:MIPIN'))
  //      .then(b => [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))
  //
  // 3. Pega el resultado abajo y sube el cambio a GitHub.
  //
  // CÁMBIALO antes de publicar. El de abajo corresponde a: 1234
  // ------------------------------------------------------------------
  pinHash: 'a511b1ae4d932199d30b9a3d792e0e3afb2d5dbd9c9ef94b76d4efecb3c97fe9',

  // Código de la sala. Todos los que entren por el link entran a la misma.
  salaPorDefecto: 'taller-1',

  // Lo que ven los docentes al entrar, antes de empezar
  bienvenida: {
    titulo: 'Bienvenido al taller',
    intro: 'En dos horas vas a crear un recurso interactivo sobre un contenido de tu propia asignatura. No necesitas saber programar.',
    recordatorio: 'Trae un contenido del programa de estudio del bimestre en curso. Elige tu línea: formación ciudadana, inglés, matemáticas, emprendimiento o expresión artística.',
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
  },

  // ------------------------------------------------------------------
  // CERTIFICADO
  // ------------------------------------------------------------------
  certificado: {
    habilitado: true,
    titulo: 'Certificado de finalización',
    subtitulo: 'Taller de Programación Visual con Scratch',
    duracion: '2 horas · 1 sesión',
    entidad: 'YoAprendo',
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
    // URL base del editor de Scratch para embeber
    // El facilitador pone su project ID durante la sesión
    editorBaseUrl: 'https://scratch.mit.edu/projects/',
    // Parámetros del iframe
    iframeParams: '?fullscreen=false&showInstructions=false',
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
    // SESIÓN ÚNICA (2 HORAS)
    // ==================================================================
    {
      id: 's1',
      numero: 1,
      titulo: 'Construye tu recurso interactivo',
      concepto: 'Secuencia, condición e interacción — en lenguaje de aula',
      duracion: 120,
      producto: 'Un recurso interactivo publicado sobre tu asignatura, más el esquema de una clase de 45 minutos.',
      bloques: [
        {
          id: 's1b1',
          titulo: 'Apertura y acuerdo de trabajo',
          minutos: '0-10',
          paraDocentes:
            'Siéntete cómodo. Aquí todos se equivocan, incluido el facilitador. Tu único objetivo hoy es salir con algo funcionando.',
          pasos: [
            'Escribe tu nombre y entra a la sala.',
            'Elige tu línea: formación ciudadana, inglés, matemáticas, emprendimiento o expresión artística.',
          ],
          guioFacilitador:
            'Lee las 4 reglas en voz alta. Antes de explicar nada, haz el error deliberado: clic en la bandera verde sin bloques. Diagnóstico en 2 minutos, sin tabular: ¿ha usado alguna vez una herramienta digital para crear un material? Del 1 al 5, ¿qué tan cómodo se siente con la computadora? ¿Cree que sus estudiantes crearían algo así?',
          soloFacilitador: false,
        },
        {
          id: 's1b2',
          titulo: 'Demostración en vivo',
          minutos: '10-25',
          paraDocentes:
            'Mira cómo se construye, en vivo y hablando en voz alta. Después te toca a ti.',
          pasos: [
            'Observa la demostración completa: un recurso que saluda, pregunta y responde.',
            'Ordena las tarjetas de bloques, si las tienes.',
          ],
          guioFacilitador:
            'Tres minutos narrando cada bloque en voz alta. Al repartir las tarjetas NO corrijas: pregunta "¿qué pasaría si el saludo viniera después de la respuesta?". Que el error salga solo. Idea clave que debe quedar: un programa es una lista de instrucciones en orden, como una receta.',
          soloFacilitador: false,
        },
        {
          id: 's1b3',
          titulo: 'Construcción guiada: lo hacemos juntos',
          minutos: '25-60',
          paraDocentes:
            'Sigue los mismos pasos que yo. Todos hacemos lo mismo al mismo tiempo.',
          pasos: [
            'Crea un proyecto nuevo y elige tu personaje.',
            'Saludo, pregunta y respuesta: secuencia e interacción.',
            'Añade "si... entonces": si responde bien, estrella; si no, inténtalo otra vez: condición.',
            'Prueba con la bandera verde.',
          ],
          guioFacilitador:
            'No respondas por chat: responde en voz alta para que todos escuchen. Si alguien lleva más de 2 minutos trabado: "cierre Scratch y lo vuelva a abrir". Anuncia el tiempo cada 10 minutos. Conceptos en lenguaje de aula: secuencia = se leen de arriba abajo, como una receta; condición = si pasa esto, entonces aquello; interacción = el estudiante escribe y el recurso reacciona.',
          soloFacilitador: false,
        },
        {
          id: 's1b4',
          titulo: 'Tu proyecto: elige tu línea',
          minutos: '60-100',
          paraDocentes:
            'Elige tu línea y construye tu propio recurso. Tres rutas: básica, media y avanzada. Nadie tiene que justificar la elección.',
          pasos: [
            'FORMACIÓN CIUDADANA: cuestionario de derechos y deberes, o escenario "¿Qué harías tú?" con dos desenlaces.',
            'INGLÉS: diálogo o vocabulario interactivo donde el personaje corrige y da la respuesta correcta.',
            'MATEMÁTICAS: adivina el número con pistas de "más alto / más bajo", o quiz de tres preguntas con puntaje.',
            'EMPRENDIMIENTO: simulador "Mi negocio": fija el precio y ve ganancia o pérdida con contador visible.',
            'EXPRESIÓN ARTÍSTICA: cuento animado o pieza musical que el estudiante dirige: escenas, colores y sonido.',
          ],
          guioFacilitador:
            'Anuncia las tres rutas sin jerarquía. La BÁSICA se presenta como la que "funciona tal cual en clase", nunca como la de los que no pueden. Quien termine antes, tutor de su mesa 10 minutos. Si al minuto 85 más de la mitad sigue en básica, repite el paso clave para todos con calma.',
          soloFacilitador: false,
        },
        {
          id: 's1b5',
          titulo: 'Publicar y diseñar el reto',
          minutos: '100-112',
          paraDocentes:
            'Comparte tu proyecto con un enlace y escribe la pregunta o reto que tu estudiante deberá resolver dentro del recurso.',
          pasos: [
            'Comparte tu proyecto, copia el enlace y pruébalo: si abre, funciona.',
            'Escribe el aprendizaje esperado tal como está en tu programa.',
            '¿Qué tiene que hacer el estudiante para demostrar que lo sabe?',
            'Dos o tres criterios de éxito. No más.',
          ],
          guioFacilitador:
            'Un proyecto sin publicar no se implementa: si alguien no puede publicar, que exporte el archivo y lo comparta por otro medio. Guía con preguntas, no con instrucciones. La última es la más importante: "¿qué pasa si un estudiante solo ve sin hacer nada?". Regla anti-pasividad: toda actividad exige una acción del estudiante.',
          soloFacilitador: false,
        },
        {
          id: 's1b6',
          titulo: 'Compromiso y cierre',
          minutos: '112-120',
          paraDocentes:
            'Escribe la fecha concreta en que vas a aplicarla: día, grupo y hora. No "próximamente".',
          pasos: [
            'Escribe tu fecha de implementación.',
            'Responde la encuesta de salida.',
            'Recoge tu certificado.',
          ],
          guioFacilitador:
            'Ronda final: cada uno dice "Voy a implementar [tema] el [fecha] con [grupo]". Frase de cierre: "El enlace ya está en sus manos. La fecha ya está en su calendario. Lo único que falta es abrir Scratch el martes." Anuncia el seguimiento a 30 días AHORA y pulsa "Finalizar taller" para generar los certificados con el nombre de cada participante.',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Un recurso que pregunta y da retroalimentación inmediata.',
        media: 'Añade puntaje, intentos o dos caminos según la respuesta.',
        avanzada: 'Añade decisiones que cambian el desenlace o varios niveles.',
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