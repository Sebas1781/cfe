const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { run, get, all } = require('../database/db');

// Obtener todos los restauradores con cantidad de reportes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const restauradores = await all(`
      SELECT 
        r.*,
        COUNT(rep.id) as total_reportes
      FROM restauradores r
      LEFT JOIN reports rep ON r.id = rep.restaurador_id
      GROUP BY r.id
      ORDER BY r.nombre
    `);
    
    res.json(restauradores);
  } catch (error) {
    console.error('Error al obtener restauradores:', error);
    res.status(500).json({ error: 'Error al obtener restauradores' });
  }
});

// Obtener restaurador por ID con sus reportes
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurador = await get('SELECT * FROM restauradores WHERE id = ?', [id]);
    
    if (!restaurador) {
      return res.status(404).json({ error: 'Restaurador no encontrado' });
    }
    
    const reportes = await all(`
      SELECT 
        id,
        tipo_mantenimiento as tipo,
        status as estado,
        direccion,
        fecha_mantenimiento,
        responsable,
        created_at
      FROM reports 
      WHERE restaurador_id = ?
      ORDER BY fecha_mantenimiento DESC
    `, [id]);
    
    res.json({
      ...restaurador,
      reportes
    });
  } catch (error) {
    console.error('Error al obtener restaurador:', error);
    res.status(500).json({ error: 'Error al obtener restaurador' });
  }
});

// Buscar restaurador por código QR
router.get('/qr/:codigo', authMiddleware, async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const restaurador = await get('SELECT * FROM restauradores WHERE codigo_qr = ?', [codigo]);
    
    if (!restaurador) {
      return res.status(404).json({ error: 'Código QR no encontrado' });
    }
    
    // Obtener reportes del restaurador
    const reportes = await all(`
      SELECT 
        id,
        tipo_mantenimiento as tipo,
        status as estado,
        direccion,
        fecha_mantenimiento,
        responsable,
        created_at
      FROM reports 
      WHERE restaurador_id = ?
      ORDER BY fecha_mantenimiento DESC
      LIMIT 10
    `, [restaurador.id]);
    
    res.json({
      ...restaurador,
      reportes
    });
  } catch (error) {
    console.error('Error al buscar por código QR:', error);
    res.status(500).json({ error: 'Error al buscar por código QR' });
  }
});

// Crear nuevo restaurador
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nombre, latitud, longitud } = req.body;
    
    // Validaciones
    if (!nombre || !latitud || !longitud) {
      return res.status(400).json({ error: 'Nombre, latitud y longitud son requeridos' });
    }
    
    // Generar código QR único
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-5);
    const codigoQR = `REST-${fecha}-${timestamp}`;
    
    const result = await run(
      'INSERT INTO restauradores (nombre, latitud, longitud, codigo_qr) VALUES (?, ?, ?, ?)',
      [nombre, latitud, longitud, codigoQR]
    );
    
    const nuevoRestaurador = await get('SELECT * FROM restauradores WHERE id = ?', [result.lastID]);
    
    res.status(201).json(nuevoRestaurador);
  } catch (error) {
    console.error('Error al crear restaurador:', error);
    res.status(500).json({ error: 'Error al crear restaurador' });
  }
});

// Actualizar restaurador
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, latitud, longitud } = req.body;
    
    const restaurador = await get('SELECT id FROM restauradores WHERE id = ?', [id]);
    
    if (!restaurador) {
      return res.status(404).json({ error: 'Restaurador no encontrado' });
    }
    
    await run(
      'UPDATE restauradores SET nombre = ?, latitud = ?, longitud = ? WHERE id = ?',
      [nombre, latitud, longitud, id]
    );
    
    const restauradorActualizado = await get('SELECT * FROM restauradores WHERE id = ?', [id]);
    
    res.json(restauradorActualizado);
  } catch (error) {
    console.error('Error al actualizar restaurador:', error);
    res.status(500).json({ error: 'Error al actualizar restaurador' });
  }
});

// Eliminar restaurador
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurador = await get('SELECT id FROM restauradores WHERE id = ?', [id]);
    
    if (!restaurador) {
      return res.status(404).json({ error: 'Restaurador no encontrado' });
    }
    
    await run('DELETE FROM restauradores WHERE id = ?', [id]);
    
    res.json({ message: 'Restaurador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar restaurador:', error);
    res.status(500).json({ error: 'Error al eliminar restaurador' });
  }
});

module.exports = router;
