const path = require('path');
const fs = require('fs');

// Estructura de archivos de reportes:
//   reports/subidas/            fotos recién subidas, aún sin reporte
//   reports/fotos/<folio>/      fotos de cada reporte (<campo>_<n>.<ext>)
//   reports/pdf/<folio>.pdf     PDF de cada reporte
//   reports/excel/<folio>.xlsx  Excel de cada reporte
const SERVER_DIR = path.join(__dirname, '..');
const REPORTS_DIR = path.join(SERVER_DIR, 'reports');
const SUBIDAS_DIR = path.join(REPORTS_DIR, 'subidas');
const FOTOS_DIR = path.join(REPORTS_DIR, 'fotos');
const PDF_DIR = path.join(REPORTS_DIR, 'pdf');
const EXCEL_DIR = path.join(REPORTS_DIR, 'excel');
// Carpeta anterior de subidas (reportes creados antes de este orden)
const LEGACY_TEMP_DIR = path.join(REPORTS_DIR, 'temp');

// El folio se usa como nombre de carpeta/archivo: solo caracteres seguros
const folioSeguro = (folio) => String(folio).replace(/[^A-Za-z0-9_-]/g, '_');

const campoSeguro = (campo) => String(campo).replace(/[^A-Za-z0-9_-]/g, '_') || 'foto';

// Ruta relativa al servidor (lo que se guarda en la BD), con "/" siempre
const rutaRelativa = (abs) => path.relative(SERVER_DIR, abs).split(path.sep).join('/');

const estaDentro = (abs, dir) => abs.startsWith(dir + path.sep);

const asegurarDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const carpetaFotos = (folio) => path.join(FOTOS_DIR, folioSeguro(folio));
const rutaPDF = (folio) => path.join(PDF_DIR, `${folioSeguro(folio)}.pdf`);
const rutaExcel = (folio) => path.join(EXCEL_DIR, `${folioSeguro(folio)}.xlsx`);

// Siguiente nombre libre <campo>_<n><ext> dentro de la carpeta del reporte
const siguienteNombre = (dir, campo, ext) => {
  let n = 1;
  while (fs.existsSync(path.join(dir, `${campo}_${n}${ext}`))) n++;
  return path.join(dir, `${campo}_${n}${ext}`);
};

const moverArchivo = (origen, destino) => {
  try {
    fs.renameSync(origen, destino);
  } catch (err) {
    if (err.code !== 'EXDEV') throw err;
    fs.copyFileSync(origen, destino);
    fs.unlinkSync(origen);
  }
};

/**
 * Mueve las fotos recién subidas de un reporte a reports/fotos/<folio>/
 * y devuelve el objeto fotografias con las rutas nuevas.
 * Solo mueve archivos de reports/subidas o reports/temp; las fotos que ya
 * están en la carpeta del reporte (o rutas desconocidas) se dejan igual.
 */
const organizarFotos = (folio, fotografias) => {
  if (!fotografias) return fotografias;
  let fotos = fotografias;
  if (typeof fotos === 'string') {
    try { fotos = JSON.parse(fotos); } catch { return fotografias; }
  }
  if (typeof fotos !== 'object') return fotografias;

  const destinoDir = carpetaFotos(folio);
  const resultado = {};

  for (const [campo, rutas] of Object.entries(fotos)) {
    if (!Array.isArray(rutas)) {
      resultado[campo] = rutas;
      continue;
    }
    resultado[campo] = rutas.map((ruta) => {
      if (typeof ruta !== 'string') return ruta;
      const abs = path.resolve(SERVER_DIR, ruta);
      const esSubida = estaDentro(abs, SUBIDAS_DIR) || estaDentro(abs, LEGACY_TEMP_DIR);
      if (!esSubida || !fs.existsSync(abs)) return ruta;

      asegurarDir(destinoDir);
      const ext = path.extname(abs).toLowerCase();
      const destino = siguienteNombre(destinoDir, campoSeguro(campo), ext);
      moverArchivo(abs, destino);
      return rutaRelativa(destino);
    });
  }
  return resultado;
};

// Borra la carpeta de fotos, el PDF y el Excel de un reporte
const eliminarArchivosReporte = (folio, pdfPath) => {
  const dir = carpetaFotos(folio);
  if (estaDentro(dir, FOTOS_DIR) && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const archivo of [rutaPDF(folio), rutaExcel(folio)]) {
    if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
  }
  // PDF con ruta anterior (reports/generated/...)
  if (pdfPath) {
    const abs = path.resolve(SERVER_DIR, pdfPath);
    if (estaDentro(abs, REPORTS_DIR) && fs.existsSync(abs)) fs.unlinkSync(abs);
  }
};

module.exports = {
  SERVER_DIR,
  REPORTS_DIR,
  SUBIDAS_DIR,
  FOTOS_DIR,
  PDF_DIR,
  EXCEL_DIR,
  LEGACY_TEMP_DIR,
  folioSeguro,
  carpetaFotos,
  rutaPDF,
  rutaExcel,
  rutaRelativa,
  asegurarDir,
  siguienteNombre,
  organizarFotos,
  eliminarArchivosReporte,
};
