require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Crear directorios necesarios
const createDirectories = () => {
  const dirs = [
    './database',
    './reports/generated',
    './reports/templates',
    './reports/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Inicializar base de datos
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Middleware para agregar headers CORS a archivos estáticos
app.use('/reports', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Servir archivos estáticos (PDFs e imágenes)
app.use('/reports/generated', express.static(path.join(__dirname, 'reports/generated')));
app.use('/reports/temp', express.static(path.join(__dirname, 'reports/temp')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir el frontend (archivos estáticos de React)
if (process.env.NODE_ENV === 'production') {
  // Servir los archivos estáticos del build
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Para todas las rutas que no sean API, servir index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // En desarrollo, solo manejar 404 para rutas API
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.DB_PATH || './database/plataformaCFE.db'}`);
  console.log('\n📚 Endpoints disponibles:');
  console.log('   POST /api/auth/login');
  console.log('   POST /api/auth/register');
  console.log('   GET  /api/reports');
  console.log('   POST /api/reports/generate');
  console.log('   GET  /api/reports/:id/download');
  console.log('   GET  /api/health\n');
});

module.exports = app;
