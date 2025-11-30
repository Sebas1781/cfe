# ⚡ Guía Rápida de Instalación - 15 Minutos

Esta es la versión resumida para poner todo en funcionamiento rápidamente.

## 🎯 Objetivo
Tener la PWA funcionando en tu red local con sincronización automática.

## 📋 Pre-requisitos
- ✅ Servidor Ubuntu conectado a tu red WiFi
- ✅ Conocer la IP de tu servidor (ej: `192.168.1.100`)

## 🚀 Pasos Rápidos

### 1️⃣ En el Servidor Ubuntu (5 minutos)

```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Instalar dependencias del sistema
sudo apt install -y chromium-browser nginx sqlite3

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Ver tu IP (anótala)
hostname -I
# Ejemplo salida: 192.168.1.100
```

### 2️⃣ Subir el Proyecto (3 minutos)

**Opción A - Con USB:**
1. Copia la carpeta `cfe` a una USB
2. Conecta la USB al servidor
3. Copia a tu home: `cp -r /media/usb/cfe ~/plataforma-cfe`

**Opción B - Con SCP desde Windows:**
```powershell
# En PowerShell (reemplaza con tu IP y usuario)
cd C:\Users\eazy_\OneDrive\Escritorio
scp -r cfe usuario@192.168.1.100:~/plataforma-cfe
```

### 3️⃣ Configurar Variables (2 minutos)

```bash
cd ~/plataforma-cfe

# Backend .env
echo "PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
DB_PATH=./database/plataformaCFE.db
CORS_ORIGIN=http://192.168.1.100
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" > server/.env

# Frontend .env (REEMPLAZA 192.168.1.100 con TU IP)
echo "VITE_API_URL=http://192.168.1.100:3000/api" > .env
```

### 4️⃣ Instalar y Construir (3 minutos)

```bash
# Backend
cd ~/plataforma-cfe/server
npm install --production

# Frontend
cd ~/plataforma-cfe
npm install
npm run build
```

### 5️⃣ Iniciar Servicios (2 minutos)

```bash
# Backend con PM2
cd ~/plataforma-cfe/server
pm2 start server.js --name cfe-backend
pm2 save
pm2 startup

# Nginx
sudo bash -c 'cat > /etc/nginx/sites-available/cfe << EOF
server {
    listen 80;
    server_name _;
    root /home/'$USER'/plataforma-cfe/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/cfe /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Firewall
sudo ufw allow 80/tcp
sudo ufw --force enable
```

## ✅ Verificar que Funciona

### Desde el servidor:
```bash
# Ver logs
pm2 logs cfe-backend

# Probar API
curl http://localhost:3000/api/health
# Debe responder: {"status":"OK","timestamp":"..."}

# Ver estado
pm2 status
sudo systemctl status nginx
```

### Desde tu celular:
1. Conéctate al mismo WiFi que el servidor
2. Abre el navegador
3. Ve a: `http://192.168.1.100` (tu IP)
4. Deberías ver el login de la PWA
5. Credenciales de prueba:
   - **Trabajador**: `trabajador@cfe.com` / `trabajador123`
   - **Admin**: `admin@cfe.com` / `admin123`

### Instalar como PWA:
- **Android**: Menú → "Instalar app"
- **iOS**: Compartir → "Agregar a inicio"

## 🎉 ¡Listo!

Ya puedes:
- ✅ Usar la PWA offline en campo
- ✅ Llenar formularios sin conexión
- ✅ Sincronización automática al regresar a la red
- ✅ Ver reportes y PDFs en el dashboard admin

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs cfe-backend --lines 100

# Reiniciar
pm2 restart cfe-backend

# Actualizar después de cambios
cd ~/plataforma-cfe
git pull  # o copiar archivos nuevos
npm run build
pm2 restart cfe-backend
sudo systemctl reload nginx

# Backup de la base de datos
cp ~/plataforma-cfe/server/database/plataformaCFE.db ~/backup-$(date +%Y%m%d).db
```

## ❌ Problemas Comunes

**No puedo acceder desde el celular:**
```bash
# 1. Verifica la IP
hostname -I

# 2. Verifica firewall
sudo ufw status

# 3. Prueba desde el servidor mismo
curl http://localhost
```

**El backend no inicia:**
```bash
# Ver logs
pm2 logs cfe-backend

# Reiniciar
pm2 restart cfe-backend

# Reinstalar dependencias
cd ~/plataforma-cfe/server
rm -rf node_modules
npm install --production
```

**No sincroniza:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes de error
4. Verifica que la IP en `.env` sea correcta

## 📱 Uso Diario

**En campo (sin conexión):**
1. Abre la PWA instalada
2. Llena formularios
3. Todo se guarda automáticamente offline

**En oficina (con conexión):**
1. Conecta al WiFi
2. Abre la PWA
3. Se sincroniza automáticamente
4. Verás un banner verde cuando termine

**Como Admin:**
1. Accede desde cualquier navegador: `http://192.168.1.100`
2. Login: `admin@cfe.com` / `admin123`
3. Ve todos los reportes
4. Descarga PDFs

---

**Tiempo total de instalación: ~15 minutos** ⏱️

**¿Algo salió mal?** Revisa `DEPLOY_RED_LOCAL.md` para la guía completa.
