# 🔄 Cómo Funciona la Sincronización Automática

## 📱 Escenario 1: Trabajando en Campo (FUERA de la red)

```
┌─────────────────────────────────────────┐
│  👷 Trabajador en Campo                  │
│  (Sin conexión al servidor)              │
│                                          │
│  📱 PWA en el Celular                    │
│  ┌────────────────────────────────┐     │
│  │  🟡 MODO OFFLINE                │     │
│  │                                 │     │
│  │  ✍️ Llena formulario de CFE     │     │
│  │  ↓                              │     │
│  │  💾 Se guarda en IndexedDB      │     │
│  │     (base de datos local)       │     │
│  │                                 │     │
│  │  📝 Puede llenar múltiples      │     │
│  │     formularios sin problema    │     │
│  │                                 │     │
│  │  🔴 Banner: "Modo offline"      │     │
│  │     "3 formularios guardados"   │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘

✅ TODO FUNCIONA SIN INTERNET
✅ Datos 100% seguros en el celular
✅ Puede trabajar todo el día sin conexión
```

## 🏢 Escenario 2: Regresa a la Oficina (DENTRO de la red)

```
┌───────────────────────────────────────────────────────────────┐
│  🏠 Red Local de la Oficina                                   │
│                                                                │
│  📱 Celular se conecta al WiFi                                │
│  ┌──────────────────────┐      🔍 Detecta servidor cada 30s  │
│  │  PWA                  │ ─────────────────┐                 │
│  │  🟢 MODO ONLINE       │                  ↓                 │
│  └──────────────────────┘      ┌─────────────────────┐       │
│           │                     │  Servidor Ubuntu    │       │
│           │  🔄 Sincroniza      │  (192.168.1.100)   │       │
│           │     automáticamente │                     │       │
│           └────────────────────→│  💾 SQLite DB       │       │
│                                 │  📄 PDFs generados  │       │
│  ┌──────────────────────┐      └─────────────────────┘       │
│  │  🔄 Sincronizando...  │                                     │
│  │  Subiendo 3 forms     │                                     │
│  └──────────────────────┘                                     │
│           ↓                                                    │
│  ┌──────────────────────┐                                     │
│  │  ✅ Sincronizado      │                                     │
│  │  0 formularios pend.  │                                     │
│  └──────────────────────┘                                     │
└───────────────────────────────────────────────────────────────┘

✅ Sincronización AUTOMÁTICA sin botones
✅ Sube todos los formularios pendientes
✅ Borra datos locales después de confirmar
✅ Todo transparente para el usuario
```

## 🔧 Componentes Técnicos Implementados

### 1. `useNetworkSync.js` (Hook personalizado)
```javascript
Función: Detectar servidor y sincronizar
- Verifica servidor cada 30 segundos
- Escucha eventos de conexión del navegador
- Sincroniza automáticamente cuando detecta servidor
- Maneja cola de formularios pendientes
```

### 2. `NetworkStatus.jsx` (Componente visual)
```javascript
Función: Mostrar estado de sincronización
- 🟡 Banner amarillo: Offline + contador de formularios
- 🟢 Banner verde: Online + sincronizando
- 🔄 Animación durante sincronización
- ⏰ Última hora de sincronización
```

### 3. `formStore.js` (Almacenamiento)
```javascript
Función: Guardar formularios offline
- IndexedDB para persistencia local
- Cola de formularios pendientes
- Auto-sincronización cuando hay conexión
```

### 4. `api.js` (Cliente HTTP)
```javascript
Función: Detectar errores de red
- Timeout de 5 segundos
- Detecta cuando servidor no está disponible
- Retorna error especial para modo offline
```

## 🎯 Flujo Completo Paso a Paso

### 📝 Al llenar un formulario:

```
1. Trabajador abre la PWA
   └→ Se carga desde cache (funciona offline)

2. Llena el formulario
   └→ Auto-save en localStorage cada vez que escribe

3. Presiona "Enviar"
   └→ ¿Servidor disponible?
       ├→ SÍ: Envía directo al servidor ✅
       │      Genera PDF
       │      Confirma recepción
       │      Limpia formulario
       │
       └→ NO: Guarda en IndexedDB 💾
              Muestra mensaje "Guardado offline"
              Agrega a cola de pendientes
```

### 🔄 Al detectar conexión:

```
1. Hook verifica servidor cada 30 segundos
   └→ GET /api/health

2. Si responde OK:
   └→ Actualiza estado: serverAvailable = true

3. useEffect detecta el cambio
   └→ ¿Hay formularios pendientes?
       └→ SÍ: Inicia sincronización automática
              │
              ├→ Muestra banner "Sincronizando..."
              │
              ├→ Para cada formulario pendiente:
              │   ├→ POST /api/reports/generate
              │   ├→ Espera confirmación
              │   └→ Borra de IndexedDB
              │
              └→ Actualiza banner "✅ Sincronizado"
```

## 🌐 Configuración de Red

### IP del Servidor:
```
Router WiFi
   └─ 192.168.1.100 (Servidor Ubuntu)
      ├─ Backend: http://192.168.1.100:3000
      └─ Frontend: http://192.168.1.100

Dispositivos en la misma red:
   ├─ 📱 Celular 1: 192.168.1.101
   ├─ 📱 Celular 2: 192.168.1.102
   └─ 💻 Tablet: 192.168.1.103
```

### Importante:
- ✅ **Misma red WiFi**: Todos los dispositivos deben estar conectados al mismo router
- ✅ **IP fija**: El servidor debe tener siempre la misma IP (configurar en /etc/netplan)
- ✅ **Firewall**: Puerto 80 abierto en el servidor

## 🎨 Estados de la Interfaz

### 🔴 Offline (Fuera de la red)
```
┌────────────────────────────────┐
│ ⚠️ Modo offline                │
│                                 │
│ 3 formularios guardados offline│
│ Se sincronizarán al conectar   │
│ a la red.                       │
└────────────────────────────────┘
```

### 🟡 Online pero sincronizando
```
┌────────────────────────────────┐
│ 🔄 Sincronizando...            │
│                                 │
│ Subiendo datos al servidor...  │
│                                 │
│ [Botón: Sincronizar ahora]     │
└────────────────────────────────┘
```

### 🟢 Online y sincronizado
```
┌────────────────────────────────┐
│ ✅ Servidor conectado          │
│                                 │
│ 0 formularios listos para      │
│ sincronizar                     │
│                                 │
│ Última sincronización: 14:32   │
└────────────────────────────────┘
```

## 📊 Ventajas de esta Arquitectura

1. **🚀 Sin fricción**: No hay botones manuales de "sincronizar"
2. **💾 Datos seguros**: Todo se guarda localmente primero
3. **🔄 Auto-recuperación**: Si falla la sincronización, reintenta después
4. **📱 Offline-first**: Funciona perfectamente sin conexión
5. **🏢 Red local**: No depende de internet externo
6. **⚡ Rápido**: En la red local, la sincronización es instantánea
7. **🔒 Privado**: Los datos nunca salen de tu red local

## 🔐 Seguridad

- 🔑 **JWT Auth**: Token de autenticación en cada request
- 🔒 **Red privada**: Solo accesible en tu LAN
- 💾 **IndexedDB encriptado**: Los datos locales están protegidos
- 🚫 **Sin cloud**: Nada se sube a internet

## 💡 Casos de Uso

### Caso 1: Trabajo de campo
```
Mañana: Sale a revisar instalaciones
├→ Llena 5 formularios durante el día
└→ Todo guardado en el celular

Tarde: Regresa a la oficina
├→ Se conecta al WiFi
├→ Automáticamente sube los 5 formularios
├→ Admin puede verlos y descargar PDFs
└→ Todo sincronizado ✅
```

### Caso 2: Múltiples trabajadores
```
3 trabajadores en campo:
├→ Trabajador A: 3 formularios offline
├→ Trabajador B: 5 formularios offline
└→ Trabajador C: 2 formularios offline

Al regresar a la oficina:
└→ Todos se sincronizan automáticamente
   └→ Admin ve los 10 formularios en el dashboard
```

---

**Resumen**: La PWA funciona SIEMPRE, con o sin conexión. Cuando detecta tu servidor en la red local, sube todo automáticamente. Es como tener dos modos: trabajo de campo (offline) y oficina (online con sync).
