#!/usr/bin/env bash
# Actualiza la Plataforma CFE en el servidor Ubuntu.
# Uso:  ./deploy/deploy.sh [rama]     (por defecto: main)
set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PM2_NAME="cfe-backend"
DB_FILE="$APP_DIR/server/database/plataformaCFE.db"
BACKUP_DIR="$HOME/cfe-backups"

cd "$APP_DIR"

echo "==> Backup de la base de datos"
mkdir -p "$BACKUP_DIR"
if [ -f "$DB_FILE" ]; then
  cp "$DB_FILE" "$BACKUP_DIR/plataformaCFE_$(date +%Y%m%d_%H%M%S).db"
  ls -1t "$BACKUP_DIR"/*.db | tail -n +11 | xargs -r rm --   # conserva los 10 últimos
fi

echo "==> Buscando actualizaciones en origin/$BRANCH"
git fetch origin "$BRANCH"
if [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$BRANCH")" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "Ya estás en la última versión. (usa FORCE=1 para reconstruir igual)"
  exit 0
fi
git pull --ff-only origin "$BRANCH"

echo "==> Dependencias y build del frontend"
npm ci
npm run build

echo "==> Dependencias del backend"
(cd server && npm ci --omit=dev)

echo "==> Reiniciando backend"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

sleep 2
echo "==> Health check"
curl -fsS http://localhost:3000/api/health && echo
echo "✅ Deploy terminado: $(git log -1 --format='%h %s')"
