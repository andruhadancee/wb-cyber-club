#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

# ── 1. Custom SQL migration (one-time backfill) ──
MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "[migrate] Applying custom SQL migration..."
  psql "$DATABASE_URL" -f "$MIGRATION_FILE" 2>&1 || {
    echo "[migrate] WARNING: custom SQL migration failed (may already be applied)"
  }
fi

# ── 2. Baseline resolve (transition from db push → migrate) ──
HAS_TABLE=$(psql "$DATABASE_URL" -tAc \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

if [ "$HAS_TABLE" = "f" ] || [ "$HAS_TABLE" = "" ]; then
  echo "[migrate] First run — marking baseline as applied..."
  npx prisma migrate resolve --applied 0001_baseline --schema="$SCHEMA" 2>&1
fi

# ── 3. Apply pending migrations ──
echo "[migrate] Running prisma migrate deploy..."
npx prisma migrate deploy --schema="$SCHEMA" 2>&1

echo "[migrate] Done."
