#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

echo "[entrypoint] Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "[entrypoint] PostgreSQL ready."
    break
  fi
  echo "[entrypoint] Waiting for PostgreSQL... ($i/30)"
  sleep 2
done

# ── 1. Custom SQL migration (no ON_ERROR_STOP — continue on partial errors) ──
MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "[entrypoint] ══ Applying custom SQL migration ══"
  psql "$DATABASE_URL" -f "$MIGRATION_FILE" 2>&1 || true
  echo "[entrypoint] ══ Custom SQL migration done ══"
fi

# ── 2. Verify critical columns exist ──
echo "[entrypoint] Verifying schema..."
CHECK=$(psql "$DATABASE_URL" -tAc \
  "SELECT count(*) FROM information_schema.columns WHERE table_name='tournaments' AND column_name='discipline_id'" 2>/dev/null || echo "0")
echo "[entrypoint] tournaments.discipline_id exists: $CHECK"

OLD_COL=$(psql "$DATABASE_URL" -tAc \
  "SELECT count(*) FROM information_schema.columns WHERE table_name='tournaments' AND column_name='discipline' AND data_type='character varying'" 2>/dev/null || echo "0")
echo "[entrypoint] tournaments.discipline (old varchar): $OLD_COL"

if [ "$OLD_COL" = "1" ]; then
  echo "[entrypoint] Force dropping old tournaments.discipline column..."
  psql "$DATABASE_URL" -c \
    "DROP INDEX IF EXISTS idx_tournaments_discipline; ALTER TABLE tournaments DROP COLUMN IF EXISTS discipline;" 2>&1 || true
fi

# ── 3. Baseline resolve (one-time) ──
HAS_TABLE=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

if [ "$HAS_TABLE" = "f" ] || [ "$HAS_TABLE" = "" ]; then
  echo "[entrypoint] First run — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1 || true
fi

# ── 4. Apply pending Prisma migrations ──
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1 || {
  echo "[entrypoint] WARNING: prisma migrate deploy had issues"
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
