
'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const DB      = require('../db');

// Extensiones permitidas según los requerimientos de tu Ecosistema Híbrido
const ALLOWED_EXTENSIONS = ['.pdf', '.mp4', '.mov', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.ino'];
const MAX_SIZE_BYTES      = 50 * 1024 * 1024; // 50 MB

// 1. Configuración del Almacenamiento
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '..', '..', process.env.UPLOADS_DIR || 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    // Sanitiza el nombre eliminando espacios y caracteres especiales
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

// 2. Filtro de Extensiones
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    // Retorna un error controlado que Express pueda manejar
    cb(new Error(`Extensión "${ext}" no permitida.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).single('file'); // Declaramos aquí que procesará un solo archivo llamado 'file'

// GET: Obtener todos los materiales de la biblioteca virtual
router.get('/', async (req, res, next) => {
  try {
    const materiales = await DB.getMateriales();
    res.json(materiales);
  } catch (err) {
    next(err);
  }
});

// POST: Cargar material multimedia (PDF, Videos, Código .ino)
router.post('/', (req, res, next) => {
  // Ejecutamos multer manualmente para interceptar correctamente los errores de tamaño
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'El archivo supera el límite permitido de 50 MB.' });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo.' });
      }

      const ext      = path.extname(req.file.originalname).toLowerCase();
      const fileUrl  = `/uploads/${req.file.filename}`;   
      const category = req.body.category || detectCategory(ext);

      // Guardado en la Base de Datos del CMS Docente
      const material = await DB.createMaterial({
        // Si no viene nombre, asignamos el nombre sanitizado sin la extensión
        name:       req.body.name?.trim() || req.file.filename.split('_').slice(1).join('_'),
        ext,
        sizeBytes:  req.file.size,
        category,
        practiceId: req.body.practiceId || null,
        uploadedBy: req.body.uploadedBy || 'unknown',
        fileUrl,
      });

      res.status(201).json(material);
    } catch (dbErr) {
      next(dbErr);
    }
  });
});

// DELETE: Eliminar archivos físicos y registros lógicos
router.delete('/:id', async (req, res, next) => {
  try {
    const materiales = await DB.getMateriales();
    const material   = materiales.find(m => m.id === req.params.id);
    if (!material) return res.status(404).json({ error: 'Material no encontrado.' });

    // Ruta absoluta del archivo en el servidor
    const filePath = path.join(__dirname, '..', '..', material.fileUrl.replace(/^\//, ''));
    
    // Eliminación del archivo físico de forma segura
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminación lógica en DB
    await DB.deleteMaterial(req.params.id);
    res.json({ ok: true, message: 'Material eliminado exitosamente.' });
  } catch (err) {
    next(err);
  }
});

// Función Auxiliar de Categorización Automática
function detectCategory(ext) {
  if (ext === '.pdf')                              return 'pdf';
  if (['.mp4', '.mov'].includes(ext))             return 'video';
  if (ext === '.ino')                             return 'code';
  if (['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext)) return 'image';
  return 'other';
}

module.exports = router;
