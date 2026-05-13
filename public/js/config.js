'use strict';

const CONFIG = {
  API_BASE: '/api',
  MAX_FILE_SIZE_MB:  50,
  MAX_PHOTO_SIZE_MB: 10,

  ALLOWED_MATERIAL_TYPES: {
    'application/pdf':          '.pdf',
    'video/mp4':                '.mp4',
    'video/quicktime':          '.mov',
    'image/jpeg':               '.jpg',
    'image/png':                '.png',
    'text/plain':               '.ino',
    'application/octet-stream': '.*',
  },

  ALLOWED_PHOTO_TYPES: {
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/heic': '.heic',
  },

  ALLOWED_EXTENSIONS: [
    '.pdf', '.mp4', '.mov',
    '.jpg', '.jpeg', '.png', '.webp', '.heic',
    '.ino',
  ],
};
