const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { run, get, all } = require('../database/db');
const { generatePDF } = require('../services/pdfGenerator');
const path = require('path');
const fs = require('fs');

// Obtener todos los reportes (con filtros)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, user_id, fecha_inicio, fecha_fin } = req.query;
    
    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];
    
    // Solo los trabajadores ven sus propios reportes
    if (req.user.role === 'trabajador') {
      query += ' AND user_id = ?';
      params.push(req.user.id);
    }
    
    if (status && status !== 'todos') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (fecha_inicio) {
      query += ' AND fecha >= ?';
      params.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      query += ' AND fecha <= ?';
      params.push(fecha_fin);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const reportes = await all(query, params);
    
    res.json({ reportes });
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

// Obtener un reporte específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await get('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role === 'trabajador' && reporte.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    
    res.json({ reporte });
  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

// Generar nuevo reporte (crear formulario + PDF)
router.post('/generate', [
  authMiddleware,
  body('folio').notEmpty(),
  body('fecha').isDate(),
  body('ubicacion').notEmpty(),
  body('tipoServicio').notEmpty(),
  body('descripcion').notEmpty().isLength({ min: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { folio, fecha, ubicacion, tipoServicio, descripcion, materiales, observaciones } = req.body;
    
    // Verificar si el folio ya existe
    const existingReport = await get('SELECT * FROM reports WHERE folio = ?', [folio]);
    if (existingReport) {
      return res.status(400).json({ error: 'El folio ya existe' });
    }
    
    // Insertar reporte en la base de datos
    const result = await run(
      `INSERT INTO reports (
        folio, user_id, user_name, fecha, ubicacion, 
        tipo_servicio, descripcion, materiales, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        folio,
        req.user.id,
        req.user.name,
        fecha,
        ubicacion,
        tipoServicio,
        descripcion,
        materiales || null,
        observaciones || null
      ]
    );
    
    const reportId = result.lastID;
    
    // Generar PDF
    try {
      const pdfPath = await generatePDF({
        id: reportId,
        folio,
        fecha,
        ubicacion,
        tipoServicio,
        descripcion,
        materiales,
        observaciones,
        trabajador: req.user.name,
        generadoEn: new Date().toLocaleString('es-MX')
      });
      
      // Actualizar ruta del PDF en la base de datos
      await run('UPDATE reports SET pdf_path = ? WHERE id = ?', [pdfPath, reportId]);
      
      res.status(201).json({
        message: 'Reporte generado exitosamente',
        reporte: {
          id: reportId,
          folio,
          pdf_path: pdfPath
        }
      });
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      // El reporte se creó pero no el PDF
      res.status(201).json({
        message: 'Reporte creado pero error al generar PDF',
        reporte: {
          id: reportId,
          folio,
          pdf_error: pdfError.message
        }
      });
    }
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Descargar PDF
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await get('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role === 'trabajador' && reporte.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    
    if (!reporte.pdf_path) {
      return res.status(404).json({ error: 'PDF no disponible' });
    }
    
    const pdfPath = path.join(__dirname, '..', reporte.pdf_path);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado' });
    }
    
    res.download(pdfPath, `reporte_${reporte.folio}.pdf`);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({ error: 'Error al descargar PDF' });
  }
});

// Actualizar estado del reporte (solo admin)
router.patch('/:id/status', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pendiente', 'completado', 'revisado'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    await run(
      'UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Eliminar reporte (solo admin)
router.delete('/:id', [authMiddleware, requireRole('admin')], async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await get('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (!reporte) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Eliminar PDF si existe
    if (reporte.pdf_path) {
      const pdfPath = path.join(__dirname, '..', reporte.pdf_path);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
    
    await run('DELETE FROM reports WHERE id = ?', [id]);
    
    res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({ error: 'Error al eliminar reporte' });
  }
});

module.exports = router;
