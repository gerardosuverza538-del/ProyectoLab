
'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');

// Función mejorada para evitar duplicados si se eliminan registros intermedios
function autoNum(practicas) {
  if (!practicas || practicas.length === 0) return 'P-01';
  
  // Extrae los números de los strings 'P-XX' y encuentra el mayor
  const numeros = practicas.map(p => {
    const match = p.num ? p.num.match(/\d+/) : null;
    return match ? parseInt(match[0], 10) : 0;
  });
  
  const maxNum = Math.max(...numeros);
  return `P-${String(maxNum + 1).padStart(2, '0')}`;
}

// GET: Obtener prácticas filtradas por rol (Alumno / Docente)
router.get('/', async (req, res, next) => {
  try {
    let practicas = await DB.getPracticas();

    const role = req.query.role || 'student';
    // Seguridad: Los alumnos solo ven prácticas con estatus 'published'
    if (role === 'student') {
      practicas = practicas.filter(p => p.status === 'published');
    }

    res.json(practicas);
  } catch (err) {
    next(err);
  }
});

// GET/:id - Obtener una práctica específica por ID
router.get('/:id', async (req, res, next) => {
  try {
    const practica = await DB.getPracticaById(req.params.id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });
    res.json(practica);
  } catch (err) {
    next(err);
  }
});

// POST: Crear una nueva práctica desde el Panel CMS Docente
router.post('/', async (req, res, next) => {
  try {
    const {
      num, title, objective, difficulty, deliveryType,
      components, steps, circuitDiagram, codeSnippet,
      quiz, createdBy,
    } = req.body;

    // Validación de campos obligatorios en el Frontend/Backend
    if (!title?.trim()) {
      return res.status(400).json({ error: 'El título es obligatorio.' });
    }

    const practicas = await DB.getPracticas();
    // Usa el número provisto o calcula el consecutivo real de manera segura
    const numFinal  = num?.trim() || autoNum(practicas);

    const saved = await DB.createPractica({
      num:            numFinal,
      title:          title.trim(),
      objective:      objective       || '',
      // Si difficulty no viene o es inválido, por defecto es 1
      difficulty:     isNaN(Number(difficulty)) ? 1 : Number(difficulty), 
      deliveryType:   deliveryType    || 'photo',
      components:     Array.isArray(components) ? components : [],
      steps:          Array.isArray(steps)      ? steps      : [],
      circuitDiagram: circuitDiagram  || '',
      codeSnippet:    codeSnippet     || '',
      quiz:           quiz            || null,
      status:         req.body.status || 'draft', // Por defecto inicia como borrador
      createdBy:      createdBy       || 'unknown',
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// PATCH: Actualización parcial de contenidos (Editor sin código)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const practica = await DB.getPracticaById(id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });

    // Campos permitidos para actualización en el CMS
    const allowed = [
      'num', 'title', 'objective', 'difficulty', 'deliveryType',
      'components', 'steps', 'circuitDiagram', 'codeSnippet',
      'quiz', 'status',
    ];
    
    const changes = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        // Si el campo es el título, le aplicamos trim
        changes[key] = (key === 'title' && typeof req.body[key] === 'string') 
          ? req.body[key].trim() 
          : req.body[key];
      }
    });

    const updated = await DB.updatePractica(id, changes);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE: Eliminar práctica del ecosistema
router.delete('/:id', async (req, res, next) => {
  try {
    const practica = await DB.getPracticaById(req.params.id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });
    
    await DB.deletePractica(req.params.id);
    res.json({ ok: true, message: 'Práctica eliminada exitosamente.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

module.exports = router;
