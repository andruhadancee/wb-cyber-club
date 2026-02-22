#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

echo "[migrate] Parsing DATABASE_URL..."
PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PGDB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PGPASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

# ── 1. Custom SQL migration (one-time backfill) ──
MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "[migrate] Applying custom SQL migration..."
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -f "$MIGRATION_FILE" 2>&1 || {
    echo "[migrate] WARNING: custom SQL migration failed (may already be applied)"
  }
fi

# ── 2. Baseline resolve (transition from db push → migrate) ──
HAS_TABLE=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
  -tAc "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

if [ "$HAS_TABLE" = "f" ] || [ "$HAS_TABLE" = "" ]; then
  echo "[migrate] First run — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1
fi

# ── 3. Apply pending migrations ──
echo "[migrate] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1

echo "[migrate] Done."
