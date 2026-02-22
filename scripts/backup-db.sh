#!/bin/sh
# ── PostgreSQL backup script ──
# Создает gzip-дамп базы данных и удаляет бэкапы старше 14 дней.
#
# Использование:
#   ./scripts/backup-db.sh                   (prod — docker-compose.yml)
#   ./scripts/backup-db.sh staging           (dev  — docker-compose.staging.yml)
#
# Cron (каждый день в 3:00):
#   0 3 * * * /opt/wb-cyber-club/scripts/backup-db.sh >> /var/log/wb-backup.log 2>&1

set -e

ENV="${1:-prod}"
BACKUP_DIR="/opt/backups/wb-cyber-club/${ENV}"
KEEP_DAYS=14
DATE=$(date +%Y%m%d_%H%M%S)

if [ "$ENV" = "staging" ] || [ "$ENV" = "dev" ]; then
  CONTAINER="wb-cyber-club-dev-postgres-dev-1"
  DB_USER="cyberclub"
else
  CONTAINER="wb-cyber-club-postgres-1"
  DB_USER="${POSTGRES_USER:-cyberclub}"
fi

# Создать директорию если не существует
mkdir -p "$BACKUP_DIR"

FILENAME="${BACKUP_DIR}/cyberclub_${ENV}_${DATE}.sql.gz"

echo "[backup] $(date) — Starting ${ENV} backup..."
echo "[backup] Container: ${CONTAINER}, User: ${DB_USER}"

# Создать дамп
docker exec "$CONTAINER" pg_dump -U "$DB_USER" cyberclub | gzip > "$FILENAME"

# Проверить что файл не пустой
SIZE=$(stat -c%s "$FILENAME" 2>/dev/null || stat -f%z "$FILENAME" 2>/dev/null || echo 0)
if [ "$SIZE" -lt 100 ]; then
  echo "[backup] ERROR: Backup file is too small (${SIZE} bytes), something went wrong"
  rm -f "$FILENAME"
  exit 1
fi

echo "[backup] OK — ${FILENAME} ($(du -h "$FILENAME" | cut -f1))"

# Удалить старые бэкапы
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${KEEP_DAYS} -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[backup] Cleaned up ${DELETED} old backup(s) (older than ${KEEP_DAYS} days)"
fi

echo "[backup] Done."
