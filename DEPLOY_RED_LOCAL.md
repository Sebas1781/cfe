# 🏠 Guía de Despliegue en Red Local - Plataforma CFE

Esta guía te ayudará a configurar la aplicación para que funcione en tu red local y se sincronice automáticamente cuando te conectes a ella.

## 📋 Requisitos Previos

- Servidor Ubuntu (tu "computadora pequeña pero potente")
- Conexión a la misma red WiFi/LAN tanto para el servidor como para los dispositivos móviles
- Node.js 18+ y npm instalados en el servidor

## 🎯 Arquitectura de la Solución

```
┌─────────────────────────────────────────────────┐
│  FUERA DE LA RED (Campo)                        │
│  ┌─────────────────┐                            │
│  │   PWA (Offline)  │                            │
│  │  - Formularios   │                            │
│  │  - IndexedDB     │ ← Guarda todo localmente  │
│  │  - Service Worker│                            │
│  └─────────────────┘                            │
└─────────────────────────────────────────────────┘
                   ↓
         (Regresas a la red)
                   ↓
┌─────────────────────────────────────────────────┐
│  EN LA RED LOCAL (Oficina/Casa)                 │
│  ┌─────────────────┐      ┌──────────────────┐ │
│  │   PWA (Online)   │ ───→ │  Servidor Ubuntu │ │
│  │  - Detecta red   │      │  - Node.js       │ │
│  │  - Sincroniza    │ ←─── │  - SQLite        │ │
│  │    automático    │      │  - IP: 192.168.x │ │
│  └─────────────────┘      └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🔧 Paso 1: Configurar el Servidor Ubuntu

### 1.1 Instalar dependencias del sistema

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar dependencias adicionales para Puppeteer
sudo apt install -y \
  chromium-browser \
  chromium-chromedriver \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxss1 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libgbm1

# Instalar PM2 para gestionar el proceso
sudo npm install -g pm2
```

### 1.2 Obtener la IP local del servidor

```bash
# Ver la IP local del servidor
hostname -I
```

**Anota esta IP** (algo como `192.168.1.100` o `192.168.0.50`). La usarás en los dispositivos.

### 1.3 Hacer la IP estática (Recomendado)

Para que el servidor siempre tenga la misma IP:

```bash
# Editar configuración de red (Ubuntu 20.04+)
sudo nano /etc/netplan/01-netcfg.yaml
```

Ejemplo de configuración:
```yaml
network:
  version: 2
  ethernets:
    eth0:  # o el nombre de tu interfaz
      dhcp4: no
      addresses:
        - 192.168.1.100/24  # Tu IP fija
      gateway4: 192.168.1.1  # Tu router
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

Aplicar cambios:
```bash
sudo netplan apply
```

## 📦 Paso 2: Subir el Proyecto al Servidor

### Opción A: Usando Git (Recomendado)

En tu computadora de desarrollo:
```bash
cd c:\Users\eazy_\OneDrive\Escritorio\cfe

# Crear repositorio (si no lo has hecho)
git init
git add .
git commit -m "Initial commit"

# Subir a GitHub (crea un repo privado en github.com)
git remote add origin https://github.com/TU_USUARIO/plataforma-cfe.git
git push -u origin main
```

En el servidor Ubuntu:
```bash
cd ~
git clone https://github.com/TU_USUARIO/plataforma-cfe.git
cd plataforma-cfe
```

### Opción B: Usando SCP (Transferencia directa)

Desde tu computadora Windows (PowerShell):
```powershell
# Comprimir el proyecto (excluyendo node_modules)
cd C:\Users\eazy_\OneDrive\Escritorio\cfe
tar -czf plataforma-cfe.tar.gz --exclude=node_modules --exclude=dist .

# Transferir al servidor (reemplaza con tu IP y usuario)
scp plataforma-cfe.tar.gz usuario@192.168.1.100:~/
```

En el servidor Ubuntu:
```bash
cd ~
tar -xzf plataforma-cfe.tar.gz -C plataforma-cfe
cd plataforma-cfe
```

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Backend (.env en /server)

```bash
cd ~/plataforma-cfe/server
nano .env
```

Contenido:
```env
PORT=3000
NODE_ENV=production

# JWT Secret (genera uno único)
JWT_SECRET=tu_secreto_super_seguro_aqui

# Base de datos
DB_PATH=./database/plataformaCFE.db

# CORS - IMPORTANTE: Tu IP del servidor
CORS_ORIGIN=http://192.168.1.100

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 3.2 Frontend (.env en la raíz)

```bash
cd ~/plataforma-cfe
nano .env
```

Contenido:
```env
# IMPORTANTE: Usar la IP local de tu servidor
VITE_API_URL=http://192.168.1.100:3000/api
```

## 🚀 Paso 4: Instalar y Construir

```bash
# Backend
cd ~/plataforma-cfe/server
npm install --production

# Frontend
cd ~/plataforma-cfe
npm install
npm run build
```

## 🔄 Paso 5: Configurar PM2 (Backend como servicio)

```bash
cd ~/plataforma-cfe/server

# Iniciar el backend con PM2
pm2 start server.js --name cfe-backend

# Configurar para que inicie automáticamente al reiniciar
pm2 startup
pm2 save

# Ver el estado
pm2 status
pm2 logs cfe-backend
```

## 🌐 Paso 6: Servir el Frontend

### Opción A: Con Nginx (Recomendado)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/cfe
```

Contenido del archivo:
```nginx
server {
    listen 80;
    server_name 192.168.1.100;  # Tu IP del servidor
    
    # Frontend (archivos estáticos)
    root /home/TU_USUARIO/plataforma-cfe/dist;
    index index.html;
    
    # SPA - todas las rutas al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API - proxy al backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activar el sitio:
```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/cfe /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Configurar inicio automático
sudo systemctl enable nginx
```

### Opción B: Con serve (Más simple pero menos eficiente)

```bash
# Instalar serve
sudo npm install -g serve

# Servir el frontend con PM2
cd ~/plataforma-cfe
pm2 serve dist 80 --name cfe-frontend --spa
pm2 save
```

## 🔥 Paso 7: Configurar Firewall

```bash
# Permitir HTTP (puerto 80)
sudo ufw allow 80/tcp

# Permitir API directa (opcional, Nginx ya lo maneja)
sudo ufw allow 3000/tcp

# Activar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

## 📱 Paso 8: Acceder desde Dispositivos Móviles

### 8.1 Conectar a la misma red WiFi

Asegúrate de que tu celular/tablet esté en la misma red WiFi que el servidor.

### 8.2 Abrir la PWA

En el navegador del celular, ve a:
```
http://192.168.1.100
```

(Reemplaza con la IP de tu servidor)

### 8.3 Instalar como PWA

1. **Android Chrome**: Toca los 3 puntos → "Instalar app" o "Agregar a pantalla de inicio"
2. **iOS Safari**: Toca el botón de compartir → "Agregar a pantalla de inicio"

## 🔄 Funcionamiento de Sincronización

### Cuando estás FUERA de la red:

1. ✅ La PWA funciona completamente offline
2. 💾 Los formularios se guardan en IndexedDB
3. 🔴 Se muestra un banner amarillo: "Modo offline - X formularios guardados"
4. 📝 Puedes seguir llenando formularios sin problema

### Cuando REGRESAS a la red:

1. 📶 La PWA detecta automáticamente que el servidor está disponible (verifica cada 30 segundos)
2. 🟢 El banner cambia a verde: "Servidor conectado"
3. 🔄 **Sincronización automática**: Sube todos los formularios pendientes
4. ✅ Los datos se guardan en la base de datos SQLite del servidor
5. 🗑️ Se eliminan de IndexedDB al confirmarse la sincronización

### Indicadores visuales:

- 🟡 **Banner amarillo**: Offline, datos guardados localmente
- 🟢 **Banner verde**: Online, sincronización en progreso o completada
- 🔄 **Animación de spinning**: Sincronizando datos
- 📊 **Contador**: Muestra cuántos formularios están pendientes

## 🛠️ Comandos Útiles de Mantenimiento

### Ver logs del servidor:
```bash
pm2 logs cfe-backend
```

### Reiniciar servicios:
```bash
pm2 restart cfe-backend
sudo systemctl restart nginx
```

### Ver estado de servicios:
```bash
pm2 status
sudo systemctl status nginx
```

### Actualizar la aplicación:
```bash
cd ~/plataforma-cfe
git pull  # Si usas Git
npm run build  # Reconstruir frontend
pm2 restart cfe-backend  # Reiniciar backend
```

### Backup de la base de datos:
```bash
cp ~/plataforma-cfe/server/database/plataformaCFE.db ~/backup_$(date +%Y%m%d).db
```

## 🔍 Solución de Problemas

### La PWA no sincroniza:

1. Verifica que estés en la misma red WiFi
2. Prueba hacer ping al servidor desde el celular:
   ```
   http://192.168.1.100/api/health
   ```
   Deberías ver: `{"status":"OK","timestamp":"..."}`

### No puedo acceder desde el celular:

1. Verifica la IP del servidor: `hostname -I`
2. Prueba hacer ping desde el celular al servidor
3. Verifica el firewall: `sudo ufw status`
4. Asegúrate de que ambos dispositivos estén en la misma red

### Error al generar PDFs:

```bash
# Reinstalar dependencias de Puppeteer
cd ~/plataforma-cfe/server
npm rebuild puppeteer
```

### Ver la base de datos:

```bash
sudo apt install sqlite3
cd ~/plataforma-cfe/server/database
sqlite3 plataformaCFE.db
.tables
SELECT * FROM users;
SELECT * FROM reports;
.quit
```

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Servidor corriendo en tu red local
- ✅ PWA instalable en dispositivos móviles
- ✅ Funcionamiento offline completo
- ✅ Sincronización automática cuando te conectas a la red
- ✅ Base de datos centralizada en el servidor

## 📝 Notas Importantes

1. **Sin HTTPS**: En red local no es necesario HTTPS, pero la PWA funcionará perfectamente
2. **IP Estática**: Es muy recomendable configurar una IP fija para que no cambien las URLs
3. **Backup**: Haz backups regulares de la base de datos SQLite
4. **Actualizaciones**: Cuando actualices el código, recuerda hacer `npm run build` y reiniciar PM2

---

**¿Necesitas ayuda?** Revisa los logs con:
- Backend: `pm2 logs cfe-backend`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- Sistema: `journalctl -xe`
