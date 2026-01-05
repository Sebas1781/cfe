const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

// Obtener opciones por categoría
router.get('/:categoria', authMiddleware, async (req, res) => {
  try {
    const { categoria } = req.params;
    const options = await db.all(
      'SELECT * FROM form_options WHERE categoria = ? ORDER BY valor ASC',
      [categoria]
    );
    res.json({ options });
  } catch (error) {
    console.error('Error al obtener opciones:', error);
    res.status(500).json({ error: 'Error al obtener opciones' });
  }
});

// Crear nueva opción
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { categoria, valor } = req.body;

    if (!categoria || !valor) {
      return res.status(400).json({ error: 'Categoría y valor son requeridos' });
    }

    // Verificar que no exista ya
    const existing = await db.get(
      'SELECT id FROM form_options WHERE categoria = ? AND valor = ?',
      [categoria, valor]
    );

    if (existing) {
      return res.status(400).json({ error: 'Esta opción ya existe' });
    }

    const result = await db.run(
      'INSERT INTO form_options (categoria, valor) VALUES (?, ?)',
      [categoria, valor]
    );

    res.json({
      message: 'Opción creada exitosamente',
      id: result.lastID
    });
  } catch (error) {
    console.error('Error al crear opción:', error);
    res.status(500).json({ error: 'Error al crear opción' });
  }
});

// Actualizar opción
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { valor } = req.body;

    if (!valor) {
      return res.status(400).json({ error: 'Valor es requerido' });
    }

    await db.run(
      'UPDATE form_options SET valor = ? WHERE id = ?',
      [valor, id]
    );

    res.json({ message: 'Opción actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar opción:', error);
    res.status(500).json({ error: 'Error al actualizar opción' });
  }
});

// Eliminar opción
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Verificar que sea admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    await db.run('DELETE FROM form_options WHERE id = ?', [id]);

    res.json({ message: 'Opción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar opción:', error);
    res.status(500).json({ error: 'Error al eliminar opción' });
  }
});

module.exports = router;
