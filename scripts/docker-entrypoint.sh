#!/bin/sh
set -e

echo "[entrypoint] Running custom migrations..."
PGHOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PGPORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PGDB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PGUSER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
PGPASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

MIGRATION_FILE="./scripts/migrate-discipline-id.sql"
if [ -f "$MIGRATION_FILE" ]; then
  echo "[entrypoint] Applying discipline_id migration..."
  PGPASSWORD="$PGPASS" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDB" -f "$MIGRATION_FILE" 2>&1 || {
    echo "[entrypoint] WARNING: discipline_id migration failed (may already be applied)"
  }
fi

echo "[entrypoint] Syncing database schema..."
npx prisma db push --schema=server/prisma/schema.prisma --skip-generate 2>&1 || {
  echo "[entrypoint] WARNING: prisma db push failed, starting server anyway..."
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
