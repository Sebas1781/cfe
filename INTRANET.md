# Plataforma CFE — Operación en el servidor (intranet)

Guía de lo que está configurado en el servidor Ubuntu y cómo operarlo en la intranet.
Complementa a `DEPLOY_UBUNTU.md` (instalación desde cero).

## 1. Cómo está configurado

| Pieza | Detalle |
|---|---|
| Sistema | Ubuntu 26.04 (sudo es `sudo-rs`) |
| Node | v22 de Ubuntu (el repo de NodeSource quedó deshabilitado en la actualización) |
| Backend | PM2, proceso `cfe-backend`, puerto 3000 solo para nginx |
| Frontend | `~/cfe/dist`, servido por nginx |
| Nginx | `/etc/nginx/sites-available/cfe`: 443 con SSL, el 80 redirige a https |
| Respaldo nginx | `/etc/nginx/sites-available/cfe.bak-http` (versión solo http) |
| Sitio viejo | `plataforma-cfe` desactivado (el archivo sigue en `sites-available`) |
| Certificado | `/etc/ssl/certs/cfe.crt` + `/etc/ssl/private/cfe.key`, autofirmado, válido hasta 2036 |
| IPs del certificado | `10.9.179.124` (intranet) y `192.168.1.198` (red temporal) |
| Firewall (ufw) | 22, 80, 443 (y 3000, pendiente de cerrar) |
| Base de datos | `~/cfe/server/database/plataformaCFE.db` (restaurada de la instalación anterior en `/var/www/plataforma-cfe`) |

## 2. Dónde se guardan los archivos

```
~/cfe/server/reports/
├── subidas/               fotos recién subidas, sin reporte guardado todavía
├── fotos/<folio>/         fotos de cada reporte: <campo>_<n>.<ext>  (gabinete_1.jpg, radio_1.png…)
├── pdf/<folio>.pdf        PDF de cada reporte (se reemplaza al editar)
└── excel/<folio>.xlsx     Excel de cada reporte
```

- El folio es el que aparece en la app (ej. `CFE-1791413453849`).
- Al borrar un reporte desde la app se borran su carpeta de fotos, su PDF y su Excel.
- Ver una foto: `https://10.9.179.124/reports/fotos/<folio>/<archivo>`
- `subidas/` debería estar casi vacía; lo que quede ahí son fotos de reportes que nunca se guardaron.
  No se borran solas porque un reporte guardado sin conexión puede tardar días en sincronizar.
- Reportes anteriores a este orden: `node organizar-reportes.js` (desde `server/`) los migra.
  Sin `--aplicar` solo simula; `--origen /var/www/plataforma-cfe/server` busca archivos en la instalación vieja.

**Respaldos:** `deploy.sh` solo respalda la base de datos (en `~/cfe-backups/`, conserva 10).
Las fotos y PDF **no** se respaldan solos ni van a GitHub: copia periódicamente
`~/cfe/server/reports/` y `~/cfe/server/database/` a otro disco o equipo.

## 3. Antes de llevar el servidor a la intranet (con internet)

1. Instalar npm (lo necesita `deploy.sh`):
   ```
   sudo apt install npm
   ```
2. Reiniciar y comprobar que la app vuelve sola:
   ```
   sudo reboot
   pm2 ls                                    # cfe-backend online
   curl -s http://localhost:3000/api/health  # {"status":"OK"...}
   ```
3. Conseguir la **puerta de enlace (gateway)** y la máscara de la intranet
   (sistemas, o `ipconfig` en una PC de esa red).
4. Seguridad:
   - Cambiar la contraseña del usuario de Ubuntu: `passwd`
   - Cambiar la contraseña del admin `00001` (Perfil → Cambiar contraseña, o
     `cd ~/cfe/server && ADMIN_PASSWORD='NuevaClave' node seed-admin.js`)
   - Cambiar o borrar el usuario de prueba `12345`
   - Cerrar el puerto 3000: `sudo ufw delete allow 3000/tcp && sudo ufw delete allow 3000`

## 4. Al llegar a la intranet

**1. Entrar por consola física** (monitor y teclado): todavía no se sabe qué IP tomó.

**2. Ver la IP:**
```
ip -br addr
```
Si ya muestra `10.9.179.124`, ir al paso 4.

**3. Fijar la IP** (cambia `GATEWAY`; ajusta `/24` si la máscara es otra):
```
sudo nmcli con add type ethernet ifname enp1s0 con-name cfe-intranet \
  ipv4.method manual ipv4.addresses 10.9.179.124/24 ipv4.gateway GATEWAY \
  ipv4.dns "10.9.1.25 10.222.8.146" connection.autoconnect-priority 10
sudo nmcli con up cfe-intranet
ip -br addr
```
Los DNS son los que usaba el servidor en la intranet según sus registros; confírmalos con sistemas.
Para volver a una red con DHCP (ej. la de casa): `sudo nmcli con up "Profile 1"`.

**4. Verificar el servidor:**
```
ping -c3 GATEWAY
pm2 ls
curl -s --cacert /etc/ssl/certs/cfe.crt https://10.9.179.124/api/health
```

**5. Probar desde un teléfono/PC:** abrir `https://10.9.179.124` → debe abrir con candado.

**6. Reinstalar la app (PWA) en cada teléfono.** `192.168.1.198` y `10.9.179.124` son sitios distintos
para el navegador: la sesión, la app instalada y los reportes pendientes no pasan de uno a otro.
Antes de borrar la app de prueba, confirma que no tenga reportes pendientes de sincronizar.
Luego entra a `https://10.9.179.124`, inicia sesión y vuelve a instalarla.

**7. VPN / Starlink:** sistemas debe permitir llegar a `10.9.179.124` puerto **443** desde la VPN.

## 5. Certificado en teléfonos y PCs

- **No hay que reinstalarlo al cambiar de red**: el mismo certificado cubre las dos IPs.
- Solo se reinstala si se regenera (por ejemplo, si cambia la IP del servidor).
- Teléfonos nuevos (Android): abrir `https://10.9.179.124/cfe.crt` (aceptar la advertencia) →
  Ajustes → Seguridad → Cifrado y credenciales → Instalar un certificado → **Certificado de CA**.
  Requiere bloqueo de pantalla. Luego cerrar Chrome y abrir `https://10.9.179.124`.
- **iPhone:** no acepta este certificado (iOS exige máximo 825 días de validez). Si se necesita,
  hay que regenerarlo con `-days 825` y reinstalarlo en todos los equipos.

Regenerar (si cambia la IP; ajusta las IPs):
```
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/cfe.key -out /etc/ssl/certs/cfe.crt \
  -subj "/CN=10.9.179.124" \
  -addext "subjectAltName=IP:10.9.179.124,IP:192.168.1.198" \
  -addext "extendedKeyUsage=serverAuth"
sudo chmod 600 /etc/ssl/private/cfe.key
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Actualizar la app (deploy)

En tu PC: `git add -A && git commit -m "..." && git push origin main`

En el servidor:
```
cd ~/cfe && bash deploy/deploy.sh
```
- Si dice "Ya estás en la última versión", el servidor ya tiene ese código. `FORCE=1 bash deploy/deploy.sh` reconstruye igual.
- Necesita **internet** (GitHub y npm). Sin internet en la intranet no funciona.
- El servidor sube/baja de GitHub por SSH (llave `~/.ssh/id_ed25519` registrada en la cuenta).
- Después de un deploy, los teléfonos toman la versión nueva al abrir la app dos veces.

## 7. Si algo falla

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| No aparece 10.9.179.124 | El perfil no se activó | `sudo nmcli con up cfe-intranet`, revisar gateway |
| La conexión se corta a ratos | Otro equipo usa la misma IP (pasó el 2-oct, MAC `B4:89:01:C6:A4:7B`) | Pedir a sistemas que reserven la IP |
| "La conexión no es privada" | Ese equipo no tiene el certificado | Instalar desde `/cfe.crt` |
| La página abre pero no carga datos | Backend caído | `pm2 ls`, `pm2 logs cfe-backend --lines 100` |
| Errores 500 / "no such table" | Base incompleta | Revisar `pm2 logs`; respaldos en `~/cfe-backups/` |
| El mapa no carga | Google Maps necesita internet | Normal sin salida a internet |
| `deploy.sh` falla en `npm ci` | Falta npm o no hay internet | `sudo apt install npm` con internet |

Comandos útiles:
```
pm2 ls && pm2 logs cfe-backend --lines 100
sudo tail -f /var/log/nginx/error.log
sudo ufw status
ls ~/cfe/server/reports/fotos/ ~/cfe/server/reports/pdf/
ls ~/cfe-backups/
```
