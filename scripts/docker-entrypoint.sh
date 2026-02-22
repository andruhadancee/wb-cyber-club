#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

# ── 1. Custom SQL migration (backfill discipline_id, add new columns) ──
echo "[entrypoint] Running custom SQL migration..."
PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PGDB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PGPASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -f "$MIGRATION_FILE" 2>&1 || {
    echo "[entrypoint] WARNING: custom migration failed (may already be applied)"
  }
fi

# ── 2. Mark baseline as applied if migrating from db push ──
HAS_MIGRATIONS=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
  -tAc "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

if [ "$HAS_MIGRATIONS" = "f" ] || [ "$HAS_MIGRATIONS" = "" ]; then
  echo "[entrypoint] First run with prisma migrate — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1 || {
    echo "[entrypoint] WARNING: could not resolve baseline"
  }
fi

# ── 3. Apply pending migrations ──
echo "[entrypoint] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1 || {
  echo "[entrypoint] WARNING: prisma migrate deploy failed, starting server anyway..."
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
