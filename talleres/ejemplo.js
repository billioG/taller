/* ==========================================================================
   TALLER DE EJEMPLO · plantilla para crear talleres nuevos
   --------------------------------------------------------------------------
   Copia este archivo como talleres/<tu-id>.js, cambia los textos, añade el id
   en js/taller.js y abre  https://taller.yoaprendo.online/?t=<tu-id>
   Guía completa: talleres/LEEME.md

   Qué cambia de un taller a otro (todo está en este archivo):
     · datos generales, fecha y sala
     · pasos de la sesión (secciones → bloques) con sus minutos
     · materiales (documentos hechos con la plantilla, o tus propias páginas)
     · encuesta de salida y texto del certificado
   ========================================================================== */

const TALLER = {

  // ---------------- Datos generales ----------------
  id: 'ejemplo',
  titulo: 'Taller de ejemplo: evaluación formativa en el aula',
  tituloCorto: 'Taller de ejemplo',
  descripcion: 'Taller de ejemplo para docentes: plantilla para crear talleres nuevos con la misma plataforma.',
  subtitulo: 'Una sesión de dos horas para diseñar una evaluación formativa para tu clase',
  entidad: 'Yo Aprendo',
  version: '1.0',

  // La sala de espera cuenta hacia esta fecha y hora (Guatemala, UTC-6).
  fecha: { inicio: '2027-01-18T08:00:00-06:00', texto: 'lunes 18 de enero' },
  dominio: 'taller.yoaprendo.online',

  // Palabra que dibuja la nube de frases del cierre (usa 2 a 6 letras o signos).
  nube: { texto: 'YA.' },

  // Cada taller usa su propia sala. La primera vez que entres como facilitador
  // con un PIN de 8+ caracteres, la sala se crea con ese PIN.
  salaPorDefecto: 'ejemplo-1',

  bienvenida: {
    titulo: 'Hoy diseñas una evaluación que ayuda a aprender',
    intro: 'En dos horas vas a crear una actividad de evaluación formativa para tu propio grupo. No necesitas experiencia previa.',
    recordatorio: 'Ten a mano un tema del programa del bimestre y una pregunta que quieras saber si tus estudiantes comprendieron.',
  },

  // ---------------- Qué se habilita en cada paso ----------------
  materialesPorBloque: {
    s1b2: ['guia-evaluacion'],
    s1b3: ['plan-de-clase'],
    s1b4: ['rubrica'],
  },

  // Sala sin conexión: palabras que flotan detrás de la cuenta regresiva.
  espera: {
    piezas: [
      { c: '#4C97FF', t: 'objetivo', x: 8, d: 0, s: 11 },
      { c: '#9966FF', t: 'evidencia', x: 28, d: 2.2, s: 13 },
      { c: '#FFBF00', t: 'retroalimentación', x: 48, d: 4.1, s: 10 },
      { c: '#59C059', t: 'criterios', x: 70, d: 1.1, s: 12 },
      { c: '#FF8C1A', t: 'mejora', x: 88, d: 5.2, s: 12 },
    ],
  },

  // ---------------- Encuesta de salida (se lanza una por una) ----------------
  encuestaSalida: [
    { etiqueta: 'Salida 1/3 · Confianza', pregunta: '¿Qué tan seguro/a te sientes para aplicar lo aprendido?', opciones: ['1 · Poco', '2', '3', '4', '5 · Mucho'] },
    { etiqueta: 'Salida 2/3 · Qué vas a hacer', pregunta: '¿Qué vas a aplicar primero y en qué fecha?', tipo: 'abierta' },
    { etiqueta: 'Salida 3/3 · ¿Lo recomendarías?', pregunta: '¿Recomendarías este taller a otro colega?', opciones: ['Sí', 'Tal vez', 'No'] },
  ],

  // ---------------- Certificado ----------------
  certificado: {
    habilitado: true,
    facilitador: 'Nombre del facilitador',
    credencial: 'Cargo o credencial',
    titulo: 'Certificado de finalización',
    subtitulo: 'Taller de ejemplo: evaluación formativa en el aula',
    duracion: '2 horas · 1 sesión',
    entidad: 'Yo Aprendo',
    cuerpo: 'Por haber diseñado una actividad de evaluación formativa para su grupo, con criterios claros y un plan de retroalimentación,',
    modulos: [
      'Objetivos de aprendizaje observables',
      'Criterios de evaluación claros',
      'Retroalimentación oportuna',
      'Plan para aplicarlo en el aula',
    ],
  },

  piso: { habilitado: true, timeoutSolicitud: 30000 },

  // Proyecto de Scratch en vivo: solo para talleres que lo usen.
  scratch: { habilitado: false },
  proyectosBase: [],

  // ---------------- Materiales de los docentes ----------------
  // `archivo` puede ser una página tuya o un documento de la plantilla:
  //   material/ver.html?t=<id>&m=<clave en «documentos»>
  materiales: {
    'guia-evaluacion': {
      titulo: 'Guía de evaluación formativa',
      desc: 'Qué es, por qué sirve y cómo se diseña una actividad.',
      archivo: 'material/ver.html?t=ejemplo&m=guia-evaluacion',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase',
      desc: 'El formato que llenas en pantalla y guardas como PDF.',
      archivo: 'material/ver.html?t=ejemplo&m=plan-de-clase',
      libre: false,
      momento: 'Diseño',
    },
    'rubrica': {
      titulo: 'Mi rúbrica',
      desc: 'Para revisar tu actividad antes de aplicarla.',
      archivo: 'material/ver.html?t=ejemplo&m=rubrica',
      libre: false,
      momento: 'Revisión',
    },
  },

  // ---------------- Materiales del facilitador ----------------
  materialesFacilitador: {
    'guia-evaluacion': {
      titulo: 'Guía de evaluación formativa',
      desc: 'La misma guía que ven los docentes.',
      archivo: 'material/ver.html?t=ejemplo&m=guia-evaluacion',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase',
      desc: 'Para revisar el formato antes de la sesión.',
      archivo: 'material/ver.html?t=ejemplo&m=plan-de-clase',
      libre: true,
      momento: 'Antes de la sesión',
    },
    'rubrica': {
      titulo: 'Rúbrica',
      desc: 'Para revisar los criterios antes de la sesión.',
      archivo: 'material/ver.html?t=ejemplo&m=rubrica',
      libre: true,
      momento: 'Antes de la sesión',
    },
  },

  // ---------------- Documentos hechos con la plantilla ----------------
  // Tipos de bloque: aviso, h2, p, lista, preguntas, tarjetas, tabla, rubrica, campos, escribir.
  // Lo que escribas va como texto; **así** pone negrita. Una celda vacía ('') se llena en pantalla;
  // '○' es un círculo para marcar.
  documentos: {
    'guia-evaluacion': {
      titulo: 'Guía de evaluación formativa',
      subtitulo: 'Lo que vas a hacer hoy y cómo prepararte.',
      rellenable: false,
      bloques: [
        { tipo: 'aviso', color: 'azul', titulo: 'Antes de empezar', texto: 'Ten a mano un tema de tu programa y una pregunta que quieras saber si tus estudiantes comprendieron.' },
        { tipo: 'h2', texto: '¿Qué es la evaluación formativa?' },
        { tipo: 'p', texto: 'Es la que se hace **durante** el aprendizaje, para ajustar la clase mientras todavía hay tiempo de mejorar.' },
        { tipo: 'h2', texto: '¿Cómo va a ser la sesión?' },
        { tipo: 'lista', numerada: true, items: ['Elegimos un objetivo observable.', 'Diseñamos una actividad corta.', 'Definimos criterios y retroalimentación.', 'Armamos el plan para aplicarlo.'] },
        { tipo: 'tarjetas', items: [
          { titulo: 'Objetivo', texto: 'Qué debe poder hacer el estudiante al terminar.' },
          { titulo: 'Evidencia', texto: 'Qué mostrará para demostrar que lo logró.' },
          { titulo: 'Mejora', texto: 'Qué harás cuando la evidencia muestre dificultades.' },
        ] },
        { tipo: 'h2', texto: '¿Qué preguntas conviene hacerse?' },
        { tipo: 'preguntas', items: [
          { q: '¿Qué quiero saber?', nota: 'Una sola idea por actividad.' },
          { q: '¿Cómo lo voy a ver?', nota: 'Algo que el estudiante hace o produce.' },
        ] },
      ],
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase',
      subtitulo: 'Llénalo en pantalla y guárdalo como PDF.',
      bloques: [
        { tipo: 'campos', etiquetas: ['Docente', 'Grado y sección', 'Tema', 'Fecha de aplicación'] },
        { tipo: 'h2', texto: '¿Qué aprendizaje espero?' },
        { tipo: 'escribir', etiqueta: 'Objetivo', lineas: 2 },
        { tipo: 'h2', texto: '¿Cómo es la clase?' },
        { tipo: 'tabla', cols: ['Momento', 'Minutos', '¿Qué hace el estudiante?'], anchos: ['25%', '15%', '60%'],
          filas: [['Inicio', '', ''], ['Desarrollo', '', ''], ['Cierre', '', '']] },
        { tipo: 'h2', texto: '¿Cómo voy a dar retroalimentación?' },
        { tipo: 'escribir', etiqueta: 'Retroalimentación', lineas: 3 },
      ],
    },
    'rubrica': {
      titulo: 'Mi rúbrica',
      subtitulo: 'Revisa tu actividad antes de aplicarla. No hay nota, hay conversación.',
      bloques: [
        { tipo: 'campos', etiquetas: ['Actividad', 'Asignatura'] },
        { tipo: 'rubrica', niveles: [1, 3, 5], criterios: [
          { nombre: 'Objetivo claro', revisar: '¿Se entiende qué debe lograr el estudiante?' },
          { nombre: 'Evidencia', revisar: '¿Hay algo concreto que el estudiante muestra?' },
          { nombre: 'Retroalimentación', revisar: '¿Sé qué voy a decir según lo que vea?' },
        ] },
        { tipo: 'h2', texto: '¿Qué significa cada número?' },
        { tipo: 'tarjetas', items: [
          { titulo: '1 · Empezando', texto: 'Falta definir el objetivo o la evidencia.' },
          { titulo: '3 · Avanzando', texto: 'Está claro, pero falta precisar un criterio.' },
          { titulo: '5 · Listo', texto: 'Se puede aplicar mañana tal como está.' },
        ] },
        { tipo: 'escribir', etiqueta: 'Mi próximo ajuste', lineas: 2 },
      ],
    },
  },

  // ---------------- La sesión ----------------
  secciones: [
    {
      id: 's1',
      numero: 1,
      titulo: 'Diseña tu evaluación formativa',
      concepto: 'Objetivo, evidencia y retroalimentación',
      duracion: 120,
      producto: 'Una actividad de evaluación formativa lista para aplicar, con su plan de clase.',
      bloques: [
        {
          id: 's1b1',
          titulo: 'Apertura: ¿para qué evaluamos?',
          minutos: '0-15',
          momentoWow: 'Descubres que una calificación sola no dice qué hacer para mejorar.',
          paraDocentes: 'Piensa en la última evaluación que aplicaste. ¿Qué hiciste después con los resultados?',
          pasos: [
            'Responde en el chat: ¿qué hiciste con los resultados de tu última evaluación?',
            'Lee la guía de evaluación formativa.',
          ],
          guioFacilitador: 'Pide dos o tres respuestas en voz alta. Anota las ideas que se repiten y vuelve a ellas en el cierre.',
          soloFacilitador: false,
        },
        {
          id: 's1b2',
          titulo: 'Objetivo y evidencia',
          minutos: '15-50',
          momentoWow: 'Conviertes un tema amplio en algo que se puede observar.',
          paraDocentes: 'Elige un tema y escribe qué debe poder hacer el estudiante. Luego define qué mostrará como evidencia.',
          pasos: [
            'Elige un tema de tu programa.',
            'Escribe el objetivo con un verbo observable.',
            'Define la evidencia que mostrará el estudiante.',
          ],
          guioFacilitador: 'Da un ejemplo malo («comprender la fotosíntesis») y uno bueno («explicar con un dibujo cómo se transforma la luz»). Pide que mejoren uno en el chat.',
          soloFacilitador: false,
        },
        {
          id: 's1b3',
          titulo: 'Plan de la clase',
          minutos: '50-90',
          momentoWow: 'Tu actividad ya tiene minutos, momentos y retroalimentación.',
          paraDocentes: 'Llena el plan de clase en pantalla: inicio, desarrollo y cierre.',
          pasos: [
            'Abre el material «Plan de una clase».',
            'Llena los minutos y lo que hace el estudiante en cada momento.',
            'Escribe cómo darás retroalimentación.',
          ],
          guioFacilitador: 'Recorre las salas pequeñas. Pregunta a cada pareja: «¿Cómo sabrás que lo lograron?».',
          soloFacilitador: false,
        },
        {
          id: 's1b4',
          titulo: 'Revisión con la rúbrica',
          minutos: '90-110',
          momentoWow: 'Mides tu propia actividad con criterios claros.',
          paraDocentes: 'Revisa tu actividad con la rúbrica y decide un solo ajuste.',
          pasos: [
            'Abre «Mi rúbrica» y marca un nivel por criterio.',
            'Escribe el ajuste más importante.',
          ],
          guioFacilitador: 'Insiste en un solo ajuste: más de uno no se cumple.',
          soloFacilitador: false,
        },
        {
          id: 's1b5',
          titulo: 'Compromiso: día, grupo y hora',
          minutos: '110-120',
          momentoWow: 'Tu actividad tiene fecha y grupo.',
          paraDocentes: 'Escribe cuándo y con qué grupo vas a aplicarla. Responde la encuesta de salida y recoge tu certificado.',
          pasos: [
            'Escribe: aplicaré [tema] el [fecha] con [grupo].',
            'Responde las preguntas de salida que aparecen en pantalla.',
            'Recoge tu certificado cuando se habilite.',
          ],
          guioFacilitador: 'Ronda rápida de compromisos. Lanza la encuesta de salida y, al final, pulsa «Finalizar taller».',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Una pregunta de salida al final de la clase.',
        media: 'Una actividad corta con criterios y retroalimentación escrita.',
        avanzada: 'Un ciclo completo: evidencia, retroalimentación y segunda oportunidad.',
      },
    },
  ],

  // ---------------- Notas privadas del facilitador ----------------
  notasFacilitador: {
    reglasDelTaller: [
      'Aquí todos aprendemos. Incluido quien facilita.',
      'Nadie evalúa el trabajo de nadie: se comparte lo que cada quien decide.',
      'Terminar con una actividad lista para aplicar es el único objetivo.',
    ],
    frasesUtiles: [
      'Alguien se traba: «Cuéntame qué estás pensando». No des la solución.',
      'Se acaba el tiempo: «Guarden ahora lo que tengan».',
    ],
    respuestasRapidas: [
      { objecion: 'No tengo tiempo para evaluar así', respuesta: 'La evaluación formativa puede durar tres minutos: una pregunta y una decisión.' },
    ],
  },
};
