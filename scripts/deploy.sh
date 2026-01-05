#!/bin/bash

# Blog Application - Deploy Script
# 藍綠部署腳本 - 部署到非活躍環境，健康檢查後切換

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Load environment variables
source .env 2>/dev/null || source .env.example 2>/dev/null || true
NGINX_PORT="${NGINX_PORT:-8000}"

# Configuration
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=3
CONTAINER_READY_TIMEOUT=30

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🚀 Blue-Green Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================
# 前置檢查
# ============================================
echo -e "${CYAN}📋 Pre-deployment checks...${NC}"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Check if nginx config directory exists
if [ ! -d "nginx" ]; then
    echo -e "${RED}❌ nginx directory not found!${NC}"
    exit 1
fi

# Check if nginx.conf exists
if [ ! -f "nginx/nginx.conf" ]; then
    echo -e "${RED}❌ nginx/nginx.conf not found!${NC}"
    exit 1
fi

# Determine current active color
if grep -q "proxy_pass http://frontend_green" nginx/nginx.conf; then
    CURRENT_COLOR="green"
    TARGET_COLOR="blue"
else
    CURRENT_COLOR="blue"
    TARGET_COLOR="green"
fi

# Check if target nginx config exists
if [ ! -f "nginx/nginx.$TARGET_COLOR.conf" ]; then
    echo -e "${RED}❌ nginx/nginx.$TARGET_COLOR.conf not found!${NC}"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All pre-deployment checks passed${NC}"
echo ""

# ============================================
# 顯示部署資訊
# ============================================
echo -e "${YELLOW}📍 Current Active Environment: ${CURRENT_COLOR}${NC}"
echo -e "${YELLOW}🎯 Target Deployment Environment: ${TARGET_COLOR}${NC}"
echo -e "${YELLOW}🔌 Nginx Port: ${NGINX_PORT}${NC}"
echo ""

# ============================================
# 建置目標環境
# ============================================
echo -e "${CYAN}🔨 Building frontend-${TARGET_COLOR}...${NC}"
if ! docker compose build "frontend-$TARGET_COLOR"; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# ============================================
# 啟動目標容器
# ============================================
echo -e "${CYAN}🔄 Starting frontend-${TARGET_COLOR}...${NC}"
if ! docker compose up -d "frontend-$TARGET_COLOR"; then
    echo -e "${RED}❌ Failed to start container!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Container started${NC}"
echo ""

# ============================================
# 等待容器就緒
# ============================================
echo -e "${CYAN}⏳ Waiting for container to be ready...${NC}"
CONTAINER_NAME="blog-frontend-$TARGET_COLOR"
WAIT_TIME=0

while [ $WAIT_TIME -lt $CONTAINER_READY_TIMEOUT ]; do
    CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "not_found")
    
    if [ "$CONTAINER_STATUS" = "running" ]; then
        echo -e "${GREEN}✓ Container is running${NC}"
        break
    elif [ "$CONTAINER_STATUS" = "not_found" ]; then
        echo -e "${RED}❌ Container not found: $CONTAINER_NAME${NC}"
        exit 1
    elif [ "$CONTAINER_STATUS" = "exited" ] || [ "$CONTAINER_STATUS" = "dead" ]; then
        echo -e "${RED}❌ Container failed to start (Status: $CONTAINER_STATUS)${NC}"
        echo ""
        echo -e "${YELLOW}Container logs:${NC}"
        docker logs "$CONTAINER_NAME" --tail 50
        exit 1
    fi
    
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
    echo -n "."
done
echo ""

if [ $WAIT_TIME -ge $CONTAINER_READY_TIMEOUT ]; then
    echo -e "${RED}❌ Container failed to start within ${CONTAINER_READY_TIMEOUT}s${NC}"
    exit 1
fi

# Additional wait for application initialization
echo -e "${CYAN}⏳ Waiting for application initialization...${NC}"
sleep 5
echo ""

# ============================================
# 健康檢查（帶重試機制）
# ============================================
echo -e "${CYAN}🏥 Health checking frontend-${TARGET_COLOR}...${NC}"
HEALTH_CHECK_PASSED=false

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    echo -e "${YELLOW}   Attempt $i/$HEALTH_CHECK_RETRIES...${NC}"
    
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/health/$TARGET_COLOR" 2>/dev/null || echo "000")
    
    if [ "$HEALTH_CHECK" = "200" ] || [ "$HEALTH_CHECK" = "304" ]; then
        echo -e "${GREEN}✅ Health check passed! (HTTP $HEALTH_CHECK)${NC}"
        HEALTH_CHECK_PASSED=true
        break
    else
        echo -e "${YELLOW}   ⏳ HTTP $HEALTH_CHECK - Retrying in ${HEALTH_CHECK_INTERVAL}s...${NC}"
        if [ $i -lt $HEALTH_CHECK_RETRIES ]; then
            sleep $HEALTH_CHECK_INTERVAL
        fi
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    echo ""
    echo -e "${RED}❌ Health check failed after $HEALTH_CHECK_RETRIES attempts${NC}"
    echo ""
    echo -e "${YELLOW}=== Troubleshooting Information ===${NC}"
    echo -e "${CYAN}Container Status:${NC}"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${CYAN}Recent Container Logs:${NC}"
    docker logs "$CONTAINER_NAME" --tail 30
    echo ""
    echo -e "${CYAN}Nginx Status:${NC}"
    docker ps --filter "name=blog-nginx" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo -e "${RED}⚠️  Deployment aborted. Active environment remains: ${CURRENT_COLOR}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Debug commands:${NC}"
    echo "   docker logs $CONTAINER_NAME"
    echo "   docker logs blog-nginx"
    echo "   docker exec $CONTAINER_NAME ps aux"
    echo "   curl -v http://localhost:$NGINX_PORT/health/$TARGET_COLOR"
    exit 1
fi

echo ""

# ============================================
# 切換流量到新環境
# ============================================
echo -e "${CYAN}🔀 Switching nginx to ${TARGET_COLOR}...${NC}"
if ! cp "nginx/nginx.$TARGET_COLOR.conf" nginx/nginx.conf; then
    echo -e "${RED}❌ Failed to update nginx config!${NC}"
    exit 1
fi

if ! docker compose restart nginx; then
    echo -e "${RED}❌ Failed to restart nginx!${NC}"
    echo -e "${YELLOW}⚠️  Manual intervention required!${NC}"
    exit 1
fi

# Wait for nginx to reload
sleep 2

# Verify nginx is still healthy
NGINX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/" 2>/dev/null || echo "000")
if [ "$NGINX_CHECK" != "200" ] && [ "$NGINX_CHECK" != "304" ]; then
    echo -e "${RED}❌ Nginx health check failed after switch (HTTP $NGINX_CHECK)!${NC}"
    echo -e "${YELLOW}⚠️  Rolling back...${NC}"
    cp "nginx/nginx.$CURRENT_COLOR.conf" nginx/nginx.conf
    docker compose restart nginx
    exit 1
fi

echo -e "${GREEN}✓ Nginx switched successfully${NC}"
echo ""

# ============================================
# 部署完成
# ============================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}📍 Active Environment: ${TARGET_COLOR}${NC}"
echo -e "${CYAN}💤 Standby Environment: ${CURRENT_COLOR}${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "   • Check status:  ./scripts/status.sh"
echo "   • View logs:     docker compose logs -f frontend-$TARGET_COLOR"
echo "   • Rollback:      ./scripts/rollback.sh"
echo ""
