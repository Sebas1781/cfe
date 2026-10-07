// Pasa los reportes existentes al orden reports/fotos/<folio>/ y reports/pdf/<folio>.pdf
//
// Uso (desde server/):
//   node organizar-reportes.js                         solo muestra lo que haría
//   node organizar-reportes.js --aplicar               lo hace (respalda antes la BD en ~/cfe-backups)
//   node organizar-reportes.js --origen /otra/server   busca también archivos en otra instalación (se copian)
const path = require('path');
const fs = require('fs');
const os = require('os');
const sqlite3 = require('sqlite3');
const {
  SERVER_DIR, FOTOS_DIR, SUBIDAS_DIR, LEGACY_TEMP_DIR, PDF_DIR,
  carpetaFotos, rutaPDF, rutaRelativa, asegurarDir, siguienteNombre,
} = require('./services/reportFiles');

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const origenes = [];
args.forEach((a, i) => { if (a === '--origen' && args[i + 1]) origenes.push(path.resolve(args[i + 1])); });

const DB_PATH = path.join(SERVER_DIR, 'database', 'plataformaCFE.db');
const db = new sqlite3.Database(DB_PATH);
const all = (sql, p = []) => new Promise((ok, ko) => db.all(sql, p, (e, r) => (e ? ko(e) : ok(r))));
const run = (sql, p = []) => new Promise((ok, ko) => db.run(sql, p, (e) => (e ? ko(e) : ok())));

const campoSeguro = (c) => String(c).replace(/[^A-Za-z0-9_-]/g, '_') || 'foto';
const dentro = (abs, dir) => abs.startsWith(dir + path.sep);

// Busca el archivo en este servidor y luego en las instalaciones de --origen
const buscar = (ruta) => {
  const local = path.resolve(SERVER_DIR, ruta);
  if (dentro(local, SERVER_DIR) && fs.existsSync(local)) return { abs: local, externo: false };
  for (const o of origenes) {
    const abs = path.resolve(o, ruta);
    if (dentro(abs, o) && fs.existsSync(abs)) return { abs, externo: true };
  }
  return null;
};

// Archivos locales de subidas se mueven; los de otra instalación o de reports/generated se copian
const transferir = ({ abs, externo }, destino) => {
  const mover = !externo && (dentro(abs, SUBIDAS_DIR) || dentro(abs, LEGACY_TEMP_DIR));
  if (aplicar) {
    asegurarDir(path.dirname(destino));
    if (mover) fs.renameSync(abs, destino);
    else fs.copyFileSync(abs, destino);
  }
  return mover ? 'mover' : 'copiar';
};

(async () => {
  console.log(aplicar ? '== Aplicando cambios ==' : '== Simulación (usa --aplicar para hacerlo) ==');

  if (aplicar) {
    const dir = path.join(os.homedir(), 'cfe-backups');
    asegurarDir(dir);
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const backup = path.join(dir, `plataformaCFE_antes-organizar_${ts}.db`);
    fs.copyFileSync(DB_PATH, backup);
    console.log(`Respaldo de la BD: ${backup}`);
  }

  const reportes = await all('SELECT id, folio, fotografias, pdf_path FROM reports ORDER BY id');
  let faltantes = 0;

  for (const r of reportes) {
    console.log(`\nReporte ${r.id} (${r.folio})`);
    let fotos = null;
    try { fotos = r.fotografias ? JSON.parse(r.fotografias) : null; } catch { console.log('  fotografias no es JSON válido, se omite'); }

    const carpeta = carpetaFotos(r.folio);
    // En simulación los archivos no se crean: se apartan los nombres para numerar bien
    const reservados = new Set();
    const nombreLibre = (campo, ext) => {
      let destino = siguienteNombre(carpeta, campo, ext);
      let n = 1;
      while (reservados.has(destino)) destino = path.join(carpeta, `${campo}_${++n}${ext}`);
      reservados.add(destino);
      return destino;
    };

    if (fotos && typeof fotos === 'object') {
      for (const [campo, rutas] of Object.entries(fotos)) {
        if (!Array.isArray(rutas)) continue;
        fotos[campo] = rutas.map((ruta) => {
          if (typeof ruta !== 'string') return ruta;
          if (dentro(path.resolve(SERVER_DIR, ruta), FOTOS_DIR)) return ruta; // ya ordenada
          const origen = buscar(ruta);
          if (!origen) { faltantes++; console.log(`  ⚠ no encontrada: ${ruta}`); return ruta; }
          const destino = nombreLibre(campoSeguro(campo), path.extname(origen.abs).toLowerCase());
          const accion = transferir(origen, destino);
          console.log(`  ${accion}: ${origen.abs} -> ${rutaRelativa(destino)}`);
          return rutaRelativa(destino);
        });
      }
    }

    let pdfPath = r.pdf_path;
    const pdfDestino = rutaPDF(r.folio);
    if (pdfPath && path.resolve(SERVER_DIR, pdfPath) !== pdfDestino) {
      const origen = buscar(pdfPath);
      if (!origen) { faltantes++; console.log(`  ⚠ PDF no encontrado: ${pdfPath}`); }
      else {
        asegurarDir(PDF_DIR);
        transferir({ ...origen, externo: true }, pdfDestino);
        console.log(`  copiar: ${origen.abs} -> ${rutaRelativa(pdfDestino)}`);
        pdfPath = rutaRelativa(pdfDestino);
      }
    }

    if (aplicar) {
      await run('UPDATE reports SET fotografias = ?, pdf_path = ? WHERE id = ?',
        [fotos ? JSON.stringify(fotos) : r.fotografias, pdfPath, r.id]);
    }
  }

  console.log(`\n${reportes.length} reporte(s) revisados, ${faltantes} archivo(s) no encontrados.`);
  if (!aplicar) console.log('Nada se modificó. Ejecuta con --aplicar para hacerlo.');
  db.close();
})().catch((e) => { console.error('Error:', e); db.close(); process.exit(1); });
