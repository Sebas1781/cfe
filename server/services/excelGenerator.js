const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Generates an Excel (.xlsx) file for a report using key fields.
 * The layout follows a simple, clean tabular style resembling the workers' Excel.
 * @param {object} data - Report data from DB
 * @returns {Promise<string>} - Relative path to generated xlsx file
 */
async function generateXLSX(data) {
  // Ensure output directory exists
  const reportsDir = path.join(__dirname, '..', 'reports', 'generated');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const fileName = `reporte_${data.folio}_${Date.now()}.xlsx`;
  const filePath = path.join(reportsDir, fileName);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte CFE');

  // Styles
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00A859' } }; // CFE green
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003D7A' } }; // Deep blue
  const sectionHeaderFont = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Title
  ws.mergeCells('A1', 'F1');
  ws.getCell('A1').value = `COMISIÓN FEDERAL DE ELECTRICIDAD - Reporte ${data.folio}`;
  ws.getCell('A1').font = { size: 14, bold: true };

  // Basic info header
  ws.addRow([]);
  const h = ws.addRow(['Folio', 'Fecha', 'Trabajador', 'Tipo de Servicio', 'Ubicación', 'Descripción']);
  h.eachCell((cell) => { cell.fill = headerFill; cell.font = headerFont; });

  const fecha = data.fecha_mantenimiento || data.fecha || new Date().toISOString();
  const fechaDisplay = new Date(fecha).toLocaleDateString('es-MX');

  ws.addRow([
    data.folio || '',
    fechaDisplay,
    data.user_name || data.trabajador || '',
    data.tipo_mantenimiento || data.tipoServicio || '',
    data.direccion || data.ubicacion || '',
    data.observaciones || data.descripcion || ''
  ]);

  // Section: Ubicación y Coordenadas
  ws.addRow([]);
  const s1 = ws.addRow(['Ubicación y Coordenadas']);
  s1.getCell(1).fill = sectionHeaderFill; s1.getCell(1).font = sectionHeaderFont;
  ws.mergeCells(`A${s1.number}:F${s1.number}`);
  ws.addRow(['Dirección', data.direccion || '', 'Latitud', data.latitud || '', 'Longitud', data.longitud || '']);

  // Section: Radio/Gabinete
  ws.addRow([]);
  const s2 = ws.addRow(['Radio/Gabinete']);
  s2.getCell(1).fill = sectionHeaderFill; s2.getCell(1).font = sectionHeaderFont;
  ws.mergeCells(`A${s2.number}:F${s2.number}`);
  ws.addRow(['Radio/Gabinete', data.radio_gabinete || '', 'Potencia Salida', data.potencia_salida || '', 'RSSI', data.rssi || '']);
  ws.addRow(['Umbral Recepción', data.umbral_recepcion || '', 'Frecuencia (MHz)', data.frecuencia_mhz || '', 'RX', data.rx || '']);
  ws.addRow(['TX', data.tx || '', 'Cable Pigtail', data.cable_pigtail || '', 'Supresor', data.supresor || '']);
  ws.addRow(['Cable LT', data.cable_lt || '', 'Altura Antena', data.altura_antena || '', 'Repetidor Enlace', data.repetidor_enlace || '']);
  ws.addRow(['Canal UCM', data.canal_ucm || '', 'Modelo UTR', data.modelo_utr || '', 'Código Radio', data.codigo_radio || '']);

  // Section: Actividades
  ws.addRow([]);
  const s3 = ws.addRow(['Actividades']);
  s3.getCell(1).fill = sectionHeaderFill; s3.getCell(1).font = sectionHeaderFont;
  ws.mergeCells(`A${s3.number}:F${s3.number}`);
  const actividades = safeParseArray(data.actividades);
  if (actividades.length) {
    ws.addRow(['Actividad', 'Realizada']);
    ws.getRow(ws.lastRow.number).eachCell((c) => { c.fill = headerFill; c.font = headerFont; });
    actividades.forEach((act) => {
      ws.addRow([act.nombre || act.name || '', normalizeBool(act.realizada || act.done)]);
    });
  } else {
    ws.addRow(['Sin actividades registradas']);
    ws.mergeCells(`A${ws.lastRow.number}:F${ws.lastRow.number}`);
  }

  // Section: Mediciones Técnicas
  ws.addRow([]);
  const s4 = ws.addRow(['Mediciones Técnicas']);
  s4.getCell(1).fill = sectionHeaderFill; s4.getCell(1).font = sectionHeaderFont;
  ws.mergeCells(`A${s4.number}:F${s4.number}`);
  ws.addRow(['Potencia Radio', data.potencia_radio || '', 'Incidente', data.potencia_incidente || '', 'Reflejada', data.potencia_reflejada || '']);
  ws.addRow(['VSWR', data.vswr || '', 'Voltaje Acometida', data.voltaje_acometida || '', 'Resistencia Tierra', data.resistencia_tierra || '']);
  ws.addRow(['Voltaje Fuente', data.voltaje_fuente || '', 'Resistencia Batería', data.resistencia_bateria || '', '% Batería', data.porcentaje_bateria || '']);
  ws.addRow(['Ángulo Azimut', data.angulo_azimut || '', 'Calibre Bajante', data.calibre_bajante || '', '', '']);

  // Section: Materiales
  ws.addRow([]);
  const s5 = ws.addRow(['Materiales']);
  s5.getCell(1).fill = sectionHeaderFill; s5.getCell(1).font = sectionHeaderFont;
  ws.mergeCells(`A${s5.number}:F${s5.number}`);
  const materiales = safeParseArray(data.materiales);
  if (materiales.length) {
    ws.addRow(['Material', 'Cantidad', 'Observación']);
    ws.getRow(ws.lastRow.number).eachCell((c) => { c.fill = headerFill; c.font = headerFont; });
    materiales.forEach((m) => {
      ws.addRow([m.nombre || m.name || '', m.cantidad || m.qty || '', m.observacion || m.obs || '']);
    });
  } else {
    ws.addRow(['Sin materiales registrados']);
    ws.mergeCells(`A${ws.lastRow.number}:F${ws.lastRow.number}`);
  }

  // Footer
  ws.addRow([]);
  ws.addRow([`Generado: ${new Date().toLocaleString('es-MX')}`]);
  ws.addRow(['CFE - Todos los derechos reservados']);
  ws.getRow(ws.lastRow.number).alignment = { horizontal: 'left' };

  // Column widths for readability
  const widths = [22, 18, 22, 22, 26, 26];
  widths.forEach((w, i) => ws.getColumn(i + 1).width = w);

  await wb.xlsx.writeFile(filePath);
  console.log(`✅ XLSX generado: ${fileName}`);
  return `reports/generated/${fileName}`;
}

function safeParseArray(v) {
  try {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeBool(v) {
  if (v === true || v === 'true' || v === 1 || v === '1') return 'Sí';
  if (v === false || v === 'false' || v === 0 || v === '0') return 'No';
  return v ? String(v) : '';
}

module.exports = { generateXLSX };
