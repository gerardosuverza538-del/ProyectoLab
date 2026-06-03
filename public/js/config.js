'use strict';

const CONFIG = {
  // Ruta base para las peticiones fetch a la API del servidor Express
  API_BASE: '/api',
  
  // Límites estrictos de almacenamiento (en Megabytes)
  MAX_FILE_SIZE_MB:  50, // Repositorio docente / Materiales multimedia
  MAX_PHOTO_SIZE_MB: 10, // Evidencias de entrega de los alumnos

  // Mapeo estructurado para validaciones cruzadas (MIME Type -> Extensión)
  ALLOWED_MATERIAL_TYPES: {
    'application/pdf':          '.pdf',
    'video/mp4':                '.mp4',
    'video/quicktime':          '.mov', // Soporte para formatos registrados en iOS (.mov)
    'image/jpeg':               '.jpg',
    'image/png':                '.png',
    'image/webp':               '.webp',
    'text/plain':               '.ino'  // Archivos fuente de sketchs de Arduino
  },

  // Tipos permitidos para las entregas de evidencias prácticas del Alumno
  ALLOWED_PHOTO_TYPES: {
    'image/jpeg':       '.jpg',
    'image/png':        '.png',
    'image/webp':       '.webp',
    'image/heic':       '.heic', // Formato de alta eficiencia usado en dispositivos Apple
    'application/pdf':  '.pdf'   // Permite reportes compilados en PDF
  },

  // Arreglo plano global utilizado por la lógica de sanitización y reset de Dropzones
  ALLOWED_EXTENSIONS: [
    '.pdf', '.mp4', '.mov',
    '.jpg', '.jpeg', '.png', '.webp', '.heic',
    '.ino'
  ]
};

// Congelar el objeto previene alteraciones maliciosas o accidentales en tiempo de ejecución
Object.freeze(CONFIG);
