const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'plataformaCFE.db');
const db = new sqlite3.Database(dbPath);

console.log('Creando tabla form_options...');

db.serialize(() => {
  // Crear tabla de opciones de formulario
  db.run(`
    CREATE TABLE IF NOT EXISTS form_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL,
      valor TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(categoria, valor)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla:', err);
    } else {
      console.log('✓ Tabla form_options creada');
    }
  });

  // Insertar algunos valores por defecto
  const opcionesDefault = [
    // Tipo de mantenimiento
    { categoria: 'tipo_mantenimiento', valor: 'Preventivo' },
    { categoria: 'tipo_mantenimiento', valor: 'Correctivo' },
    { categoria: 'tipo_mantenimiento', valor: 'Predictivo' },
    
    // Modelo UTR
    { categoria: 'modelo_utr', valor: 'UTR-100' },
    { categoria: 'modelo_utr', valor: 'UTR-200' },
    { categoria: 'modelo_utr', valor: 'UTR-300' },
    
    // Circuito
    { categoria: 'circuito', valor: 'Circuito A' },
    { categoria: 'circuito', valor: 'Circuito B' },
    { categoria: 'circuito', valor: 'Circuito C' },
    
    // Área
    { categoria: 'area', valor: 'Norte' },
    { categoria: 'area', valor: 'Sur' },
    { categoria: 'area', valor: 'Este' },
    { categoria: 'area', valor: 'Oeste' },
    { categoria: 'area', valor: 'Centro' },
    
    // Frecuencia MHz (ejemplos)
    { categoria: 'frecuencia_mhz', valor: '150-174 MHz' },
    { categoria: 'frecuencia_mhz', valor: '400-470 MHz' },
    { categoria: 'frecuencia_mhz', valor: '806-870 MHz' },
    
    // RX
    { categoria: 'rx', valor: 'RX1' },
    { categoria: 'rx', valor: 'RX2' },
    
    // TX
    { categoria: 'tx', valor: 'TX1' },
    { categoria: 'tx', valor: 'TX2' },
    
    // Cable pigtail
    { categoria: 'cable_pigtail', valor: 'RG-58' },
    { categoria: 'cable_pigtail', valor: 'RG-213' },
    { categoria: 'cable_pigtail', valor: 'LMR-240' },
    
    // Supresor
    { categoria: 'supresor', valor: 'Supresor 150W' },
    { categoria: 'supresor', valor: 'Supresor 300W' },
    { categoria: 'supresor', valor: 'Supresor 500W' },
    
    // Cable de L.T.
    { categoria: 'cable_lt', valor: 'Cable #12 AWG' },
    { categoria: 'cable_lt', valor: 'Cable #10 AWG' },
    { categoria: 'cable_lt', valor: 'Cable #8 AWG' },
    
    // Repetidor de enlace
    { categoria: 'repetidor_enlace', valor: 'Si' },
    { categoria: 'repetidor_enlace', valor: 'No' },
    
    // Canal UCM
    { categoria: 'canal_ucm', valor: 'Canal 1' },
    { categoria: 'canal_ucm', valor: 'Canal 2' },
    { categoria: 'canal_ucm', valor: 'Canal 3' },
    { categoria: 'canal_ucm', valor: 'Canal 4' },
    
    // Modelos de gabinete
    { categoria: 'modelo_gabinete', valor: 'Gabinete Estándar' },
    { categoria: 'modelo_gabinete', valor: 'Gabinete Intemperie' },
    { categoria: 'modelo_gabinete', valor: 'Gabinete Rack 19"' },
    
    // Tipos de radio
    { categoria: 'tipo_radio', valor: 'Motorola GTR8000' },
    { categoria: 'tipo_radio', valor: 'Motorola SLR5700' },
    { categoria: 'tipo_radio', valor: 'Hytera RD985' },
    
    // Tipos de conector
    { categoria: 'tipo_conector', valor: 'N-Macho' },
    { categoria: 'tipo_conector', valor: 'N-Hembra' },
    { categoria: 'tipo_conector', valor: 'SMA' },
    { categoria: 'tipo_conector', valor: 'BNC' },
    
    // Tipos de cable
    { categoria: 'tipo_cable', valor: 'LMR-400' },
    { categoria: 'tipo_cable', valor: 'LMR-600' },
    { categoria: 'tipo_cable', valor: 'RG-213' },
    
    // Tipos de antena
    { categoria: 'tipo_antena', valor: 'Omnidireccional' },
    { categoria: 'tipo_antena', valor: 'Direccional' },
    { categoria: 'tipo_antena', valor: 'Yagi' },
    
    // Incidencias comunes
    { categoria: 'incidencias', valor: 'Placa con nomenclatura' },
    { categoria: 'incidencias', valor: 'Sellado de gabinete' },
    { categoria: 'incidencias', valor: 'Conexiones sueltas' },
    { categoria: 'incidencias', valor: 'Oxidación en conectores' }
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO form_options (categoria, valor) VALUES (?, ?)');
  
  opcionesDefault.forEach(opcion => {
    stmt.run(opcion.categoria, opcion.valor, (err) => {
      if (err) {
        console.error(`Error al insertar ${opcion.valor}:`, err);
      }
    });
  });
  
  stmt.finalize(() => {
    console.log('✓ Opciones por defecto insertadas');
    
    // Verificar
    db.all('SELECT categoria, COUNT(*) as total FROM form_options GROUP BY categoria', (err, rows) => {
      if (err) {
        console.error('Error al verificar:', err);
      } else {
        console.log('\nResumen de opciones:');
        rows.forEach(row => {
          console.log(`  - ${row.categoria}: ${row.total} opciones`);
        });
      }
      
      db.close(() => {
        console.log('\n✓ Tabla creada exitosamente');
        process.exit(0);
      });
    });
  });
});
