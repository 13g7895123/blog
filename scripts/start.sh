#!/bin/bash

# Blog Application - Start Script
# 啟動所有服務（首次部署或完整重啟）

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🚀 Starting Blog Application..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans 2>/dev/null || true

# Build and start all services
echo "🔨 Building and starting all services..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

# Health checks
echo ""
echo "🏥 Health Checks:"
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${NGINX_PORT:-8000}" 2>/dev/null || echo "000")
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT:-8080}" 2>/dev/null || echo "000")

echo "   Nginx:   HTTP $NGINX_STATUS"
echo "   Backend: HTTP $BACKEND_STATUS"

echo ""
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "304" ]; then
    echo "✅ Blog Application Started Successfully!"

    # Run database migrations
    echo ""
    echo "🔄 Running database migrations..."
    if docker compose exec -T backend php spark migrate; then
        echo "✅ Database migrations completed successfully!"
    else
        echo "⚠️  Database migrations failed!"
    fi
else
    echo "⚠️  Some services may not be ready. Check logs with: docker compose logs"
fi

echo ""
echo "🌐 Access URLs:"
source .env 2>/dev/null || true
echo "   Frontend: http://localhost:${NGINX_PORT:-8000}"
echo "   Backend:  http://localhost:${BACKEND_PORT:-8080}"
echo "   API:      http://localhost:${NGINX_PORT:-8000}/api/"
echo ""
echo "📋 Commands:"
echo "   Status:   ./scripts/status.sh"
echo "   Stop:     ./scripts/stop.sh"
echo "   Deploy:   ./scripts/deploy.sh"
echo "   Rollback: ./scripts/rollback.sh"
echo "   Logs:     docker compose logs -f"
