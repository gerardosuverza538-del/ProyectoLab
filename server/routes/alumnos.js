'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const alumnos = await DB.getAlumnos();
    res.json(alumnos);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const alumno = await DB.getAlumnoById(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
    res.json(alumno);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, matricula, group } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    if (!matricula?.trim()) {
      return res.status(400).json({ error: 'La matrícula es obligatoria.' });
    }

    const existe = await DB.matriculaExists(matricula.trim());
    if (existe) {
      return res.status(409).json({ error: `La matrícula ${matricula} ya está registrada.` });
    }

    const alumno = await DB.createAlumno({
      name:      name.trim(),
      email:     email?.trim()     || '',
      matricula: matricula.trim(),
      group:     group?.trim()     || 'G1',
    });

    res.status(201).json(alumno);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const alumno = await DB.getAlumnoById(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

    const allowed = ['name', 'email', 'group', 'active'];
    const changes = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) changes[key] = req.body[key];
    });

    const updated = await DB.updateAlumno(req.params.id, changes);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const alumno = await DB.getAlumnoById(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
    await DB.deleteAlumno(req.params.id);
    res.json({ ok: true, message: `"${alumno.name}" dado de baja.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
