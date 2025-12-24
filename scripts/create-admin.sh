#!/bin/bash

# Blog Application - Create Admin User Script
# 建立管理員帳號腳本

set -e

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   建立管理員帳號${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未運行。請先啟動 Docker。${NC}"
    exit 1
fi

# Check if backend container is running
BACKEND_CONTAINER=$(docker ps --filter "name=blog-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Backend 容器未運行。${NC}"
    echo -e "${YELLOW}   請先啟動服務：./scripts/start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 找到 Backend 容器：${BACKEND_CONTAINER}${NC}"
echo ""

# Get user input
echo -e "${CYAN}請輸入管理員資訊：${NC}"
echo ""

# Email
read -p "Email: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}❌ Email 不能為空${NC}"
    exit 1
fi

# Validate email format
if ! echo "$ADMIN_EMAIL" | grep -qE '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'; then
    echo -e "${RED}❌ Email 格式不正確${NC}"
    exit 1
fi

# Name
read -p "名稱 (預設: Admin): " ADMIN_NAME
ADMIN_NAME="${ADMIN_NAME:-Admin}"

# Password
while true; do
    read -sp "密碼 (至少 6 字元): " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
        echo -e "${RED}❌ 密碼至少需要 6 個字元${NC}"
        continue
    fi
    
    read -sp "確認密碼: " ADMIN_PASSWORD_CONFIRM
    echo ""
    
    if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}❌ 密碼不一致，請重新輸入${NC}"
        continue
    fi
    break
done

echo ""
echo -e "${YELLOW}正在建立管理員帳號...${NC}"

# Generate UUID
UUID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "$(date +%s)-$(shuf -i 1000-9999 -n 1)")

# Create admin user via PHP
docker exec "$BACKEND_CONTAINER" php -r "
<?php
require '/var/www/html/vendor/autoload.php';

\$app = require '/var/www/html/app/Config/Paths.php';
\$app = require '/var/www/html/public/index.php';

use App\Models\UserModel;

\$model = new UserModel();

// Check if user already exists
\$existing = \$model->where('email', '$ADMIN_EMAIL')->first();
if (\$existing) {
    echo 'USER_EXISTS';
    exit(1);
}

// Create new admin user
\$result = \$model->insert([
    'id' => '$UUID',
    'email' => '$ADMIN_EMAIL',
    'password' => password_hash('$ADMIN_PASSWORD', PASSWORD_DEFAULT),
    'name' => '$ADMIN_NAME',
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s'),
]);

if (\$result) {
    echo 'SUCCESS';
} else {
    echo 'FAILED';
    exit(1);
}
" 2>/dev/null

# Alternative method using spark command if available
if [ $? -ne 0 ]; then
    # Try using direct database connection
    echo -e "${YELLOW}嘗試直接寫入資料庫...${NC}"
    
    # Get database credentials from docker-compose
    source .env 2>/dev/null || true
    DB_HOST="${POSTGRES_HOST:-db}"
    DB_NAME="${POSTGRES_DB:-blog}"
    DB_USER="${POSTGRES_USER:-blog_user}"
    DB_PASS="${POSTGRES_PASSWORD:-blog_password}"
    
    # Hash password using PHP
    HASHED_PASSWORD=$(docker exec "$BACKEND_CONTAINER" php -r "echo password_hash('$ADMIN_PASSWORD', PASSWORD_DEFAULT);")
    
    # Get database container
    DB_CONTAINER=$(docker ps --filter "name=blog-db" --format "{{.Names}}" | head -n 1)
    
    if [ -z "$DB_CONTAINER" ]; then
        echo -e "${RED}❌ 找不到資料庫容器${NC}"
        exit 1
    fi
    
    # Insert user using psql
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
        INSERT INTO users (id, email, password, name, created_at, updated_at)
        VALUES ('$UUID', '$ADMIN_EMAIL', '$HASHED_PASSWORD', '$ADMIN_NAME', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING;
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 管理員帳號建立成功！${NC}"
    else
        echo -e "${RED}❌ 建立失敗${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}✅ 管理員帳號建立成功！${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${CYAN}帳號資訊：${NC}"
echo -e "  Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "  名稱:  ${GREEN}$ADMIN_NAME${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 現在可以前往 /login 頁面登入${NC}"
