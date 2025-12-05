const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const generatePDF = async (data) => {
  let browser;
  
  try {
    console.log('🔍 Datos recibidos para PDF:', {
      folio: data.folio,
      fotografias: data.fotografias,
      tipoFotografias: typeof data.fotografias
    });
    
    // Crear directorio de reportes si no existe
    const reportsDir = path.join(__dirname, '..', 'reports', 'generated');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Nombre del archivo PDF
    const fileName = `reporte_${data.folio}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Procesar fotograf�as
    const fotosHTML = (fieldName, label) => {
      try {
        let fotos = data.fotografias;
        
        // Si fotografias es string JSON, parsearlo
        if (typeof fotos === 'string') {
          fotos = JSON.parse(fotos);
        }
        
        console.log(`📸 Procesando fotos para ${fieldName}:`, fotos?.[fieldName]);
        
        // Obtener las fotos del campo espec�fico
        const fotosDelCampo = fotos?.[fieldName];
        
        if (!fotosDelCampo || !Array.isArray(fotosDelCampo) || fotosDelCampo.length === 0) {
          console.log(`⚠️ No hay fotos para ${fieldName}`);
          return '';
        }
        
        const htmlArray = fotosDelCampo.map(fotoPath => {
          const absolutePath = path.join(__dirname, '..', fotoPath);
          console.log(`  Buscando imagen en: ${absolutePath}`);
          if (fs.existsSync(absolutePath)) {
            const base64 = fs.readFileSync(absolutePath).toString('base64');
            const ext = path.extname(fotoPath).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
            console.log(`  ✅ Imagen encontrada: ${fotoPath}`);
            return `<div class="photo-cell">
              <img src="data:${mime};base64,${base64}" alt="${label}">
              <div class="photo-label">${label}</div>
            </div>`;
          } else {
            console.log(`  ❌ Imagen NO encontrada: ${absolutePath}`);
          }
          return '';
        });
        
        return htmlArray.join('');
      } catch (error) {
        console.error(`Error procesando fotos para ${fieldName}:`, error);
        return '';
      }
    };

    const logoPath1 = path.join(__dirname, '..', '..', 'public', 'IMAGES', 'logocfeCMYK.png');
    const logoPath2 = path.join(__dirname, '..', '..', 'public', 'IMAGES', 'suterm.png');
    const logo1Base64 = fs.existsSync(logoPath1) ? fs.readFileSync(logoPath1).toString('base64') : '';
    const logo2Base64 = fs.existsSync(logoPath2) ? fs.readFileSync(logoPath2).toString('base64') : '';
    
    // HTML del reporte formato CFE
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 8px; }
    .page { padding: 15px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
    .header-center { text-align: center; flex: 1; }
    .header-center h1 { font-size: 10px; font-weight: bold; margin: 2px 0; }
    .header-center p { font-size: 7px; margin: 1px 0; }
    .logo { width: 80px; height: auto; }
    .section-title { background: #333; color: white; padding: 4px 8px; font-weight: bold; font-size: 8px; margin: 8px 0 4px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 4px 0; }
    table, th, td { border: 1px solid #000; }
    th, td { padding: 3px 5px; font-size: 7px; }
    th { background: #e0e0e0; font-weight: bold; text-align: left; }
    .col-label { width: 30%; font-weight: bold; background: #f5f5f5; }
    .checkbox-table td { text-align: center; }
    .footer { margin-top: 10px; font-size: 6px; text-align: center; border-top: 1px solid #000; padding-top: 5px; }
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; page-break-inside: avoid; }
    .photo-cell { text-align: center; page-break-inside: avoid; }
    .photo-cell img { width: 100%; max-height: 150px; object-fit: cover; border: 1px solid #ccc; }
    .photo-label { font-size: 7px; margin-top: 3px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      ${logo1Base64 ? `<img src="data:image/png;base64,${logo1Base64}" class="logo" alt="CFE">` : ''}
      <div class="header-center">
        <h1>COMISION FEDERAL DE ELECTRICIDAD</h1>
        <p>DIVISIÓN DE DISTRIBUCIÓN CENTRO ORIENTE</p>
        <p>SUBGERENCIA DE DISTRIBUCIÓN</p>
        <p>ZONA PACHUCA</p>
        <p><strong>COMUNICACIONES</strong></p>
        <p>FORMATO DE MANTENIMIENTO RADIOS DATOS</p>
      </div>
      ${logo2Base64 ? `<img src="data:image/png;base64,${logo2Base64}" class="logo" alt="SUTERM">` : ''}
    </div>

    <!-- Información basica -->
    <div class="section-title">REPORTE DE MANTENIMIENTO - UNIDAD TERMINAL REMOTA DE POSTE</div>
    <table>
      <tr><th colspan="2">MODELO</th><th colspan="2">MANTENIMIENTO PREVENTIVO</th></tr>
      <tr><td colspan="2">${data.modelo_utr || data.modeloUTR || 'Arteche Smart P500'}</td><td colspan="2">X</td></tr>
    </table>

    <div class="section-title">INFORMACIÓN BASICA</div>
    <table>
      <tr>
        <td class="col-label">Restaurador:</td><td>${data.restaurador || ''}</td>
        <td class="col-label">Responsable:</td><td>${data.responsable || data.user_name || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Circuito:</td><td>${data.circuito || ''}</td>
        <td class="col-label">Fecha:</td><td>${data.fecha_mantenimiento || data.fechaMantenimiento ? new Date(data.fecha_mantenimiento || data.fechaMantenimiento).toLocaleDateString('es-MX') : ''}</td>
      </tr>
      <tr>
        <td class="col-label">Area:</td><td>${data.area || 'Pachuca'}</td>
        <td class="col-label">Registro:</td><td>${data.registro || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Dirección:</td><td colspan="3">${data.direccion || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Latitud:</td><td>${data.latitud || ''}</td>
        <td class="col-label">Licencia:</td><td>${data.licencia || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Longitud:</td><td>${data.longitud || ''}</td>
        <td class="col-label">Hora de inicio:</td><td>${data.hora_inicio || data.horaInicio || ''}</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="col-label">Hora de término:</td><td>${data.hora_termino || data.horaTermino || ''}</td>
      </tr>
    </table>

    <!-- Sistema de comunicaciones -->
    <div class="section-title">INFORMACIÓN BÁSICA DE SISTEMA DE COMUNICACIONES</div>
    <table>
      <tr>
        <td class="col-label">NS Radio/Gabinete:</td><td>${data.radio_gabinete || data.radioGabinete || ''}</td>
        <td class="col-label">Cable pigtail:</td><td>${data.cable_pigtail || data.cablePigtail || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Potencia de Salida W:</td><td>${data.potencia_salida || data.potenciaSalida || ''}</td>
        <td class="col-label">Supresor:</td><td>${data.supresor || ''}</td>
      </tr>
      <tr>
        <td class="col-label">RSSI (dBm):</td><td>${data.rssi || ''}</td>
        <td class="col-label">Cable de L.T.:</td><td>${data.cable_lt || data.cableLT || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Umbral de recepción:</td><td>${data.umbral_recepcion || data.umbralRecepcion || ''}</td>
        <td class="col-label">Antena:</td><td>${data.altura_antena || data.alturaAntena || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Frecuencia Mhz:</td><td>${data.frecuencia_mhz || data.frecuenciaMhz || ''}</td>
        <td class="col-label">Altura de Antena (m):</td><td>${data.altura_antena || data.alturaAntena || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Rx:</td><td>${data.rx || ''}</td>
        <td class="col-label">Repetidor de Enlace:</td><td>${data.repetidor_enlace || data.repetidorEnlace || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Tx:</td><td>${data.tx || ''}</td>
        <td class="col-label">Canal UCM:</td><td>${data.canal_ucm || data.canalUCM || ''}</td>
      </tr>
    </table>

    <!-- Mediciones -->
    <div class="section-title">MEDICIONES</div>
    <table>
      <tr>
        <td class="col-label">Potencia de radio W:</td><td>${data.potencia_radio || data.potenciaRadio || ''}</td>
        <td class="col-label">Voltaje fuente Vcd:</td><td>${data.voltaje_fuente || data.voltajeFuente || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Potencia incidente W:</td><td>${data.potencia_incidente || data.potenciaIncidente || ''}</td>
        <td class="col-label">Corriente fuente A:</td><td></td>
      </tr>
      <tr>
        <td class="col-label">Potencia reflejada W:</td><td>${data.potencia_reflejada || data.potenciaReflejada || ''}</td>
        <td class="col-label">Voltaje batería Vcd:</td><td>${data.porcentaje_bateria || data.porcentajeBateria || ''}</td>
      </tr>
      <tr>
        <td class="col-label">VSWR:</td><td>${data.vswr || ''}</td>
        <td class="col-label">Resistencia batería mO:</td><td>${data.resistencia_bateria || data.resistenciaBateria || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Voltaje acometida:</td><td>${data.voltaje_acometida || data.voltajeAcometida || ''}</td>
        <td class="col-label">% de vida batería:</td><td>${data.porcentaje_bateria || data.porcentajeBateria || ''}</td>
      </tr>
      <tr>
        <td class="col-label">Resistencia de Tierra:</td><td>${data.resistencia_tierra || data.resistenciaTierra || ''}</td>
        <td class="col-label">Ángulo de Azimut:</td><td>${data.angulo_azimut || data.anguloAzimut || ''}</td>
      </tr>
    </table>

    <!-- Mantenimiento a Sistema de Comunicaciones -->
    <div class="section-title">MANTENIMIENTO A SISTEMA DE COMUNICACIONES</div>
    <table class="checkbox-table">
      <tr>
        <th></th><th>Sí</th><th>No</th><th></th><th>Sí</th><th>No</th>
      </tr>
      ${(() => {
        const parseActividades = () => {
          try {
            let act = data.actividades;
            if (typeof act === 'string') act = JSON.parse(act);
            return Array.isArray(act) ? act : [];
          } catch { return []; }
        };
        const actividades = parseActividades();
        const tiene = (nombre) => actividades.some(a => a.toLowerCase().includes(nombre.toLowerCase()));
        
        return `
        <tr>
          <td class="col-label">Fotografías de manto:</td>
          <td>${tiene('fotografía') ? 'X' : ''}</td>
          <td>${!tiene('fotografía') ? 'X' : ''}</td>
          <td class="col-label">Impermeabilización de conectores:</td>
          <td>${tiene('impermeabilización') ? 'X' : ''}</td>
          <td>${!tiene('impermeabilización') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Mediciones de RF:</td>
          <td>${tiene('mediciones de rf') ? 'X' : ''}</td>
          <td>${!tiene('mediciones de rf') ? 'X' : ''}</td>
          <td class="col-label">Redireccionamiento de antena:</td>
          <td>${tiene('redireccionamiento') ? 'X' : ''}</td>
          <td>${!tiene('redireccionamiento') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Mediciones de fuente de CD:</td>
          <td>${tiene('fuente de cd') ? 'X' : ''}</td>
          <td>${!tiene('fuente de cd') ? 'X' : ''}</td>
          <td class="col-label">Cambio de L.T.:</td>
          <td>${tiene('cambio de l.t') ? 'X' : ''}</td>
          <td>${!tiene('cambio de l.t') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Medición de batería:</td>
          <td>${tiene('batería') ? 'X' : ''}</td>
          <td>${!tiene('batería') ? 'X' : ''}</td>
          <td class="col-label">Cambio de supresor:</td>
          <td>${tiene('cambio de supresor') ? 'X' : ''}</td>
          <td>${!tiene('cambio de supresor') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Limpieza de radio, conectores y supresor:</td>
          <td>${tiene('limpieza') ? 'X' : ''}</td>
          <td>${!tiene('limpieza') ? 'X' : ''}</td>
          <td class="col-label">Cambio de pigtail:</td>
          <td>${tiene('pigtail') ? 'X' : ''}</td>
          <td>${!tiene('pigtail') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Ajuste de tornillería:</td>
          <td>${tiene('tornillería') ? 'X' : ''}</td>
          <td>${!tiene('tornillería') ? 'X' : ''}</td>
          <td class="col-label">Cambio de radio:</td>
          <td>${tiene('cambio de radio') ? 'X' : ''}</td>
          <td>${!tiene('cambio de radio') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Cambio de antena:</td>
          <td>${tiene('antena') ? 'X' : ''}</td>
          <td>${!tiene('antena') ? 'X' : ''}</td>
          <td class="col-label">Cambio de Conectores:</td>
          <td>${tiene('conectores') ? 'X' : ''}</td>
          <td>${!tiene('conectores') ? 'X' : ''}</td>
        </tr>`;
      })()}
    </table>

    <!-- Instalación de Equipo -->
    <div class="section-title">INSTALACIÓN DE EQUIPO</div>
    <table class="checkbox-table">
      <tr>
        <th></th><th>Sí</th><th>No</th><th></th><th>Sí</th><th>No</th>
      </tr>
      ${(() => {
        const parseMateriales = () => {
          try {
            let mat = data.materiales;
            if (typeof mat === 'string') mat = JSON.parse(mat);
            return Array.isArray(mat) ? mat : [];
          } catch { return []; }
        };
        const materiales = parseMateriales();
        const tiene = (nombre) => materiales.some(m => typeof m === 'string' ? m.toLowerCase().includes(nombre.toLowerCase()) : false);
        
        return `
        <tr>
          <td class="col-label">Placa con nomenclatura:</td>
          <td>${tiene('placa') ? 'X' : ''}</td>
          <td>${!tiene('placa') ? 'X' : ''}</td>
          <td class="col-label">Bajante de tierra:</td>
          <td>${tiene('bajante') ? 'X' : ''}</td>
          <td>${!tiene('bajante') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Sellado de gabinete:</td>
          <td>${tiene('sellado') ? 'X' : ''}</td>
          <td>${!tiene('sellado') ? 'X' : ''}</td>
          <td class="col-label">Terminales PAT:</td>
          <td>${tiene('terminales') || tiene('pat') ? 'X' : ''}</td>
          <td>${!tiene('terminales') && !tiene('pat') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Protector antifauna:</td>
          <td>${tiene('antifauna') ? 'X' : ''}</td>
          <td>${!tiene('antifauna') ? 'X' : ''}</td>
          <td class="col-label">Apartarrayos:</td>
          <td>${tiene('apartarrayos') ? 'X' : ''}</td>
          <td>${!tiene('apartarrayos') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Cuchillas de Bypass:</td>
          <td>${tiene('bypass') ? 'X' : ''}</td>
          <td>${!tiene('bypass') ? 'X' : ''}</td>
          <td class="col-label">Cable RF sujetado:</td>
          <td>${tiene('cable rf') ? 'X' : ''}</td>
          <td>${!tiene('cable rf') ? 'X' : ''}</td>
        </tr>
        <tr>
          <td class="col-label">Cuchillas laterales:</td>
          <td>${tiene('cuchillas laterales') ? 'X' : ''}</td>
          <td>${!tiene('cuchillas laterales') ? 'X' : ''}</td>
          <td class="col-label">Calibre Bajante:</td>
          <td colspan="2">${data.calibre_bajante || data.calibreBajante || ''}</td>
        </tr>`;
      })()}
    </table>

    <!-- Observaciones -->
    ${data.observaciones ? `
    <div class="section-title">OBSERVACIONES</div>
    <table><tr><td style="padding: 8px;">${data.observaciones}</td></tr></table>
    ` : ''}

    <div class="footer">FKM-UHF-15-01</div>
  </div>

  <!-- Segunda página: Fotografías -->
  <div class="page" style="page-break-before: always;">
    <div class="header">
      ${logo1Base64 ? `<img src="data:image/png;base64,${logo1Base64}" class="logo" alt="CFE">` : ''}
      <div class="header-center">
        <h1>COMISIÓN FEDERAL DE ELECTRICIDAD</h1>
        <p>DIVISIÓN DE DISTRIBUCIÓN CENTRO ORIENTE</p>
        <p>SUBGERENCIA DE DISTRIBUCIÓN</p>
        <p>ZONA PACHUCA</p>
      </div>
      ${logo2Base64 ? `<img src="data:image/png;base64,${logo2Base64}" class="logo" alt="SUTERM">` : ''}
    </div>

    <div class="photo-grid">
      ${fotosHTML('estructuraCompleta', 'Estructura completa')}
      ${fotosHTML('gabinete', 'Gabinete')}
      ${fotosHTML('radio', 'Radio')}
      ${fotosHTML('supresor', 'Supresor')}
      ${fotosHTML('restaurador', 'Restaurador')}
      ${fotosHTML('terminalTierra', 'Terminal de tierra gabinete')}
      ${fotosHTML('bajanteTierra', 'Bajante de Tierra')}
      ${fotosHTML('placa', 'Placa')}
      ${fotosHTML('imagenAdicional', 'Imagen adicional')}
    </div>

    ${data.codigo_radio || data.codigoRadio ? `
    <div class="section-title">CONFIGURACIÓN DE RADIO</div>
    <table><tr><td style="padding: 8px; font-family: monospace; font-size: 6px; white-space: pre-wrap;">${data.codigo_radio || data.codigoRadio}</td></tr></table>
    ` : ''}

    <div class="footer">FKM-UHF-15-01</div>
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
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    console.log(`? PDF generado: ${fileName}`);
    
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
