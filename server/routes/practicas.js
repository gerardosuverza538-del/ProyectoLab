
'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');

function autoNum(count) {
  return `P-${String(count + 1).padStart(2, '0')}`;
}

router.get('/', async (req, res, next) => {
  try {
    let practicas = await DB.getPracticas();

    const role = req.query.role || 'student';
    if (role === 'student') {
      practicas = practicas.filter(p => p.status === 'published');
    }

    res.json(practicas);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const practica = await DB.getPracticaById(req.params.id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });
    res.json(practica);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      num, title, objective, difficulty, deliveryType,
      components, steps, circuitDiagram, codeSnippet,
      quiz, createdBy,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'El título es obligatorio.' });
    }

    const practicas = await DB.getPracticas();
    const numFinal  = num?.trim() || autoNum(practicas.length);

    const saved = await DB.createPractica({
      num:            numFinal,
      title:          title.trim(),
      objective:      objective       || '',
      difficulty:     Number(difficulty) || 1,
      deliveryType:   deliveryType    || 'photo',
      components:     Array.isArray(components) ? components : [],
      steps:          Array.isArray(steps)      ? steps      : [],
      circuitDiagram: circuitDiagram  || '',
      codeSnippet:    codeSnippet     || '',
      quiz:           quiz            || null,
      createdBy:      createdBy       || 'unknown',
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const practica = await DB.getPracticaById(id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });

    const allowed = [
      'num', 'title', 'objective', 'difficulty', 'deliveryType',
      'components', 'steps', 'circuitDiagram', 'codeSnippet',
      'quiz', 'status',
    ];
    const changes = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) changes[key] = req.body[key];
    });

    const updated = await DB.updatePractica(id, changes);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const practica = await DB.getPracticaById(req.params.id);
    if (!practica) return res.status(404).json({ error: 'Práctica no encontrada.' });
    await DB.deletePractica(req.params.id);
    res.json({ ok: true, message: 'Práctica eliminada.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
