const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { run, get, all } = require('../database/db');

// Listar todos los usuarios (solo admin)
router.get('/', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const users = await all('SELECT id, numero_trabajador, nombre_completo, role, created_at FROM users ORDER BY nombre_completo');
    res.json(users);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// Obtener usuario por ID (solo admin)
router.get('/:id', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    const user = await get('SELECT id, numero_trabajador, nombre_completo, role, created_at FROM users WHERE id = ?', [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// Crear nuevo usuario (solo admin)
router.post('/', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { numero_trabajador, nombre_completo, password, role = 'trabajador' } = req.body;

    // Validaciones
    if (!numero_trabajador || !nombre_completo || !password) {
      return res.status(400).json({ 
        message: 'Número de trabajador, nombre completo y contraseña son requeridos' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el número de trabajador ya existe
    const existingUser = await get(
      'SELECT id FROM users WHERE numero_trabajador = ?',
      [numero_trabajador]
    );

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Ya existe un usuario con ese número de trabajador' 
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const result = await run(
      'INSERT INTO users (numero_trabajador, nombre_completo, password, role) VALUES (?, ?, ?, ?)',
      [numero_trabajador, nombre_completo, hashedPassword, role]
    );

    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      id: result.lastID 
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// Actualizar usuario (solo admin)
router.put('/:id', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_trabajador, nombre_completo, password, role } = req.body;

    // Validaciones
    if (!numero_trabajador || !nombre_completo) {
      return res.status(400).json({ 
        message: 'Número de trabajador y nombre completo son requeridos' 
      });
    }

    // Verificar si el usuario existe
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el número de trabajador ya existe en otro usuario
    const duplicateUser = await get(
      'SELECT id FROM users WHERE numero_trabajador = ? AND id != ?',
      [numero_trabajador, id]
    );

    if (duplicateUser) {
      return res.status(400).json({ 
        message: 'Ya existe otro usuario con ese número de trabajador' 
      });
    }

    // Preparar query de actualización
    let query = 'UPDATE users SET numero_trabajador = ?, nombre_completo = ?';
    let params = [numero_trabajador, nombre_completo];

    // Si se proporcionó nueva contraseña
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    // Si se proporcionó role
    if (role) {
      query += ', role = ?';
      params.push(role);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await run(query, params);

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar al propio usuario
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        message: 'No puedes eliminar tu propio usuario' 
      });
    }

    // Verificar si el usuario existe
    const usuario = await get('SELECT id FROM users WHERE id = ?', [id]);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

module.exports = router;
