# 📘 Contexto del Proyecto — Plataforma CFE

> Documento de contexto para describir qué hace la aplicación, las tecnologías que usa y sus objetivos.

---

## 1. ¿Qué es la aplicación?

**Plataforma CFE** es una **Progressive Web App (PWA)** desarrollada para la **Comisión Federal de Electricidad (CFE)** de México. Su propósito central es **digitalizar el levantamiento y gestión de reportes técnicos de mantenimiento** de equipos eléctricos en campo — específicamente de **restauradores** (equipos de protección/seccionamiento de líneas) y sus radios/gabinetes de telecomunicación asociados (UTR/telemetría).

El sistema reemplaza los formatos en papel que llenan los técnicos en campo por un formulario digital que **funciona sin conexión a internet** (crítico, porque los restauradores suelen estar en zonas rurales/remotas sin señal), y que luego **sincroniza automáticamente** y **genera reportes PDF** profesionales cuando vuelve la conectividad.

---

## 2. Objetivos del sistema

| # | Objetivo | Cómo lo resuelve |
|---|----------|------------------|
| 1 | **Eliminar el papel** en mantenimientos de campo | Formulario digital estructurado (40+ campos técnicos) |
| 2 | **Operar sin internet** en zonas remotas | Almacenamiento offline en IndexedDB (`localforage`) + cola de sincronización |
| 3 | **Sincronización automática** al recuperar señal | Hook `useNetworkSync` que verifica el servidor cada 30s y sube los pendientes |
| 4 | **Generar reportes oficiales** en PDF | Backend con **Puppeteer** renderiza PDFs desde plantillas HTML |
| 5 | **Geolocalizar equipos** | Mapa con Google Maps + coordenadas lat/lng de cada restaurador |
| 6 | **Identificación rápida en campo** | Códigos **QR** por restaurador + escáner QR integrado (`html5-qrcode`) |
| 7 | **Control de acceso por rol** | Roles `admin` y `trabajador` con rutas protegidas (JWT) |
| 8 | **Trazabilidad y administración** | Folio único por reporte, gestión de usuarios y catálogos |

---

## 3. Arquitectura general

Arquitectura **cliente-servidor desacoplada** con capacidad **offline-first**:

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   FRONTEND (PWA - React)    │         │   BACKEND (Node + Express)   │
│   Puerto Vite (dev)         │  HTTP   │   Puerto 3000                │
│                             │ ◄─────► │                              │
│  • Offline (IndexedDB)      │  /api   │  • API REST                  │
│  • Service Worker / Workbox │         │  • SQLite (sqlite3)          │
│  • Zustand (estado)         │         │  • JWT + bcrypt              │
│  • Cola de sincronización   │         │  • Puppeteer (PDF)           │
└─────────────────────────────┘         │  • ExcelJS (Excel)          │
                                         │  • Multer (uploads)          │
                                         └──────────────────────────────┘
```

> ⚠️ **Nota — dualidad/inconsistencia detectada:** el `package.json` raíz incluye `firebase`, `better-sqlite3` y Google Maps, mientras que el backend en `/server` usa `sqlite3` + JWT propio. Conviven dos posibles backends:
> - **Backend activo:** Express + SQLite + JWT (carpeta `server/`) — es el que usa la app realmente (ver `src/config/api.js`).
> - **Firebase** (`src/config/firebase.js`) y `src/config/database.js` (better-sqlite3 con tabla `users` basada en `email`) parecen **restos de una arquitectura anterior o exploratoria** que ya no se usan (el esquema no coincide con el real `numero_trabajador`). Conviene confirmarlo y limpiarlo.

---

## 4. Stack tecnológico

### Frontend (`/src`)
| Tecnología | Uso |
|------------|-----|
| **React 19** | Librería UI principal |
| **Vite 7** | Bundler y dev server |
| **React Router DOM 7** | Enrutamiento SPA |
| **Zustand 5** | Gestión de estado global (auth + formularios) |
| **vite-plugin-pwa / Workbox** | Service Worker, instalable, offline |
| **localforage** | Almacenamiento offline en IndexedDB |
| **react-hook-form** | Manejo de formularios |
| **Tailwind CSS 4** | Estilos |
| **@react-google-maps/api** | Mapa de restauradores |
| **html5-qrcode** | Escaneo de códigos QR en campo |
| **qrcode** | Generación de códigos QR |
| **FontAwesome** | Iconografía |
| **firebase** | (Presente pero aparentemente en desuso) |

### Backend (`/server`)
| Tecnología | Uso |
|------------|-----|
| **Express 4** | Servidor API REST |
| **SQLite3** | Base de datos (archivo `plataformaCFE.db`) |
| **jsonwebtoken (JWT)** | Autenticación basada en tokens |
| **bcrypt** | Hash de contraseñas (10 rounds) |
| **Puppeteer** | Generación de PDFs desde HTML |
| **ExcelJS** | Exportación a Excel |
| **Multer** | Subida de archivos (fotografías) |
| **Helmet** | Cabeceras de seguridad |
| **express-rate-limit** | Limitación de peticiones |
| **express-validator** | Validación de entradas |
| **CORS / Morgan / dotenv** | Middleware estándar |

---

## 5. Modelo de datos (SQLite)

**4 tablas principales** (definidas en `server/database/db.js`):

- **`users`** — `numero_trabajador` (login), `nombre_completo`, `password` (hash), `role` (`admin` | `trabajador`).
- **`reports`** — núcleo del sistema. ~40 campos técnicos agrupados en:
  - *Información básica:* folio, tipo de mantenimiento, fecha, responsable, licencia, circuito, área, coordenadas, dirección.
  - *Radio/Gabinete:* potencia de salida, RSSI, frecuencia, RX/TX, cable pigtail, supresor, altura de antena, canal UCM.
  - *Mediciones técnicas:* VSWR, potencia incidente/reflejada, voltaje acometida, resistencia a tierra, % de batería, azimut.
  - *Actividades, materiales, observaciones, fotografías* (JSON), `pdf_path`, `status` (pendiente/completado/revisado).
- **`sync_queue`** — cola de sincronización offline del lado servidor.
- **`restauradores`** — equipos geolocalizados con `latitud`, `longitud`, `codigo_qr` único.

**Usuarios sembrados por defecto:**
- Admin → `00001` / `admin123`
- Trabajador → `12345` / `12345`

---

## 6. Funcionalidades por módulo (rutas de la app)

Basado en `src/App.jsx`:

| Ruta | Componente | Rol | Función |
|------|-----------|-----|---------|
| `/login` | Login | público | Inicio de sesión con número de trabajador |
| `/dashboard`, `/admin` | AdminDashboard | ambos / admin | Panel principal |
| `/nuevo-reporte` | NuevoReporte | ambos | Crear reporte de mantenimiento |
| `/editar-reporte/:id` | EditarReporte | ambos | Modificar reporte |
| `/reportes` | ListaReportes | ambos | Listado, descarga de PDFs |
| `/restauradores` | MapaRestauradores | ambos | Mapa Google con equipos |
| `/nuevo-restaurador` | NuevoRestaurador | **admin** | Alta de equipo + QR |
| `/scanner-qr` | ScannerQR | ambos | Escanear QR en campo |
| `/usuarios` | AdminUsuarios | **admin** | CRUD de usuarios |
| `/formularios` | AdminFormularios | **admin** | Configurar opciones de catálogos |
| `/perfil` | Perfil | ambos | Datos y cambio de contraseña |

---

## 7. El flujo estrella: trabajo offline-first

Comportamiento más crítico del sistema (`src/stores/formStore.js` + `src/hooks/useNetworkSync.js`):

1. El técnico llena un reporte **en campo sin internet**.
2. El formulario se guarda en **IndexedDB** (`localforage`) en una lista de `pendingForms`.
3. El hook `useNetworkSync` hace **ping a `/api/health` cada 30 segundos** y escucha eventos `online`/`offline` del navegador.
4. Cuando detecta servidor disponible **y** hay formularios pendientes, **sube automáticamente** cada uno a `POST /api/reports/generate`.
5. Cada formulario sincronizado se **elimina de IndexedDB** y el backend **genera su PDF** con Puppeteer.
6. `NetworkStatus` muestra el indicador visual de pendientes/sincronización al usuario.

---

## 8. Seguridad

- **Autenticación JWT** — token guardado en `localStorage`, enviado como `Bearer` en cada petición.
- **Contraseñas con bcrypt** (10 salt rounds).
- **Autorización por roles** — componente `PrivateRoute` con `allowedRoles`.
- **Helmet + rate limiting + CORS + express-validator** en el backend.
- *Puntos de mejora:* `CORS origin: '*'` y `JWT_SECRET` por variable de entorno (verificar configuración en producción).

---

## 9. Endpoints principales de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Inicio de sesión |
| `POST` | `/api/auth/register` | Registro |
| `GET` | `/api/auth/verify` | Verificar token |
| `GET/POST/PUT/DELETE` | `/api/users` | Gestión de usuarios |
| `GET` | `/api/reports` | Listar reportes |
| `POST` | `/api/reports/generate` | Crear reporte + generar PDF |
| `GET` | `/api/reports/:id/download` | Descargar PDF |
| `GET/POST` | `/api/restauradores` | Equipos geolocalizados |
| `GET/POST` | `/api/form-options` | Catálogos de formularios |
| `POST` | `/api/uploads` | Subida de fotografías |
| `GET` | `/api/health` | Health check (usado por la sincronización) |

---

## 10. Scripts útiles

| Comando | Ubicación | Acción |
|---------|-----------|--------|
| `npm run dev` | raíz | Levanta el frontend (Vite) |
| `npm run build` | raíz | Compila el frontend a `/dist` |
| `npm start` | `server/` | Inicia el backend (puerto 3000) |
| `npm run dev` | `server/` | Backend con nodemon |
| `node seed-admin.js` | `server/` | Seeder de usuario administrador |
| `node create-restauradores-table.js` | `server/` | Crea tabla de restauradores con datos de ejemplo |
| `node create-form-options-table.js` | `server/` | Crea tabla de opciones de formularios |
