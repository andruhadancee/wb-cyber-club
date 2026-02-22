#!/bin/sh
set -e

SCHEMA="server/prisma/schema.prisma"

echo "[entrypoint] Parsing DATABASE_URL..."
PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PGDB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PGPASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

echo "[entrypoint] Connecting to $PGHOST:$PGPORT/$PGDB as $PGUSER"

# Wait for postgres
for i in $(seq 1 30); do
  if PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -c "SELECT 1" > /dev/null 2>&1; then
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
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
    -f "$MIGRATION_FILE" 2>&1
  echo "[entrypoint] ══ Custom SQL migration done ══"
fi

# ── 2. Verify critical columns exist ──
echo "[entrypoint] Verifying schema..."
CHECK=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -tAc \
  "SELECT count(*) FROM information_schema.columns WHERE table_name='tournaments' AND column_name='discipline_id'")
echo "[entrypoint] tournaments.discipline_id exists: $CHECK"

OLD_COL=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -tAc \
  "SELECT count(*) FROM information_schema.columns WHERE table_name='tournaments' AND column_name='discipline' AND data_type='character varying'")
echo "[entrypoint] tournaments.discipline (old varchar): $OLD_COL"

# Force drop old column if still present
if [ "$OLD_COL" = "1" ]; then
  echo "[entrypoint] Force dropping old tournaments.discipline column..."
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -c \
    "DROP INDEX IF EXISTS idx_tournaments_discipline; ALTER TABLE tournaments DROP COLUMN IF EXISTS discipline;" 2>&1
fi

# ── 3. Baseline resolve (one-time) ──
HAS_TABLE=$(PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" \
  -tAc "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations')" 2>/dev/null || echo "f")

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
