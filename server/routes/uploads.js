const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { SUBIDAS_DIR, asegurarDir, rutaRelativa } = require('../services/reportFiles');

// Las fotos llegan a reports/subidas; al guardar el reporte se mueven a reports/fotos/<folio>
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    asegurarDir(SUBIDAS_DIR);
    cb(null, SUBIDAS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

// No limits on file count or file size
const upload = multer({
  storage
  // Sin límite de tamaño de archivo
});

// Accept multiple fields, unlimited files per field
router.post('/images', [authMiddleware, upload.any()], async (req, res) => {
  try {
    const files = (req.files || []).map(f => ({
      field: f.fieldname,
      filename: f.filename,
      path: rutaRelativa(f.path),
      size: f.size,
      mimetype: f.mimetype
    }));

    res.json({ files });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error subiendo imágenes' });
  }
});

module.exports = router;
