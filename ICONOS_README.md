# 🎨 Guía para Generar Iconos PWA

Ya se creó un logo SVG básico para CFE en `public/logo.svg`

## Método más rápido - RealFaviconGenerator (Recomendado) ⚡

1. **Ve a**: https://realfavicongenerator.net/
2. **Sube** el archivo `public/logo.svg`
3. **Configura** las opciones (o usa las predeterminadas)
4. **Descarga** el paquete ZIP
5. **Extrae** los archivos en la carpeta `public/`

## Usando PWA Asset Generator (Automático) 🤖

```bash
# Instalar la herramienta
npm install -g pwa-asset-generator

# Generar todos los iconos
cd public
pwa-asset-generator logo.svg . --favicon --type png

# Los archivos se crearán automáticamente
```

## Usando ImageMagick (Manual) 🔧

Si tienes ImageMagick instalado:

### Windows:
```powershell
cd public
magick convert -background none logo.svg -resize 192x192 pwa-192x192.png
magick convert -background none logo.svg -resize 512x512 pwa-512x512.png
magick convert -background none logo.svg -resize 180x180 apple-touch-icon.png
magick convert logo.svg -resize 32x32 favicon.ico
```

### Linux/Mac:
```bash
cd public
convert -background none logo.svg -resize 192x192 pwa-192x192.png
convert -background none logo.svg -resize 512x512 pwa-512x512.png
convert -background none logo.svg -resize 180x180 apple-touch-icon.png
convert logo.svg -resize 32x32 favicon.ico
```

## Archivos necesarios

Una vez generados, deberías tener:

```
public/
├── pwa-192x192.png    (192x192 px)
├── pwa-512x512.png    (512x512 px)
├── apple-touch-icon.png (180x180 px)
├── favicon.ico        (32x32 px)
└── logo.svg          (vector original)
```

## Verificar la instalación

Después de generar los iconos:

```bash
# Reconstruir el proyecto
npm run build

# Subir al servidor
git add public/*.png public/*.ico
git commit -m "Add PWA icons"
git push origin main

# En el servidor
cd /var/www/plataforma-cfe
git pull
npm run build
pm2 restart plataforma-cfe
```

## Personalizar el logo

Si quieres usar tu propio logo:
1. Reemplaza `public/logo.svg` con tu diseño
2. Asegúrate que sea cuadrado (viewBox="0 0 512 512")
3. Usa colores sólidos para mejor visibilidad
4. Regenera los iconos con cualquiera de los métodos anteriores

---

**Nota**: El logo actual es un placeholder simple. Para producción, considera usar el logo oficial de CFE.
