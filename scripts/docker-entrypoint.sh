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

# Check if this is an existing DB (has app tables but no _prisma_migrations)
HAS_MIGRATIONS=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

HAS_APP_TABLES=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='tournaments')" 2>/dev/null || echo "f")

echo "[entrypoint] _prisma_migrations exists: $HAS_MIGRATIONS, app tables exist: $HAS_APP_TABLES"

# ── 1. Custom SQL migration (only on existing DBs without prisma migrations) ──
MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ "$HAS_APP_TABLES" = "t" ] && [ -f "$MIGRATION_FILE" ]; then
  echo "[entrypoint] Applying custom SQL migration..."
  psql "$DATABASE_URL" -f "$MIGRATION_FILE" 2>&1 || true
fi

# ── 2. Baseline resolve (only for existing DBs transitioning to prisma migrate) ──
if [ "$HAS_MIGRATIONS" = "f" ] && [ "$HAS_APP_TABLES" = "t" ]; then
  echo "[entrypoint] Existing DB without migrations — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1 || true
fi

# ── 3. Apply pending Prisma migrations ──
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1 || {
  echo "[entrypoint] WARNING: prisma migrate deploy had issues"
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
