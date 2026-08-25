#!/bin/sh
set -e

# Railway (and most container hosts) give the app a single persistent volume.
# We mount it at /app/persistent and keep everything that must survive a
# redeploy there: the SQLite database and uploaded/generated files. The app
# code itself always reads/writes "public/uploads", so we symlink that path
# into the volume instead of changing application code.
PERSIST_DIR="${PERSIST_DIR:-/app/persistent}"
mkdir -p "$PERSIST_DIR/uploads"

if [ -e "public/uploads" ] && [ ! -L "public/uploads" ]; then
  rm -rf "public/uploads"
fi
if [ ! -L "public/uploads" ]; then
  ln -s "$PERSIST_DIR/uploads" "public/uploads"
fi

export DATABASE_URL="file:$PERSIST_DIR/app.db"

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Seeding baseline data (idempotent)..."
npx tsx prisma/seed.ts || true

echo "Starting Next.js on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
