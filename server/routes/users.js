const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { run, get, all } = require('../database/db');

// Obtener usuario por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Solo admin puede ver otros usuarios
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    
    const user = await get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Listar todos los usuarios (solo admin)
router.get('/', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const users = await all('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

module.exports = router;
