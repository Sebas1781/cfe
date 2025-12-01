const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'plataformaCFE.db');
const dbDir = path.dirname(dbPath);

// Crear directorio si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo base de datos:', err);
  } else {
    console.log('✅ Conectado a SQLite');
  }
});

// Promisify para usar async/await
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Crear tablas
const createTables = async () => {
  try {
    // Tabla de usuarios
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_trabajador TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'trabajador')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de reportes
    await run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folio TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        fecha DATE NOT NULL,
        ubicacion TEXT NOT NULL,
        tipo_servicio TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        materiales TEXT,
        observaciones TEXT,
        pdf_path TEXT,
        status TEXT DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'completado', 'revisado')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla de sincronización
    await run(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        form_data TEXT NOT NULL,
        synced BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ Tablas creadas exitosamente');
  } catch (error) {
    console.error('Error creando tablas:', error);
  }
};

// Insertar usuarios por defecto
const seedDefaultUsers = async () => {
  const bcrypt = require('bcrypt');
  
  try {
    const checkAdmin = await get('SELECT * FROM users WHERE numero_trabajador = ?', ['00001']);
    
    if (!checkAdmin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await run(
        'INSERT INTO users (numero_trabajador, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        ['00001', 'admin@cfe.com', hashedPassword, 'Administrador CFE', 'admin']
      );
      console.log('✅ Usuario admin creado: 00001 / admin123');
    }
    
    const checkWorker = await get('SELECT * FROM users WHERE numero_trabajador = ?', ['12345']);
    
    if (!checkWorker) {
      const hashedPassword = bcrypt.hashSync('12345', 10);
      await run(
        'INSERT INTO users (numero_trabajador, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        ['12345', 'trabajador@cfe.com', hashedPassword, 'Juan Pérez López', 'trabajador']
      );
      console.log('✅ Usuario trabajador creado: 12345 / 12345');
    }
  } catch (error) {
    console.error('Error creando usuarios:', error);
  }
};

// Inicializar
(async () => {
  await createTables();
  await seedDefaultUsers();
})();

module.exports = { db, run, get, all };

