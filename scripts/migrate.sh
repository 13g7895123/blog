#!/bin/bash

# Blog Application - Database Migration Script
# Production 環境資料庫遷移腳本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Database Migration Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if postgres volume exists (for data persistence)
VOLUME_NAME="blog_postgres_data"
if docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
    VOLUME_PATH=$(docker volume inspect "$VOLUME_NAME" --format '{{.Mountpoint}}')
    echo -e "${GREEN}✓ Database volume exists: ${VOLUME_NAME}${NC}"
    echo -e "${GREEN}  Mountpoint: ${VOLUME_PATH}${NC}"
else
    echo -e "${YELLOW}⚠️  Database volume '${VOLUME_NAME}' does not exist yet.${NC}"
    echo -e "${YELLOW}   It will be created when you start the database.${NC}"
fi
echo ""

# Check if backend container is running
BACKEND_CONTAINER=$(docker ps --filter "name=blog-backend" --format "{{.Names}}" | head -n 1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${RED}❌ Backend container is not running.${NC}"
    echo -e "${YELLOW}   Please start the application first with: ./scripts/start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found backend container: ${BACKEND_CONTAINER}${NC}"
echo ""

# Parse arguments
ACTION="${1:-migrate}"

case "$ACTION" in
    migrate)
        echo -e "${BLUE}🔄 Running database migrations...${NC}"
        echo ""
        
        if docker exec "$BACKEND_CONTAINER" php spark migrate; then
            echo ""
            echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
        else
            echo ""
            echo -e "${RED}❌ Database migrations failed!${NC}"
            exit 1
        fi
        ;;
    
    status)
        echo -e "${BLUE}📊 Checking migration status...${NC}"
        echo ""
        docker exec "$BACKEND_CONTAINER" php spark migrate:status
        ;;
    
    rollback)
        echo -e "${YELLOW}⚠️  Rolling back last migration...${NC}"
        echo ""
        docker exec "$BACKEND_CONTAINER" php spark migrate:rollback
        echo ""
        echo -e "${GREEN}✅ Rollback completed!${NC}"
        ;;
    
    refresh)
        echo -e "${YELLOW}⚠️  WARNING: This will DROP all tables and re-run migrations!${NC}"
        echo -e "${YELLOW}   All data will be LOST!${NC}"
        echo ""
        read -p "Are you sure? (type 'yes' to confirm): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo -e "${RED}🔄 Refreshing database...${NC}"
            docker exec "$BACKEND_CONTAINER" php spark migrate:refresh
            echo ""
            echo -e "${GREEN}✅ Database refresh completed!${NC}"
        else
            echo -e "${YELLOW}Cancelled.${NC}"
        fi
        ;;
    
    *)
        echo "Usage: $0 {migrate|status|rollback|refresh}"
        echo ""
        echo "Commands:"
        echo "  migrate   Run all pending migrations (default)"
        echo "  status    Show migration status"
        echo "  rollback  Rollback the last migration batch"
        echo "  refresh   ⚠️ Drop all tables and re-run migrations (DESTRUCTIVE)"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "   Check status:  ./scripts/migrate.sh status"
echo "   View logs:     docker logs $BACKEND_CONTAINER"
