const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const generatePDF = async (data) => {
  let browser;
  
  try {
    // Crear directorio de reportes si no existe
    const reportsDir = path.join(__dirname, '..', 'reports', 'generated');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Nombre del archivo PDF
    const fileName = `reporte_${data.folio}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    // HTML del reporte
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte CFE - ${data.folio}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      color: #333;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #003d7a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #003d7a;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-item {
      padding: 15px;
      background: #f5f5f5;
      border-left: 4px solid #003d7a;
    }
    
    .info-item label {
      font-weight: bold;
      color: #003d7a;
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    .info-item .value {
      font-size: 16px;
      color: #333;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      color: #003d7a;
      border-bottom: 2px solid #003d7a;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .section-content {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
      white-space: pre-wrap;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #ccc;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .signature-section {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMISIÓN FEDERAL DE ELECTRICIDAD</h1>
    <p class="subtitle">Reporte de Servicio Técnico</p>
  </div>
  
  <div class="info-grid">
    <div class="info-item">
      <label>Folio</label>
      <div class="value">${data.folio}</div>
    </div>
    <div class="info-item">
      <label>Fecha</label>
      <div class="value">${new Date(data.fecha).toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</div>
    </div>
    <div class="info-item">
      <label>Trabajador</label>
      <div class="value">${data.trabajador}</div>
    </div>
    <div class="info-item">
      <label>Tipo de Servicio</label>
      <div class="value">${data.tipoServicio}</div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Ubicación del Servicio</h2>
    <div class="section-content">${data.ubicacion}</div>
  </div>
  
  <div class="section">
    <h2 class="section-title">Descripción del Trabajo Realizado</h2>
    <div class="section-content">${data.descripcion}</div>
  </div>
  
  ${data.materiales ? `
  <div class="section">
    <h2 class="section-title">Materiales Utilizados</h2>
    <div class="section-content">${data.materiales}</div>
  </div>
  ` : ''}
  
  ${data.observaciones ? `
  <div class="section">
    <h2 class="section-title">Observaciones</h2>
    <div class="section-content">${data.observaciones}</div>
  </div>
  ` : ''}
  
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">
        <strong>${data.trabajador}</strong><br>
        Trabajador
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <strong>Supervisor</strong><br>
        CFE
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>Documento generado el ${data.generadoEn}</p>
    <p>Comisión Federal de Electricidad - Todos los derechos reservados</p>
  </div>
</body>
</html>
    `;
    
    // Generar PDF con Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    console.log(`✅ PDF generado: ${fileName}`);
    
    // Retornar ruta relativa
    return `reports/generated/${fileName}`;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error generando PDF:', error);
    throw error;
  }
};

module.exports = { generatePDF };
