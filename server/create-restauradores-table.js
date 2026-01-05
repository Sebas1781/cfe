const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'plataformaCFE.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Creando tabla de restauradores...\n');

db.serialize(() => {
  // Crear tabla restauradores
  db.run(`
    CREATE TABLE IF NOT EXISTS restauradores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      latitud REAL NOT NULL,
      longitud REAL NOT NULL,
      codigo_qr TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error al crear tabla restauradores:', err.message);
    } else {
      console.log('✓ Tabla restauradores creada correctamente');
    }
  });

  // Agregar columna restaurador_id a la tabla reports si no existe
  db.run(`
    ALTER TABLE reports ADD COLUMN restaurador_id INTEGER REFERENCES restauradores(id)
  `, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error al agregar columna restaurador_id:', err.message);
    } else if (err && err.message.includes('duplicate column')) {
      console.log('✓ Columna restaurador_id ya existe en reports');
    } else {
      console.log('✓ Columna restaurador_id agregada a reports');
    }
  });

  // Insertar algunos restauradores de ejemplo
  const restauradoresEjemplo = [
    { nombre: 'Restaurador Central A1', lat: 20.0876295, lng: -98.7674036 },
    { nombre: 'Restaurador Norte B2', lat: 20.0956295, lng: -98.7574036 },
    { nombre: 'Restaurador Sur C3', lat: 20.0796295, lng: -98.7774036 }
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO restauradores (nombre, latitud, longitud, codigo_qr)
    VALUES (?, ?, ?, ?)
  `);

  restauradoresEjemplo.forEach((rest, index) => {
    // Generar código QR único (formato: REST-YYYYMMDD-XXXXX)
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const codigoQR = `REST-${fecha}-${String(index + 1).padStart(5, '0')}`;
    
    insertStmt.run(rest.nombre, rest.lat, rest.lng, codigoQR, (err) => {
      if (err) {
        console.log(`⚠️  ${rest.nombre} ya existe o error: ${err.message}`);
      } else {
        console.log(`✓ Restaurador insertado: ${rest.nombre} (${codigoQR})`);
      }
    });
  });

  insertStmt.finalize();

  // Verificar resultados
  db.all('SELECT COUNT(*) as total FROM restauradores', [], (err, rows) => {
    if (err) {
      console.error('❌ Error al contar restauradores:', err.message);
    } else {
      console.log(`\n📊 Total de restauradores en la base de datos: ${rows[0].total}`);
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error al cerrar la base de datos:', err.message);
      } else {
        console.log('✓ Base de datos cerrada correctamente\n');
      }
    });
  });
});
