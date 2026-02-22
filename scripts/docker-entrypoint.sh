#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

echo "[entrypoint] Parsing DATABASE_URL..."
PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PGDB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PGPASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

# Wait for postgres
echo "[entrypoint] Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -c "SELECT 1" > /dev/null 2>&1; then
    echo "[entrypoint] PostgreSQL ready."
    break
  fi
  echo "[entrypoint] Waiting... ($i/30)"
  sleep 2
done

# ── 1. Custom SQL migration ──
MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "[entrypoint] Applying custom SQL migration..."
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
    --set ON_ERROR_STOP=on -f "$MIGRATION_FILE" 2>&1 || {
    echo "[entrypoint] WARNING: custom SQL failed (may already be applied)"
  }
fi

# ── 2. Baseline resolve (one-time, переход с db push на migrate) ──
HAS_TABLE=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
  -tAc "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

if [ "$HAS_TABLE" = "f" ] || [ "$HAS_TABLE" = "" ]; then
  echo "[entrypoint] First run — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1 || true
fi

# ── 3. Apply pending Prisma migrations ──
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1 || {
  echo "[entrypoint] WARNING: prisma migrate deploy had issues"
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
