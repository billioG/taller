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
  subtitulo: 'Cuatro sesiones para construir un recurso interactivo de su propia asignatura',
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

  // Lo que ven los docentes al entrar, antes de la sesión 1
  bienvenida: {
    titulo: 'Bienvenido al taller',
    intro: 'En cuatro sesiones de dos horas vas a crear un recurso interactivo sobre un contenido de tu propia asignatura. No necesitas saber programar.',
    recordatorio: 'Trae un contenido del programa de estudio del bimestre en curso. Ese es el material con el que vamos a trabajar.',
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
      momento: 'Antes de la sesión 1',
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
      desc: 'Para imprimir grande y recortar. Se usan en la sesión 1.',
      archivo: 'material/participantes/tarjetas-de-bloques.html',
      libre: false,
      momento: 'Sesión 1',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase',
      desc: 'El formato que llenas en la sesión 4 para llevar tu proyecto al aula.',
      archivo: 'material/participantes/plan-de-clase.html',
      libre: false,
      momento: 'Sesión 4',
    },
    'rubrica': {
      titulo: 'Mi rúbrica',
      desc: 'Para revisar tu propio proyecto antes de mostrarlo.',
      archivo: 'material/participantes/rubrica.html',
      libre: false,
      momento: 'Sesión 4',
    },
    'encuesta-salida': {
      titulo: 'Encuesta de salida',
      desc: 'Cinco preguntas. Se llena el último día.',
      archivo: 'material/participantes/encuesta-salida.html',
      libre: false,
      momento: 'Sesión 4',
    },
    'encuesta-30-dias': {
      titulo: 'Seguimiento a 30 días',
      desc: 'Para enviarla tres semanas después.',
      archivo: 'material/participantes/encuesta-30-dias.html',
      libre: false,
      momento: 'Después del taller',
    },
    'certificado': {
      titulo: 'Certificado',
      desc: 'Para imprimir en carta y firmar.',
      archivo: 'material/participantes/certificado.html',
      libre: false,
      momento: 'Sesión 4',
    },
  },

  // ------------------------------------------------------------------
  // MATERIALES — VERSIÓN FACILITADOR (con notas de guiado, tiempos, respuestas)
  // ------------------------------------------------------------------
  materialesFacilitador: {
    'guia-participante': {
      titulo: 'Guía del participante (facilitador)',
      desc: 'Versión con notas de timing, respuestas esperadas y tips.',
      archivo: 'material/facilitador/guia-participante.html',
      libre: true,
      momento: 'Antes de la sesión 1',
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
      momento: 'Sesión 1',
    },
    'plan-de-clase': {
      titulo: 'Plan de una clase (facilitador)',
      desc: 'Con ejemplos completos, rúbrica de corrección y plan B tipo.',
      archivo: 'material/facilitador/plan-de-clase.html',
      libre: false,
      momento: 'Sesión 4',
    },
    'rubrica': {
      titulo: 'Rúbrica (facilitador)',
      desc: 'Con criterios de calificación detallados y ejemplos de cada nivel.',
      archivo: 'material/facilitador/rubrica.html',
      libre: false,
      momento: 'Sesión 4',
    },
    'encuesta-salida': {
      titulo: 'Encuesta de salida (facilitador)',
      desc: 'Con guía de interpretación de respuestas para el nivel 2.',
      archivo: 'material/facilitador/encuesta-salida.html',
      libre: false,
      momento: 'Sesión 4',
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
      momento: 'Sesión 4',
    },
  },

  // Proyectos base de Scratch. Pega aquí los links de tus proyectos reales.
  proyectosBase: [
    {
      titulo: 'Proyecto base vacío',
      desc: 'Un proyecto limpio para empezar la sesión 1 desde cero.',
      url: 'https://scratch.mit.edu/projects/1043346752/',
      sesion: 1,
    },
  ],

  // ------------------------------------------------------------------
  // LAS CUATRO SESIONES
  // ------------------------------------------------------------------
  secciones: [

    // ==================================================================
    // SESIÓN 1
    // ==================================================================
    {
      id: 's1',
      numero: 1,
      titulo: 'Mi primer proyecto: un saludo que responde',
      concepto: 'Secuencia — las instrucciones se leen de arriba abajo, como una receta',
      duracion: 120,
      producto: 'Un programa que saluda, hace una pregunta y recibe una respuesta.',
      bloques: [
        {
          id: 's1b1',
          titulo: 'Bienvenida y el contrato del taller',
          minutos: '0-15',
          paraDocentes:
            'Escucha. No toques nada todavía. Vas a ver que esto es más fácil de lo que parece.',
          pasos: [
            'Verifica que tu sonido y tu cámara funcionen.',
            'Abre Scratch en otra pestaña para tenerlo listo.',
          ],
          guioFacilitador:
            'Enseña la pantalla deError deliberado antes de explicar nada. Que vean que te vas a equivocar. Diles: "en algún momento alguien va a decir que esto no es para mí. Cuando pase, mire a su alrededor: les va a pasar a tres más al mismo tiempo."',
          soloFacilitador: false,
        },
        {
          id: 's1b2',
          titulo: 'Demostración y el concepto con las manos',
          minutos: '15-35',
          paraDocentes:
            'Mira cómo se construye, en vivo y hablando en voz alta. Después te toca a ti.',
          pasos: [
            'Observa la demostración completa.',
            'Ordena las tarjetas de bloques que recibiste.',
          ],
          guioFacilitador:
            'Marca cada bloque con la voz: "este es el de mover, este el de decir". Al Distribuir las tarjetas NO las corrijas: pregunta "¿qué pasaría si el saludo viniera después de la respuesta?". Que el error salga solo.',
          soloFacilitador: false,
        },
        {
          id: 's1b3',
          titulo: 'Práctica guiada: lo hacemos juntos',
          minutos: '35-75',
          paraDocentes:
            'Sigue los mismos pasos que yo. Todos hacemos lo mismo al mismo tiempo.',
          pasos: [
            'Crea un proyecto nuevo y elige tu personaje.',
            'Agrega los bloques que vas viendo en pantalla.',
            'Prueba con la bandera verde.',
          ],
          guioFacilitador:
            'No respondas preguntas por el chat. Responde en voz alta para que todos escuchen. Si alguien lleva más de 2 minutos trabado, dile: "cierre Scratch y lo vuelva a abrir". Funciona la mitad de las veces.',
          soloFacilitador: false,
        },
        {
          id: 's1b4',
          titulo: 'Tu proyecto: elige tu ruta',
          minutos: '75-110',
          paraDocentes:
            'Elige la ruta que quieras. Nadie tiene que justificar la elección.',
          pasos: [
            'BÁSICA: el personaje se mueve, gira y cambia de apariencia.',
            'MEDIA: además responde al teclado y al ratón.',
            'AVANZADA: un semáforo que cambia con dos controles.',
          ],
          guioFacilitador:
            'La ruta BÁSICA se presenta como la que "funciona tal cual en clase", nunca como la de los que no pueden. Si alguien termina en el minuto 85, pásalo a avanzada. Si termina antes, que sea tutor de su mesa diez minutos.',
          soloFacilitador: false,
        },
        {
          id: 's1b5',
          titulo: 'Guardar y cerrar',
          minutos: '110-120',
          paraDocentes:
            'Guarda tu proyecto y compártelo. Esto ya es tuyo.',
          pasos: [
            'Guarda y comparte tu proyecto.',
            'Responde el ticket de salida.',
          ],
          guioFacilitador:
            'Frase de cierre: "Este proyecto lo hicieron ustedes. Nadie se lo dio hecho. La próxima sesión le ponemos puntos y lo convertimos en juego."',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Moverse, girar, cambiar de disfraz y repetir.',
        media: 'Agrega reacción al teclado y al ratón.',
        avanzada: 'Un semáforo con dos controles y bloques de condición.',
      },
    },

    // ==================================================================
    // SESIÓN 2
    // ==================================================================
    {
      id: 's2',
      numero: 2,
      titulo: 'Hacer que reaccione: control, azar y variables',
      concepto: 'Evento — algo que dispara una respuesta. Variable — un número que puede cambiar',
      duracion: 120,
      producto: 'Un juego de adivinar un número con marcador de puntos.',
      bloques: [
        {
          id: 's2b1',
          titulo: 'Repaso y la demostración del juego',
          minutos: '0-15',
          paraDocentes:
            '¿Qué fue lo que más les costó la vez pasada? Cuéntame tres respuestas.',
          pasos: [
            'Escucha el repaso.',
            'Mira el juego completo antes de construirlo.',
          ],
          guioFacilitador:
            'Pregunta en voz alta y espera. El silencio inicial en grupos grandes es normal. Después demuestra el juego completo, sin errores.',
          soloFacilitador: false,
        },
        {
          id: 's2b2',
          titulo: 'Práctica guiada: eventos y el número secreto',
          minutos: '15-35',
          paraDocentes:
            'Un evento es como cuando alguien toca el timbre: algo pasa y algo responde.',
          pasos: [
            'Agrega la reacción al teclado.',
            'Genera un número aleatorio y guárdalo en una variable.',
          ],
          guioFacilitador:
            'Las variables son el terror del docente apático. Introduce UNA sola variable, con analogía física: una tarjeta con un número escrito que se borra y se reescribe. Si introduces dos o tres a la vez, pierdes a la mitad del grupo.',
          soloFacilitador: false,
        },
        {
          id: 's2b3',
          titulo: 'Práctica guiada: el marcador de puntos',
          minutos: '35-60',
          paraDocentes:
            'Suma un punto cuando acierta. Esta es la parte que más se usa en clase.',
          pasos: [
            'Crea la variable puntos.',
            'Suma y resta según el resultado.',
          ],
          guioFacilitador:
            'Repite el paso para todo el grupo en voz alta. Nadie avanza solo en esta parte.',
          soloFacilitador: false,
        },
        {
          id: 's2b4',
          titulo: 'Tu proyecto: elige tu ruta',
          minutos: '60-105',
          paraDocentes:
            'La ruta MEDIA es un quiz con tres preguntas de tu propia asignatura. Puedes usarlo con tus estudiantes la próxima semana.',
          pasos: [
            'BÁSICA: adivina el número con pistas de "más alto" y "más bajo".',
            'MEDIA: un quiz de tres preguntas de tu asignatura, con puntaje.',
            'AVANZADA: un juego con tres niveles, vidas y reinicio automático.',
          ],
          guioFacilitador:
            'Si alguien elige la ruta MEDIA, valórala en voz alta: "eso ya lo puede usar la próxima semana". Le devuelve legitimidad como experto del contenido.',
          soloFacilitador: false,
        },
        {
          id: 's2b5',
          titulo: 'Cierre',
          minutos: '105-120',
          paraDocentes:
            'Piensa esto: ¿qué pregunta le harías a un estudiante para saber que entendió, usando este proyecto?',
          pasos: [
            'Muestra tu proyecto si quieres.',
            'Anota la pregunta del cierre.',
          ],
          guioFacilitador:
            'No hace falta que respondan hoy. Se escribe en la pizarra y se recoge en la sesión 3.',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Juego de adivinar el número con retroalimentación.',
        media: 'Quiz de tres preguntas de tu asignatura con puntaje.',
        avanzada: 'Juego con niveles de dificultad, vidas y reinicio.',
      },
    },

    // ==================================================================
    // SESIÓN 3
    // ==================================================================
    {
      id: 's3',
      numero: 3,
      titulo: 'Contar una historia: personajes, escenarios y sonido',
      concepto: 'Condición — si pasa esto, entonces haz aquello',
      duracion: 120,
      producto: 'Una historia interactiva o una simulación didáctica.',
      bloques: [
        {
          id: 's3b1',
          titulo: 'El concepto: si... entonces',
          minutos: '0-20',
          paraDocentes:
            'Mira un ejemplo terminado. Esto lo puede hacer un estudiante de cuarto grado con esta guía.',
          pasos: [
            'Mira el proyecto terminado.',
            'Entiende la idea de "si... entonces".',
          ],
          guioFacilitador:
            'Usa un ejemplo del aula, no de programación: "si el estudiante responde bien, entonces aparece la estrella; si no, aparece el rayo para intentarlo otra vez". Esa es toda la idea.',
          soloFacilitador: false,
        },
        {
          id: 's3b2',
          titulo: 'Práctica guiada: dos personajes que conversan',
          minutos: '20-60',
          paraDocentes:
            'El timbre que suena en otra habitación: así funciona un mensaje entre personajes.',
          pasos: [
            'Agrega un segundo personaje y cambia el escenario.',
            'Haz que los dos hablen.',
            'Agrega un sonido.',
          ],
          guioFacilitador:
            'El bloque "al recibir mensaje" asusta. Explícalo con un timbre: "cuando hago sonar el timbre en esta habitación, alguien lo escucha en la otra y responde".',
          soloFacilitador: false,
        },
        {
          id: 's3b3',
          titulo: 'Tu proyecto: elige tu ruta',
          minutos: '60-108',
          paraDocentes:
            'Construye la historia o la simulación de tu contenido.',
          pasos: [
            'BÁSICA: un escenario, dos personajes, cuatro líneas de diálogo y un final.',
            'MEDIA: si responde de una manera, final A; si responde de otra, final B.',
            'AVANZADA: una simulación donde una variable cambia y se ve el efecto.',
          ],
          guioFacilitador:
            'Ejemplos de la ruta avanzada: el agua que sube y se desborda, la planta que crece, el presupuesto que se agota. Ancla siempre en el contenido de ellos.',
          soloFacilitador: false,
        },
        {
          id: 's3b4',
          titulo: 'Cierre',
          minutos: '108-120',
          paraDocentes:
            'Escribe una pregunta que el estudiante NO podrá responder bien si no entendió el contenido.',
          pasos: [
            'Escribe tu pregunta de evaluación.',
            'Responde el ticket de salida.',
          ],
          guioFacilitador:
            'Este ejercicio conecta directamente con la evaluación. Pídelo por escrito. Lo van a necesitar en la sesión 4.',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Historia contada: escenario, dos personajes y un final.',
        media: 'Dos finales según la respuesta del estudiante.',
        avanzada: 'Simulación con variables: el agua, la planta, el presupuesto.',
      },
    },

    // ==================================================================
    // SESIÓN 4
    // ==================================================================
    {
      id: 's4',
      numero: 4,
      titulo: 'Del proyecto al aula: publicar, planear y decidir',
      concepto: 'Ningún concepto nuevo. Toda esta sesión es de aplicación.',
      duracion: 120,
      producto: 'Proyecto publicado y plan de una clase con fecha.',
      bloques: [
        {
          id: 's4b1',
          titulo: 'Publicar y copiar tu enlace',
          minutos: '0-25',
          paraDocentes:
            'Comparte tu proyecto, copia el enlace y pruébalo en tu celular. Si abre, funciona.',
          pasos: [
            'Comparte tu proyecto.',
            'Pega el enlace en el documento compartido.',
          ],
          guioFacilitador:
            'Este es el punto donde el taller se gana o se pierde. Un proyecto sin publicar no se implementa. Si alguien no puede publicar, que exporte el archivo y lo comparta por otro medio.',
          soloFacilitador: false,
        },
        {
          id: 's4b2',
          titulo: 'Diseñar el reto: qué tiene que saber el estudiante',
          minutos: '25-55',
          paraDocentes:
            'Aquí el taller deja de ser tecnológico. Vamos a diseñar la evaluación de tu actividad.',
          pasos: [
            'Escribe el aprendizaje esperado, tal como está en tu programa.',
            '¿Qué tiene que hacer el estudiante para demostrar que lo sabe?',
            'Escribe dos o tres criterios de éxito. No más.',
          ],
          guioFacilitador:
            'Guía con preguntas, no con instrucciones. La última es la más importante: "¿qué pasa si un estudiante solo ve sin hacer nada?". Todos los proyectos deben exigir una acción.',
          soloFacilitador: false,
        },
        {
          id: 's4b3',
          titulo: 'Plan de una clase',
          minutos: '55-100',
          paraDocentes:
            'Llena el formato. La parte que más importa es el plan B: qué haces si algo falla.',
          pasos: [
            'Los tres momentos de la clase: inicio, desarrollo, cierre.',
            'Qué evidencia recoges y cómo la pones en el libro de notas.',
            'El plan B: sin internet, sin equipos suficientes, alguien que termina en tres minutos.',
          ],
          guioFacilitador:
            'El plan B NO es opcional. Este es el punto donde el docente apático se rinde: necesita que alguien le diga qué hacer si algo falla. Dáselo tú.',
          soloFacilitador: false,
        },
        {
          id: 's4b4',
          titulo: 'Compromiso y cierre',
          minutos: '100-120',
          paraDocentes:
            'Di en una sola frase qué vas a implementar y cuándo. Se escribe la fecha, no "próximamente".',
          pasos: [
            'Escribe tu fecha de implementación.',
            'Llena la encuesta de salida.',
          ],
          guioFacilitador:
            'Frase de cierre: "El enlace ya está en sus manos. La fecha ya está en su calendario. Lo único que falta es abrir Scratch el martes. Nos vemos en treinta días." Anuncia la fecha del seguimiento AHORA.',
          soloFacilitador: false,
        },
      ],
      rutas: {
        basica: 'Publica y copia el enlace.',
        media: 'Publica y llena el plan de una clase completo.',
        avanzada: 'Publica y además diseña una versión 2 conretroalimentación al estudiante.',
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