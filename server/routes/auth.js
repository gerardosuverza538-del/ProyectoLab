'use strict';

const express = require('express');
const router  = express.Router();

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

    const user = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

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

  res.json(DEMO_USERS[0]);
  
});

module.exports = router;
