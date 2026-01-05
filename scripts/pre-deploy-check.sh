#!/bin/bash

# Blog Application - Pre-deployment Check Script
# 部署前檢查腳本 - 確保環境配置正確

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   🔍 Pre-deployment Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check and report
check_passed() {
    echo -e "${GREEN}✓${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_failed() {
    echo -e "${RED}✗${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ============================================
# 1. Docker 環境檢查
# ============================================
echo -e "${CYAN}📦 Docker Environment${NC}"

if docker info > /dev/null 2>&1; then
    check_passed "Docker is running"
    DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null)
    echo "   Version: $DOCKER_VERSION"
else
    check_failed "Docker is not running"
fi

if docker compose version > /dev/null 2>&1; then
    check_passed "Docker Compose is available"
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null)
    echo "   Version: $COMPOSE_VERSION"
else
    check_failed "Docker Compose is not available"
fi

echo ""

# ============================================
# 2. 檔案結構檢查
# ============================================
echo -e "${CYAN}📁 File Structure${NC}"

# Check critical files
declare -a REQUIRED_FILES=(
    "docker-compose.yml"
    "nginx/nginx.conf"
    "nginx/nginx.blue.conf"
    "nginx/nginx.green.conf"
    "nginx/Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_passed "$file exists"
    else
        check_failed "$file missing"
    fi
done

# Check critical directories
declare -a REQUIRED_DIRS=(
    "frontend"
    "backend"
    "nginx"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_passed "$dir/ directory exists"
    else
        check_failed "$dir/ directory missing"
    fi
done

echo ""

# ============================================
# 3. 環境變數檢查
# ============================================
echo -e "${CYAN}⚙️  Environment Variables${NC}"

if [ -f ".env" ]; then
    check_passed ".env file exists"
    source .env
elif [ -f ".env.example" ]; then
    check_warning ".env file missing (using .env.example)"
    source .env.example
else
    check_failed "No .env or .env.example found"
fi

# Check important variables
if [ -n "$NGINX_PORT" ]; then
    check_passed "NGINX_PORT is set ($NGINX_PORT)"
else
    check_warning "NGINX_PORT not set (will use default 8000)"
fi

if [ -n "$POSTGRES_DB" ]; then
    check_passed "POSTGRES_DB is set"
else
    check_warning "POSTGRES_DB not set"
fi

echo ""

# ============================================
# 4. 端口可用性檢查
# ============================================
echo -e "${CYAN}🔌 Port Availability${NC}"

NGINX_PORT="${NGINX_PORT:-8000}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
DB_PORT="${DB_PORT:-5433}"

check_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PROCESS=$(lsof -Pi :$port -sTCP:LISTEN | tail -n 1 | awk '{print $1}')
        check_warning "Port $port ($name) is in use by $PROCESS"
    else
        check_passed "Port $port ($name) is available"
    fi
}

check_port "$NGINX_PORT" "Nginx"
check_port "$BACKEND_PORT" "Backend"
check_port "$DB_PORT" "Database"

echo ""

# ============================================
# 5. 容器狀態檢查
# ============================================
echo -e "${CYAN}🐳 Container Status${NC}"

NGINX_CONTAINER=$(docker ps --filter "name=blog-nginx" --format "{{.Names}}" 2>/dev/null | head -n 1)
BLUE_CONTAINER=$(docker ps --filter "name=blog-frontend-blue" --format "{{.Names}}" 2>/dev/null | head -n 1)
GREEN_CONTAINER=$(docker ps --filter "name=blog-frontend-green" --format "{{.Names}}" 2>/dev/null | head -n 1)
BACKEND_CONTAINER=$(docker ps --filter "name=blog-backend" --format "{{.Names}}" 2>/dev/null | head -n 1)
DB_CONTAINER=$(docker ps --filter "name=blog-db" --format "{{.Names}}" 2>/dev/null | head -n 1)

if [ -n "$NGINX_CONTAINER" ]; then
    check_passed "Nginx container is running"
else
    check_warning "Nginx container is not running"
fi

if [ -n "$BLUE_CONTAINER" ]; then
    check_passed "Frontend-blue container is running"
else
    check_warning "Frontend-blue container is not running"
fi

if [ -n "$GREEN_CONTAINER" ]; then
    check_passed "Frontend-green container is running"
else
    check_warning "Frontend-green container is not running"
fi

if [ -n "$BACKEND_CONTAINER" ]; then
    check_passed "Backend container is running"
else
    check_warning "Backend container is not running"
fi

if [ -n "$DB_CONTAINER" ]; then
    check_passed "Database container is running"
else
    check_warning "Database container is not running"
fi

echo ""

# ============================================
# 6. 當前活躍環境檢查
# ============================================
echo -e "${CYAN}🎯 Active Environment${NC}"

if grep -q "proxy_pass http://frontend_green" nginx/nginx.conf 2>/dev/null; then
    CURRENT_COLOR="green"
    TARGET_COLOR="blue"
elif grep -q "proxy_pass http://frontend_blue" nginx/nginx.conf 2>/dev/null; then
    CURRENT_COLOR="blue"
    TARGET_COLOR="green"
else
    CURRENT_COLOR="unknown"
    TARGET_COLOR="unknown"
    check_failed "Cannot determine active environment"
fi

if [ "$CURRENT_COLOR" != "unknown" ]; then
    check_passed "Current active: $CURRENT_COLOR"
    echo "   Next deployment target: $TARGET_COLOR"
fi

echo ""

# ============================================
# 7. 網路連通性檢查
# ============================================
echo -e "${CYAN}🌐 Network Connectivity${NC}"

if [ -n "$NGINX_CONTAINER" ]; then
    HEALTH_BLUE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/health/blue" 2>/dev/null || echo "000")
    HEALTH_GREEN=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/health/green" 2>/dev/null || echo "000")
    HEALTH_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/health/backend" 2>/dev/null || echo "000")
    
    if [ "$HEALTH_BLUE" = "200" ] || [ "$HEALTH_BLUE" = "304" ]; then
        check_passed "Frontend-blue is healthy (HTTP $HEALTH_BLUE)"
    else
        check_warning "Frontend-blue is not responding (HTTP $HEALTH_BLUE)"
    fi
    
    if [ "$HEALTH_GREEN" = "200" ] || [ "$HEALTH_GREEN" = "304" ]; then
        check_passed "Frontend-green is healthy (HTTP $HEALTH_GREEN)"
    else
        check_warning "Frontend-green is not responding (HTTP $HEALTH_GREEN)"
    fi
    
    if [ "$HEALTH_BACKEND" = "200" ] || [ "$HEALTH_BACKEND" = "304" ]; then
        check_passed "Backend is healthy (HTTP $HEALTH_BACKEND)"
    else
        check_warning "Backend is not responding (HTTP $HEALTH_BACKEND)"
    fi
else
    check_warning "Cannot check health endpoints (Nginx not running)"
fi

echo ""

# ============================================
# 總結
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   📊 Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓ Passed:  $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${RED}✗ Failed:  $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ Pre-deployment check failed!${NC}"
    echo -e "${YELLOW}Please fix the errors before deploying.${NC}"
    exit 1
elif [ $WARNINGS -gt 5 ]; then
    echo -e "${YELLOW}⚠️  There are $WARNINGS warnings.${NC}"
    echo -e "${YELLOW}You may want to review them before deploying.${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${CYAN}Ready to deploy.${NC}"
    exit 0
fi
