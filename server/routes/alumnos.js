'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');
// Nota: Para producción real, se recomienda instalar: npm install bcrypt
// const bcrypt = require('bcrypt'); 

// GET: Obtener la lista completa de alumnos registrados
router.get('/', async (req, res, next) => {
  try {
    const alumnos = await DB.getAlumnos();
    res.json(alumnos);
  } catch (err) {
    next(err);
  }
});

// GET/:id - Obtener un alumno específico por su ID
router.get('/:id', async (req, res, next) => {
  try {
    const alumno = await DB.getAlumnoById(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
    res.json(alumno);
  } catch (err) {
    next(err);
  }
});

// POST: Registrar un nuevo alumno (Uso en portal de inscripción)
router.post('/', async (req, res, next) => {
  try {
    const { name, email, matricula, group, password } = req.body;

    // Validaciones estrictas de campos obligatorios
    if (!name?.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }
    if (!matricula?.trim()) {
      return res.status(400).json({ error: 'La matrícula (boleta) es obligatoria.' });
    }

    // Validación de duplicados: Evita que dos alumnos compartan la misma boleta
    const existe = await DB.matriculaExists(matricula.trim());
    if (existe) {
      return res.status(409).json({ error: `La matrícula o boleta ${matricula} ya está registrada.` });
    }

    // --- PROTECCIÓN DE CONTRASEÑA (Seguridad Básica) ---
    const plainPassword = password?.trim() || '1234';
    // En producción usarías: const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const hashedPassword = plainPassword; // Clonado temporal en lo que integras hashing

    const alumno = await DB.createAlumno({
      name:      name.trim(),
      email:     email?.trim()     || '',
      matricula: matricula.trim(),
      group:     group?.trim()     || '3IV17', // Consecuente con tu grupo de Electrotecnia
      password:  hashedPassword, 
      active:    true // Se inicializa como un usuario activo por defecto
    });

    // Seguridad adicional: Removemos la contraseña del objeto antes de responder al cliente
    const respuestaSegura = { ...alumno };
    delete respuestaSegura.password;

    res.status(201).json(respuestaSegura);
  } catch (err) {
    next(err);
  }
});

// PATCH: Modificar parcialmente los datos de un alumno
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const alumno = await DB.getAlumnoById(id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

    // Campos cuya modificación controlada es segura
    const allowed = ['name', 'email', 'group', 'active'];
    const changes = {};
    
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        changes[key] = (typeof req.body[key] === 'string') ? req.body[key].trim() : req.body[key];
      }
    });

    const updated = await DB.updateAlumno(id, changes);
    
    // Ocultar contraseña en la respuesta
    if (updated) delete updated.password;

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE: Dar de baja un alumno de la base de datos
router.delete('/:id', async (req, res, next) => {
  try {
    const alumno = await DB.getAlumnoById(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
    
    await DB.deleteAlumno(req.params.id);
    res.json({ ok: true, message: `El estudiante "${alumno.name}" fue dado de baja exitosamente.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

module.exports = router;
