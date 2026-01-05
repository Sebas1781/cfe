const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { run, get, all } = require('../database/db');
const { generatePDF } = require('../services/pdfGenerator');
const { generateXLSX } = require('../services/excelGenerator');
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
  body('tipoMantenimiento').optional(),
  body('modeloUTR').optional(),
  body('fechaMantenimiento').optional().isDate(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const formData = req.body;
    
    // Generar folio automático si no viene
    const folio = formData.folio || `CFE-${Date.now()}`;
    
    // Verificar si el folio ya existe
    const existingReport = await get('SELECT * FROM reports WHERE folio = ?', [folio]);
    if (existingReport) {
      return res.status(400).json({ error: 'El folio ya existe' });
    }
    
    // Insertar reporte en la base de datos con TODOS los campos
    const result = await run(
      `INSERT INTO reports (
        folio, user_id, user_name,
        tipo_mantenimiento, modelo_utr, fecha_mantenimiento, hora_inicio, hora_termino,
        responsable, licencia, registro, restaurador, restaurador_id, circuito, area,
        latitud, longitud, direccion,
        radio_gabinete, potencia_salida, rssi, umbral_recepcion,
        frecuencia_mhz, rx, tx, cable_pigtail, supresor, cable_lt,
        altura_antena, repetidor_enlace, canal_ucm,
        actividades,
        potencia_radio, potencia_incidente, potencia_reflejada, vswr,
        voltaje_acometida, resistencia_tierra, voltaje_fuente,
        resistencia_bateria, porcentaje_bateria, angulo_azimut,
        materiales, calibre_bajante, observaciones,
        fotografias, codigo_radio
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?
      )`,
      [
        folio,
        req.user.id,
        req.user.nombre_completo,
        // Información Básica
        formData.tipoMantenimiento || null,
        formData.modeloUTR || null,
        formData.fechaMantenimiento || null,
        formData.horaInicio || null,
        formData.horaTermino || null,
        formData.responsable || null,
        formData.licencia || null,
        formData.registro || null,
        formData.restaurador || null,
        formData.restaurador_id || null,
        formData.circuito || null,
        formData.area || null,
        formData.latitud || null,
        formData.longitud || null,
        formData.direccion || null,
        // Radio/Gabinete
        formData.radioGabinete || null,
        formData.potenciaSalida || null,
        formData.rssi || null,
        formData.umbralRecepcion || null,
        formData.frecuenciaMhz || null,
        formData.rx || null,
        formData.tx || null,
        formData.cablePigtail || null,
        formData.supresor || null,
        formData.cableLT || null,
        formData.alturaAntena || null,
        formData.repetidorEnlace || null,
        formData.canalUCM || null,
        // Actividades (JSON)
        formData.actividades ? JSON.stringify(formData.actividades) : null,
        // Mediciones Técnicas
        formData.potenciaRadio || null,
        formData.potenciaIncidente || null,
        formData.potenciaReflejada || null,
        formData.vswr || null,
        formData.voltajeAcometida || null,
        formData.resistenciaTierra || null,
        formData.voltajeFuente || null,
        formData.resistenciaBateria || null,
        formData.porcentajeBateria || null,
        formData.anguloAzimut || null,
        // Materiales y Observaciones
        formData.materiales ? JSON.stringify(formData.materiales) : null,
        formData.calibreBajante || null,
        formData.observaciones || null,
        // Fotografías (JSON)
        formData.fotografias ? JSON.stringify(formData.fotografias) : null,
        formData.codigoRadio || null
      ]
    );
    
    const reportId = result.lastID;
    
    // Generar PDF con todos los campos
    try {
      const pdfPath = await generatePDF({
        ...formData,
        folio,
        user_name: req.user.name,
        fecha: formData.fechaMantenimiento || new Date().toISOString()
      });
      await run('UPDATE reports SET pdf_path = ? WHERE id = ?', [pdfPath, reportId]);
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
    }
    
    res.status(201).json({
      message: 'Reporte generado exitosamente',
      reporte: {
        id: reportId,
        folio
      }
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error al generar reporte', details: error.message });
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

// Actualizar reporte completo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;
    
    // Verificar que el reporte existe
    const existingReport = await get('SELECT * FROM reports WHERE id = ?', [id]);
    if (!existingReport) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    // Verificar permisos
    if (req.user.role === 'trabajador' && existingReport.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    
    // Actualizar todos los campos
    await run(
      `UPDATE reports SET
        tipo_mantenimiento = ?, modelo_utr = ?, fecha_mantenimiento = ?, hora_inicio = ?, hora_termino = ?,
        responsable = ?, licencia = ?, registro = ?, restaurador = ?, circuito = ?, area = ?,
        latitud = ?, longitud = ?, direccion = ?,
        radio_gabinete = ?, potencia_salida = ?, rssi = ?, umbral_recepcion = ?, frecuencia_mhz = ?,
        rx = ?, tx = ?, cable_pigtail = ?, supresor = ?, cable_lt = ?, altura_antena = ?,
        repetidor_enlace = ?, canal_ucm = ?, actividades = ?,
        potencia_radio = ?, potencia_incidente = ?, potencia_reflejada = ?, vswr = ?,
        voltaje_acometida = ?, resistencia_tierra = ?, voltaje_fuente = ?, resistencia_bateria = ?,
        porcentaje_bateria = ?, angulo_azimut = ?, materiales = ?, calibre_bajante = ?,
        observaciones = ?, fotografias = ?, codigo_radio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        formData.tipoMantenimiento || null,
        formData.modeloUTR || null,
        formData.fechaMantenimiento || null,
        formData.horaInicio || null,
        formData.horaTermino || null,
        formData.responsable || null,
        formData.licencia || null,
        formData.registro || null,
        formData.restaurador || null,
        formData.circuito || null,
        formData.area || null,
        formData.latitud || null,
        formData.longitud || null,
        formData.direccion || null,
        formData.radioGabinete || null,
        formData.potenciaSalida || null,
        formData.rssi || null,
        formData.umbralRecepcion || null,
        formData.frecuenciaMhz || null,
        formData.rx || null,
        formData.tx || null,
        formData.cablePigtail || null,
        formData.supresor || null,
        formData.cableLT || null,
        formData.alturaAntena || null,
        formData.repetidorEnlace || null,
        formData.canalUCM || null,
        formData.actividades ? JSON.stringify(formData.actividades) : null,
        formData.potenciaRadio || null,
        formData.potenciaIncidente || null,
        formData.potenciaReflejada || null,
        formData.vswr || null,
        formData.voltajeAcometida || null,
        formData.resistenciaTierra || null,
        formData.voltajeFuente || null,
        formData.resistenciaBateria || null,
        formData.porcentajeBateria || null,
        formData.anguloAzimut || null,
        formData.materiales ? JSON.stringify(formData.materiales) : null,
        formData.calibreBajante || null,
        formData.observaciones || null,
        formData.fotografias ? JSON.stringify(formData.fotografias) : null,
        formData.codigoRadio || null,
        id
      ]
    );
    
    // Regenerar PDF
    try {
      const pdfPath = await generatePDF({
        ...formData,
        folio: existingReport.folio,
        user_name: req.user.name,
        fecha: formData.fechaMantenimiento || existingReport.fecha_mantenimiento
      });
      await run('UPDATE reports SET pdf_path = ? WHERE id = ?', [pdfPath, id]);
    } catch (pdfError) {
      console.error('Error regenerando PDF:', pdfError);
    }
    
    res.json({ message: 'Reporte actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar reporte:', error);
    res.status(500).json({ error: 'Error al actualizar reporte', details: error.message });
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

// Exportar reporte a XLSX
router.get('/:id/export/xlsx', authMiddleware, async (req, res) => {
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

    // Generar XLSX en disco y devolver como descarga
    const xlsxRelPath = await generateXLSX(reporte);
    const xlsxAbsPath = path.join(__dirname, '..', xlsxRelPath);

    if (!fs.existsSync(xlsxAbsPath)) {
      return res.status(404).json({ error: 'Archivo XLSX no encontrado' });
    }

    res.download(xlsxAbsPath, `reporte_${reporte.folio}.xlsx`);
  } catch (error) {
    console.error('Error al exportar XLSX:', error);
    res.status(500).json({ error: 'Error al exportar XLSX' });
  }
});

module.exports = router;
