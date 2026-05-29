'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('../db');

const DEMO_USERS = [
  {
    id:       'tea-001',
    name:     'Prof. García',
    email:    'garcia@ipn.mx',
    password: '1234',
    role:     'teacher',
    group:    'G2',
    initials: 'PG',
  },
  {
    id:       'stu-001',
    name:     'Juan Méndez',
    email:    'mendez@ipn.mx',
    password: '1234',
    role:     'student',
    group:    'G2',
    initials: 'JM',
  },
];

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos.' });
    }

    let user = DEMO_USERS.find(
      u =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );

    if (!user) {
      const alumnos = await DB.getAlumnos();

      const alumno = alumnos.find(
        a =>
          a.email?.toLowerCase() === email.toLowerCase() &&
          String(a.password || '') === String(password)
      );

      if (alumno) {
        user = {
          id:       alumno.id,
          name:     alumno.name,
          email:    alumno.email,
          role:     'student',
          group:    alumno.grp,
          initials: alumno.name
            ?.split(' ')
            .map(x => x[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'AL',
        };
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = `demo-token-${user.id}-${Date.now()}`;
    const { password: _pw, ...safeUser } = user;

    res.json({ user: safeUser, token });

  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');

  const id = token.split('-').slice(2, -1).join('-');

  const demo = DEMO_USERS.find(u => u.id === id);
  if (demo) {
    const { password: _pw, ...safeUser } = demo;
    return res.json(safeUser);
  }

  res.json(DEMO_USERS[0]);
});

module.exports = router;
