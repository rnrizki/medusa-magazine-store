#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🛍️  Medusa v2 Full-Stack Ecommerce Docker Launcher"
echo "=========================================================="

# 1. Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "⚠️  Docker is not currently running!"
  echo "Please start Docker Desktop on macOS:"
  echo "  👉 Run: open -a Docker"
  echo "Wait a few moments for Docker to finish initializing, then re-run this script."
  exit 1
fi

# 2. Check for .env file
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
fi

# 3. Build and launch containers
echo "🚀 Building and starting containers with Docker Compose..."
docker compose up --build -d

echo ""
echo "=========================================================="
echo "✅ Medusa Ecommerce Stack is spinning up!"
echo "=========================================================="
echo "🌐 Storefront:          http://localhost:8000"
echo "📊 Admin Dashboard:     http://localhost:9000/app"
echo "🔌 Medusa REST API:     http://localhost:9000"
echo "🩺 Health Check:        http://localhost:9000/health"
echo "----------------------------------------------------------"
echo "🔑 Default Admin Credentials:"
echo "   Email:    admin@medusa-store.com"
echo "   Password: supersecret"
echo "----------------------------------------------------------"
echo "To view live logs from all containers, run:"
echo "   docker compose logs -f"
echo "=========================================================="
