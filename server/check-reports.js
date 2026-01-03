const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'plataformaCFE.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT COUNT(*) as total FROM reports', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Total reportes:', rows[0].total);
  }
  
  db.all('SELECT id, folio, user_name, tipo_mantenimiento, fecha_mantenimiento FROM reports LIMIT 5', [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('\nPrimeros 5 reportes:');
      console.table(rows);
    }
    db.close();
  });
});
