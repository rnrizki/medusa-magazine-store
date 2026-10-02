#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 Medusa v2 Container Entrypoint Starting..."
echo "=========================================================="

# 1. Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-medusa_db}"; do
  echo "Database not ready yet. Retrying in 2 seconds..."
  sleep 2
done
echo "✅ PostgreSQL is ready and accepting connections!"

# 2. Run Database Migrations
echo "🔄 Running Medusa database migrations (npx medusa db:migrate)..."
npx medusa db:migrate

# 3. Create Admin User if configured
if [ -n "$MEDUSA_ADMIN_EMAIL" ] && [ -n "$MEDUSA_ADMIN_PASSWORD" ]; then
  echo "👤 Checking / creating Admin user: $MEDUSA_ADMIN_EMAIL..."
  npx medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" || true
  echo "✅ Admin user ready."
fi

# 4. Optional Seeding
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Running seed script..."
  npm run seed || true
fi

echo "=========================================================="
echo "✨ Starting Medusa Server on port 9000..."
echo "👉 Admin Dashboard will be at: http://localhost:9000/app"
echo "=========================================================="

exec "$@"
