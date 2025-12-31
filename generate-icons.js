const fs = require('fs');
const path = require('path');

// Script para generar iconos PNG desde SVG usando una herramienta online o manual

console.log(`
📱 GENERADOR DE ICONOS PWA
============================

Se ha creado el archivo logo.svg en /public

Para generar los iconos PNG necesarios:

OPCIÓN 1 - Herramienta Online (Recomendado):
---------------------------------------------
1. Ve a: https://realfavicongenerator.net/
2. Sube el archivo: public/logo.svg
3. Descarga el paquete de iconos
4. Coloca los archivos en la carpeta public/

OPCIÓN 2 - Usar ImageMagick (si lo tienes instalado):
------------------------------------------------------
Ejecuta estos comandos:

# Windows PowerShell:
cd public
magick convert -background none logo.svg -resize 192x192 pwa-192x192.png
magick convert -background none logo.svg -resize 512x512 pwa-512x512.png
magick convert -background none logo.svg -resize 180x180 apple-touch-icon.png
magick convert logo.svg -resize 32x32 favicon.ico

# Linux/Mac:
cd public
convert -background none logo.svg -resize 192x192 pwa-192x192.png
convert -background none logo.svg -resize 512x512 pwa-512x512.png
convert -background none logo.svg -resize 180x180 apple-touch-icon.png
convert logo.svg -resize 32x32 favicon.ico

OPCIÓN 3 - PWA Asset Generator (Automático):
---------------------------------------------
npm install -g pwa-asset-generator
cd public
pwa-asset-generator logo.svg . --favicon --type png

============================
Archivos necesarios:
- pwa-192x192.png (192x192)
- pwa-512x512.png (512x512)
- apple-touch-icon.png (180x180)
- favicon.ico (32x32)
============================
`);
