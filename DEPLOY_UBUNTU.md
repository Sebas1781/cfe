# Deploy en Ubuntu Server

## A) Primera instalación

```bash
# 1. Paquetes base
sudo apt update && sudo apt install -y git nginx curl build-essential python3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

# 2. Dependencias de Chromium (Puppeteer, para los PDF)
sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2

# 3. Código
cd ~ && git clone https://github.com/Sebas1781/cfe.git && cd cfe

# 4. Configuración del backend
cp server/.env.example server/.env
nano server/.env
#   NODE_ENV=production
#   JWT_SECRET=$(openssl rand -hex 48)   <- genera uno y pégalo
#   CORS_ORIGIN=http://IP_DEL_SERVIDOR

# 5. Frontend: revisa .env.production (VITE_API_URL)
#    Con nginx puedes usar:  VITE_API_URL=/api
cat .env.production | grep VITE_API_URL

# 6. Build y arranque
npm ci && npm run build
(cd server && npm ci --omit=dev)
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup        # ejecuta el comando que imprime

# 7. Nginx
sudo cp deploy/nginx-cfe.conf /etc/nginx/sites-available/cfe
sudo nano /etc/nginx/sites-available/cfe       # ajusta root: /home/TU_USUARIO/cfe/dist
sudo ln -sf /etc/nginx/sites-available/cfe /etc/nginx/sites-enabled/cfe
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo chmod o+x /home/TU_USUARIO     # para que nginx lea dist/

# 8. Firewall
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw enable
#   (si VITE_API_URL apunta a :3000 directo, también: sudo ufw allow 3000)

# 9. Crear administrador (la contraseña va por variable, no en el código)
cd server && ADMIN_PASSWORD='UnaClaveSegura' node seed-admin.js
```

La base de datos (`server/database/plataformaCFE.db`) no está en git; si ya tienes una
en otro equipo, cópiala con `scp` a esa ruta antes del paso 6.

## B) Subir una actualización

En tu PC:
```bash
git add -A && git commit -m "descripción" && git push origin main
```
En el servidor:
```bash
cd ~/cfe && ./deploy/deploy.sh
```
El script: respalda la BD (`~/cfe-backups`), hace `git pull`, `npm ci`, `npm run build`,
recarga PM2 y verifica `/api/health`. Para otra rama: `./deploy/deploy.sh nombre-rama`.

## C) Comandos útiles
```bash
pm2 status && pm2 logs cfe-backend --lines 100
sudo tail -f /var/log/nginx/error.log
curl http://localhost:3000/api/health
```
Rollback: `git log --oneline`, `git checkout <commit>`, `FORCE=1 ./deploy/deploy.sh` (o restaurar la BD desde `~/cfe-backups`).

## D) Notas
- Los usuarios con la PWA instalada reciben la actualización al abrir la app dos veces (autoUpdate del service worker).
- Al ser intranet se entra por IP (`http://IP_DEL_SERVIDOR`); no hace falta dominio. `server_name _` ya acepta cualquier IP.
- **Cámara/QR y "instalar app" (PWA) exigen HTTPS**, y Let's Encrypt no sirve con IP privada. Opción: certificado autofirmado en nginx (sección E).

## E) HTTPS con certificado autofirmado (para cámara/QR y PWA)
```bash
IP=10.9.179.124   # IP del servidor
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048   -keyout /etc/ssl/private/cfe.key -out /etc/ssl/certs/cfe.crt   -subj "/CN=$IP" -addext "subjectAltName=IP:$IP"
```
En `/etc/nginx/sites-available/cfe` cambia `listen 80;` por:
```nginx
listen 443 ssl;
ssl_certificate     /etc/ssl/certs/cfe.crt;
ssl_certificate_key /etc/ssl/private/cfe.key;
```
y agrega un bloque `server { listen 80; return 301 https://$host$request_uri; }`.
Luego `sudo ufw allow 443 && sudo nginx -t && sudo systemctl reload nginx`.

Cada celular/PC debe confiar en el certificado una vez: descarga `cfe.crt` e instálalo como certificado de CA/confianza
(en Android: Ajustes → Seguridad → Instalar certificado). Sin eso el navegador mostrará advertencia y la PWA no se instalará.
Pon además `VITE_API_URL=/api` para que la API use el mismo https (si no, habría contenido mixto bloqueado) y vuelve a correr `./deploy/deploy.sh` con `FORCE=1`.
