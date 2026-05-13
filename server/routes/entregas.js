
'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { studentId, practiceId } = req.query;
    const entregas = await DB.getEntregas({ studentId, practiceId });
    res.json(entregas);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { practiceId, studentId, studentName, type, fileUrl, quizAnswers, quizScore } = req.body;

    if (!practiceId || !studentId || !type) {
      return res.status(400).json({ error: 'practiceId, studentId y type son obligatorios.' });
    }
    if (type !== 'photo' && type !== 'quiz') {
      return res.status(400).json({ error: 'type debe ser "photo" o "quiz".' });
    }
    if (type === 'photo' && !fileUrl) {
      return res.status(400).json({ error: 'fileUrl es obligatorio para entregas de foto.' });
    }

    const existing = await DB.getEntregas({ studentId, practiceId });
    const duplicate = existing.find(e => e.type === type);
    if (duplicate) {
      return res.status(409).json({ error: 'Ya existe una entrega de este tipo para esta práctica.' });
    }

    const entrega = await DB.createEntrega({
      practiceId,
      studentId,
      studentName: studentName || 'Alumno',
      type,
      fileUrl:     fileUrl     ?? null,
      quizAnswers: quizAnswers ?? null,
      quizScore:   quizScore   ?? null,
    });

    res.status(201).json(entrega);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/calificar', async (req, res, next) => {
  try {
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
      return res.status(400).json({ error: 'La calificación es obligatoria.' });
    }
    if (Number(grade) < 0 || Number(grade) > 10) {
      return res.status(400).json({ error: 'La calificación debe ser entre 0 y 10.' });
    }

    const updated = await DB.calificarEntrega(req.params.id, {
      grade:    Number(grade),
      feedback: feedback?.trim() || '',
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
