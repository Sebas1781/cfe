# PlataformaCFE - PWA Completa

Aplicación web progresiva (PWA) para gestión de reportes CFE con React, Vite, SQLite3 y generación de PDFs.

## 🚀 Características

- ✅ **PWA** - Instalable y funciona offline
- 🔐 **Autenticación** - Sistema de roles (Admin/Trabajador)  
- 📝 **Formularios** - Guardado automático y sincronización
- 💾 **Offline First** - Funciona sin conexión
- 📄 **Generación de PDFs** - Con Puppeteer en el servidor
- 🗄️ **SQLite3** - Base de datos ligera y rápida
- 📱 **Responsive** - Diseño adaptable con Tailwind CSS

## 📦 Estructura del Proyecto

```
plataformaCFE/
├── src/                    # Frontend React
│   ├── pages/             # Login, Formulario, Dashboard
│   ├── stores/            # Estado global (Zustand)
│   ├── services/          # Lógica de negocio
│   └── config/            # Configuración
├── server/                # Backend Node.js
│   ├── routes/           # Rutas API
│   ├── services/         # Generación PDF
│   ├── database/         # SQLite
│   └── reports/          # PDFs generados
└── public/               # Archivos estáticos
```

## 🛠 Instalación

### 1. Clonar e instalar dependencias

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Configurar variables de entorno

Ya están configuradas por defecto en `.env`

## 🚀 Uso en Desarrollo (Windows)

### Terminal 1 - Backend:
```bash
cd server
node server.js
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

Abre http://localhost:5173

## 👥 Usuarios de Prueba

- **Admin**: `admin@cfe.com` / `admin123`
- **Trabajador**: `trabajador@cfe.com` / `trabajador123`

## 🐧 Despliegue en Ubuntu Server

### 1. Instalar dependencias del sistema

```bash
sudo apt update
sudo apt install nodejs npm sqlite3
```

### 2. Instalar Chromium para Puppeteer

```bash
sudo apt install chromium-browser
```

### 3. Copiar proyecto al servidor

```bash
scp -r plataformaCFE usuario@servidor:/var/www/
```

### 4. Configurar el backend

```bash
cd /var/www/plataformaCFE/server
cp .env.example .env
nano .env  # Ajustar rutas
npm install --production
```

### 5. Iniciar con PM2 (daemon)

```bash
sudo npm install -g pm2
pm2 start server.js --name cfe-backend
pm2 save
pm2 startup
```

### 6. Compilar frontend

```bash
cd /var/www/plataformaCFE
npm run build
```

### 7. Configurar Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (PWA)
    location / {
        root /var/www/plataformaCFE/dist;
        try_files $uri $uri/ /index.html;
    }

    # PDFs generados
    location /reports {
        root /var/www/plataformaCFE/server;
        autoindex off;
    }
}
```

```bash
sudo systemctl reload nginx
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/verify` - Verificar token

### Reportes
- `GET /api/reports` - Listar reportes (filtros opcionales)
- `POST /api/reports/generate` - Crear reporte + PDF
- `GET /api/reports/:id` - Ver reporte
- `GET /api/reports/:id/download` - Descargar PDF
- `PATCH /api/reports/:id/status` - Cambiar estado (admin)
- `DELETE /api/reports/:id` - Eliminar (admin)

### Usuarios
- `GET /api/users/:id` - Ver usuario
- `GET /api/users` - Listar usuarios (admin)

## 🔧 Tecnologías

### Frontend
- React 18
- Vite
- Tailwind CSS
- Zustand (estado)
- React Hook Form
- Localforage (offline)
- Workbox (Service Worker)

### Backend
- Node.js + Express
- SQLite3
- Puppeteer (PDFs)
- JWT (autenticación)
- Bcrypt (passwords)

## 📱 Instalar como PWA

1. Abre la app en Chrome/Edge
2. Click en el ícono de instalar (barra de dirección)
3. ¡Listo! Ahora funciona como app nativa

## 🔒 Seguridad

- Tokens JWT con expiración
- Passwords hasheados con bcrypt
- CORS configurado
- Helmet.js (headers seguros)
- Rate limiting
- Validación de inputs

## 📄 Licencia

ISC


## 🚀 Características

- ✅ **PWA** - Instalable y funciona offline
- 🔐 **Autenticación** - Sistema de roles (Admin/Trabajador)
- 📝 **Formularios** - Guardado automático y sincronización
- 💾 **Offline First** - Funciona sin conexión
- 📱 **Responsive** - Diseño adaptable con Tailwind CSS
- 🔄 **Sincronización automática** - Cuando vuelve la conexión

## 🛠 Tecnologías

- **React 18+** - Framework frontend
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos utilitarios
- **Firebase** - Autenticación
- **Better-SQLite3** - Base de datos local (servidor)
- **Zustand** - Estado global
- **React Hook Form** - Manejo de formularios
- **Localforage** - Almacenamiento offline

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
copy .env.example .env
```

2. Configura las variables de entorno:
```env
VITE_API_URL=http://tu-servidor.com/api
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

## 🚀 Desarrollo

Inicia el servidor de desarrollo:
```bash
npm run dev
```

## 🏗 Build

Compila para producción:
```bash
npm run build
```

## 👁 Preview

Previsualiza la build de producción:
```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
src/
├── config/
│   ├── firebase.js       # Configuración Firebase
│   ├── database.js       # Configuración SQLite (servidor)
│   └── api.js           # Cliente API
├── stores/
│   ├── authStore.js     # Estado de autenticación
│   └── formStore.js     # Estado de formularios + offline
├── services/
│   ├── authService.js   # Lógica de autenticación
│   └── reportService.js # Lógica de reportes
├── components/
│   └── PrivateRoute.jsx # Protección de rutas
├── pages/
│   ├── Login.jsx              # Pantalla de login
│   ├── FormularioTrabajador.jsx # Formulario para trabajadores
│   └── AdminDashboard.jsx      # Panel de administración
├── App.jsx              # Router principal
└── main.jsx            # Punto de entrada
```

## 👥 Tipos de Usuario

### 1. **Administrador**
- Ver todos los reportes
- Descargar PDFs
- Filtrar por estado
- Estadísticas generales

### 2. **Trabajador**
- Llenar formularios
- Guardado automático
- Trabajo offline
- Sincronización automática

## 🔌 Funcionalidad Offline

La aplicación funciona completamente offline:
- Los formularios se guardan localmente (IndexedDB)
- Se sincronizan automáticamente cuando hay conexión
- Service Worker cachea recursos estáticos
- Indicador visual de guardado automático

## 🖥 Servidor Backend (Ubuntu)

Para el backend en Ubuntu Server, necesitarás:

```bash
# Estructura recomendada
/var/www/plataforma-cfe/
├── server/
│   ├── api/
│   ├── database/
│   │   └── plataformaCFE.db
│   └── reports/
│       ├── generated/
│       ├── templates/
│       └── temp/
```

Tecnologías backend sugeridas:
- Node.js + Express
- Puppeteer o PDFKit (generación PDF)
- Better-SQLite3 (base de datos)
- PM2 (proceso daemon)

## 📱 Instalación como PWA

1. Accede desde el navegador
2. Click en "Instalar" o menú → "Instalar aplicación"
3. La app se instalará en tu dispositivo
4. Funciona offline una vez instalada

## 🔒 Seguridad

- Tokens JWT para autenticación
- Variables de entorno para credenciales
- Rutas protegidas por rol
- HTTPS requerido en producción

## 📄 Licencia

ISC

