const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'plataformaCFE.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error abriendo base de datos:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos\n');
});

// Configura aquí los datos del administrador
const ADMIN = {
  numero_trabajador: '00001',
  nombre_completo: 'Administrador CFE',
  password: process.env.ADMIN_PASSWORD,
  role: 'admin',
};

if (!ADMIN.password || ADMIN.password.length < 8) {
  console.error('❌ Define ADMIN_PASSWORD (mínimo 8 caracteres). Ej: ADMIN_PASSWORD=xxxxxxxx node seed-admin.js');
  process.exit(1);
}

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

(async () => {
  try {
    console.log('🌱 Iniciando seeder de administrador...\n');

    const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

    const existing = await get(
      'SELECT id, numero_trabajador, nombre_completo, role FROM users WHERE numero_trabajador = ?',
      [ADMIN.numero_trabajador]
    );

    if (existing) {
      // Actualizar contraseña y nombre si ya existe
      await run(
        `UPDATE users
         SET nombre_completo = ?, password = ?, role = ?, updated_at = CURRENT_TIMESTAMP
         WHERE numero_trabajador = ?`,
        [ADMIN.nombre_completo, hashedPassword, ADMIN.role, ADMIN.numero_trabajador]
      );
      console.log(`✅ Admin actualizado:`);
    } else {
      // Crear nuevo administrador
      await run(
        `INSERT INTO users (numero_trabajador, nombre_completo, password, role)
         VALUES (?, ?, ?, ?)`,
        [ADMIN.numero_trabajador, ADMIN.nombre_completo, hashedPassword, ADMIN.role]
      );
      console.log(`✅ Admin creado:`);
    }

    console.log(`   Número de trabajador : ${ADMIN.numero_trabajador}`);
    console.log(`   Nombre               : ${ADMIN.nombre_completo}`);
    console.log(`   Rol                  : ${ADMIN.role}`);

    // Mostrar todos los admins actuales
    const admins = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, numero_trabajador, nombre_completo, role, created_at FROM users WHERE role = ?',
        ['admin'],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log(`\n📋 Administradores en la base de datos (${admins.length}):`);
    admins.forEach((a) => {
      console.log(`   [${a.id}] ${a.numero_trabajador} — ${a.nombre_completo} (${a.created_at})`);
    });
  } catch (err) {
    console.error('❌ Error en el seeder:', err.message);
  } finally {
    db.close(() => {
      console.log('\n✅ Conexión cerrada.');
    });
  }
})();
