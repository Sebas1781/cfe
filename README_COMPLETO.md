# 📱 Plataforma CFE - PWA Offline-First

> Progressive Web App para gestión de reportes de campo con sincronización automática en red local

## 🎯 ¿Qué hace esta aplicación?

Esta PWA está diseñada para trabajadores de CFE que necesitan:
- ✅ Llenar formularios **sin conexión a internet** (en campo)
- ✅ **Sincronizar automáticamente** al regresar a la oficina
- ✅ Guardar datos en **red local** (no requiere internet)
- ✅ Generar reportes en **PDF**

## 🏗️ Cómo Funciona

### En Campo (SIN conexión)
```
📱 PWA en celular
  ├─ Funciona offline
  ├─ Formularios guardados en IndexedDB
  └─ Service Worker cachea todo
```

### En Oficina (CON conexión a red local)
```
📱 Se conecta al WiFi
  ├─ Detecta servidor automáticamente
  ├─ Sube todos los formularios pendientes
  └─ Se sincroniza todo a SQLite
```

## ⚡ Instalación Rápida

### Para desarrollo (Windows):
```bash
# Backend
cd server
npm install
node server.js

# Frontend (otra terminal)
npm install
npm run dev
```

### Para producción (Ubuntu Server):
Ver **[INSTALACION_RAPIDA.md](./INSTALACION_RAPIDA.md)** - Solo 15 minutos!

## 📚 Documentación

- 📘 [INSTALACION_RAPIDA.md](./INSTALACION_RAPIDA.md) - Pasos rápidos (15 min)
- 📗 [DEPLOY_RED_LOCAL.md](./DEPLOY_RED_LOCAL.md) - Guía completa
- 📙 [COMO_FUNCIONA.md](./COMO_FUNCIONA.md) - Explicación técnica

## 👥 Usuarios de Prueba

### Trabajador
- Email: `trabajador@cfe.com`
- Password: `trabajador123`

### Administrador
- Email: `admin@cfe.com`
- Password: `admin123`

## 🛠️ Stack Tecnológico

**Frontend:**
- React 18.2 + Vite 7.2
- Tailwind CSS 4.1
- PWA (Service Worker + IndexedDB)
- Zustand (estado)

**Backend:**
- Node.js + Express
- SQLite3
- Puppeteer (PDFs)
- JWT Auth

## 📁 Estructura

```
plataformaCFE/
├── src/                           # Frontend React
│   ├── components/
│   │   ├── NetworkStatus.jsx     # 🆕 Banner de sincronización
│   │   └── PrivateRoute.jsx
│   ├── hooks/
│   │   └── useNetworkSync.js     # 🆕 Lógica de sync automática
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── FormularioTrabajador.jsx
│   │   └── AdminDashboard.jsx
│   └── stores/
│       ├── authStore.js
│       └── formStore.js          # 🆕 Con offline queue
├── server/                        # Backend Node.js
│   ├── database/
│   │   └── db.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── reports.js
│   │   └── users.js
│   ├── services/
│   │   └── pdfGenerator.js
│   └── server.js
├── INSTALACION_RAPIDA.md         # 🆕 Guía rápida
├── DEPLOY_RED_LOCAL.md           # 🆕 Guía completa
└── COMO_FUNCIONA.md              # 🆕 Explicación técnica
```

## 🔑 Características Nuevas

### 🔄 Sincronización Automática
- ✅ Detecta servidor cada 30 segundos
- ✅ Sube formularios pendientes automáticamente
- ✅ Banner visual del estado de sincronización
- ✅ Funciona en red local (no requiere internet)

### 📱 Banner de Estado
```
🟡 Offline: "3 formularios guardados - se sincronizarán al conectar"
🟢 Online:  "Servidor conectado - sincronizando 3 formularios..."
✅ Listo:   "Todo sincronizado"
```

## 🚀 Uso

### Como Trabajador:
1. Instala la PWA en tu celular
2. Llena formularios en campo (sin conexión)
3. Regresa a la oficina
4. Conéctate al WiFi
5. **¡La sincronización es automática!**

### Como Admin:
1. Accede a `http://IP_SERVIDOR`
2. Ve todos los reportes
3. Descarga PDFs
4. Filtra por estado/fecha

## 🌐 Endpoints

- `GET /api/health` - Health check (usado para detectar servidor)
- `POST /api/auth/login` - Login
- `POST /api/reports/generate` - Crear reporte + PDF
- `GET /api/reports` - Listar reportes
- `GET /api/reports/:id/download` - Descargar PDF

## 🔧 Variables de Entorno

**Backend (.env en /server):**
```env
PORT=3000
JWT_SECRET=tu_secreto
DB_PATH=./database/plataformaCFE.db
CORS_ORIGIN=http://192.168.1.100
```

**Frontend (.env en raíz):**
```env
VITE_API_URL=http://192.168.1.100:3000/api
```

## 📊 Base de Datos SQLite

### Tablas:
- `users` - Usuarios (admin/trabajador)
- `reports` - Reportes con PDFs
- `sync_queue` - Cola de sincronización

## 🎉 Ventajas

- 🚀 **Sin fricción**: Sincronización 100% automática
- 💾 **Offline-first**: Funciona sin internet
- 🏠 **Red local**: No depende de internet externo
- 🔒 **Privado**: Datos en tu servidor local
- ⚡ **Rápido**: Sincronización instantánea en LAN
- 📱 **PWA**: Instalable como app nativa

## 🐛 Troubleshooting

**No sincroniza:**
1. Verifica estar en la misma red WiFi
2. Accede a `http://IP_SERVIDOR/api/health`
3. Deberías ver: `{"status":"OK",...}`

**Ver logs:**
```bash
pm2 logs cfe-backend
```

**Reiniciar:**
```bash
pm2 restart cfe-backend
sudo systemctl restart nginx
```

## 📝 Próximas Mejoras

- [ ] Agregar fotos a reportes
- [ ] Firma digital
- [ ] Geolocalización
- [ ] Notificaciones push
- [ ] Modo oscuro

---

**Desarrollado para CFE - Made with ❤️**
