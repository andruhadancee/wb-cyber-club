#!/bin/sh
set -e

echo "[entrypoint] Syncing database schema..."
npx prisma db push --schema=server/prisma/schema.prisma --skip-generate 2>&1 || {
  echo "[entrypoint] WARNING: prisma db push failed, starting server anyway..."
}

echo "[entrypoint] Starting server..."
exec node server/dist/index.js
