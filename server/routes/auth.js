const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { run, get, all } = require('../database/db');

// Login
router.post('/login', [
  body('numero_trabajador').isLength({ min: 5, max: 5 }).isNumeric(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { numero_trabajador, password } = req.body;
    
    // Buscar usuario por número de trabajador
    const user = await get('SELECT * FROM users WHERE numero_trabajador = ?', [numero_trabajador]);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        numero_trabajador: user.numero_trabajador,
        nombre_completo: user.nombre_completo,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        numero_trabajador: user.numero_trabajador,
        nombre_completo: user.nombre_completo,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Registro público deshabilitado: los usuarios los crea un admin en /api/users
router.post('/register', (req, res) => res.status(404).json({ error: 'Not found' }));

// Verificar token
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

module.exports = router;
