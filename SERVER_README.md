# Plataforma CFE - Backend Server

Backend para la PWA Plataforma CFE. Genera reportes PDF y maneja la base de datos SQLite.

## Requisitos

- Node.js 18+
- Ubuntu Server 20.04+
- PM2 (opcional, para daemon)

## Instalación

```bash
npm install
```

## Variables de Entorno

Crea un archivo `.env`:

```env
PORT=3000
NODE_ENV=production
DB_PATH=/var/www/plataforma-cfe/database/plataformaCFE.db
REPORTS_PATH=/var/www/plataforma-cfe/reports/generated
JWT_SECRET=tu_secret_super_seguro
FIREBASE_PROJECT_ID=tu_proyecto_id
```

## Estructura

```
server/
├── api/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── reports.js
│   │   └── users.js
│   └── controllers/
│       ├── authController.js
│       ├── reportController.js
│       └── userController.js
├── database/
│   ├── db.js
│   └── migrations/
├── services/
│   ├── pdfGenerator.js
│   └── emailService.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── utils/
│   └── helpers.js
├── reports/
│   ├── generated/
│   ├── templates/
│   └── temp/
├── server.js
└── package.json
```

## Iniciar Servidor

Desarrollo:
```bash
npm run dev
```

Producción:
```bash
npm start
```

Con PM2:
```bash
pm2 start server.js --name plataforma-cfe
pm2 save
pm2 startup
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token

### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports/generate` - Crear reporte (genera PDF)
- `GET /api/reports/:id` - Obtener reporte
- `GET /api/reports/:id/download` - Descargar PDF
- `DELETE /api/reports/:id` - Eliminar reporte

### Usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `GET /api/users` - Listar usuarios (admin)

## Base de Datos

SQLite con las siguientes tablas:

- `users` - Usuarios del sistema
- `reports` - Metadatos de reportes
- `form_data` - Datos de formularios
- `sync_queue` - Cola de sincronización

## Generación de PDFs

Usa Puppeteer para generar PDFs a partir de templates HTML.

Ejemplo de uso:
```javascript
const { generatePDF } = require('./services/pdfGenerator');

const pdf = await generatePDF({
  template: 'reporte-cfe',
  data: formData
});
```

## Seguridad

- JWT para autenticación
- Rate limiting
- CORS configurado
- Sanitización de inputs
- HTTPS en producción

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/plataforma-cfe/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Logs

Los logs se guardan en:
- `/var/log/plataforma-cfe/access.log`
- `/var/log/plataforma-cfe/error.log`

## Backup

Backup automático de la base de datos:
```bash
crontab -e
0 2 * * * cp /var/www/plataforma-cfe/database/plataformaCFE.db /backups/db_$(date +\%Y\%m\%d).db
```
