#!/bin/bash
# Local Development Script
# Starts only backend and database using docker-compose.local.yml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Local Development Environment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠  .env.local not found, creating from example...${NC}"
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓  Created .env.local${NC}"
    else
        echo -e "${RED}✗  .env.local.example not found${NC}"
        exit 1
    fi
fi

# Parse arguments
ACTION="${1:-up}"

case "$ACTION" in
    up)
        echo -e "${GREEN}Starting local development environment...${NC}"
        docker compose -f docker-compose.local.yml --env-file .env.local up -d --build
        
        echo ""
        echo -e "${GREEN}✓  Backend running at: http://localhost:${BACKEND_PORT:-8080}${NC}"
        echo -e "${GREEN}✓  Database running at: localhost:${DB_PORT:-5433}${NC}"
        echo ""
        echo -e "Run migrations:"
        echo -e "  docker exec blog-backend-local php spark migrate"
        echo ""
        echo -e "View logs:"
        echo -e "  docker compose -f docker-compose.local.yml logs -f"
        ;;
    
    down)
        echo -e "${YELLOW}Stopping local development environment...${NC}"
        docker compose -f docker-compose.local.yml --env-file .env.local down
        echo -e "${GREEN}✓  Stopped${NC}"
        ;;
    
    logs)
        docker compose -f docker-compose.local.yml logs -f
        ;;
    
    migrate)
        echo -e "${GREEN}Running migrations...${NC}"
        docker exec blog-backend-local php spark migrate
        ;;
    
    shell)
        echo -e "${GREEN}Opening shell in backend container...${NC}"
        docker exec -it blog-backend-local /bin/sh
        ;;
    
    *)
        echo "Usage: $0 {up|down|logs|migrate|shell}"
        echo ""
        echo "Commands:"
        echo "  up       Start the local development environment"
        echo "  down     Stop the local development environment"
        echo "  logs     View container logs"
        echo "  migrate  Run database migrations"
        echo "  shell    Open shell in backend container"
        exit 1
        ;;
esac
