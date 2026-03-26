#!/bin/bash

##############################################################################
# Deployment Script for Badminton Scoring Application
#
# This script handles production deployment including:
# - Git pull latest changes
# - Dependency installation
# - Database migrations
# - Application build
# - PM2 process restart with zero-downtime reload
#
# Usage:
#   ./scripts/deploy.sh
#
# Requirements:
#   - Git repository initialized
#   - pnpm installed globally
#   - PM2 installed globally
#   - Database running and accessible
#   - Environment variables configured in .env
##############################################################################

set -e # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Badminton Scoring App - Deployment${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with required environment variables"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Pulling latest changes from git...${NC}"
git pull origin main || {
    echo -e "${RED}Git pull failed. Please resolve conflicts and try again.${NC}"
    exit 1
}

echo -e "${GREEN}✓ Git pull successful${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
pnpm install --frozen-lockfile || {
    echo -e "${RED}Dependency installation failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
npx prisma migrate deploy || {
    echo -e "${RED}Database migration failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Generating Prisma Client...${NC}"
npx prisma generate || {
    echo -e "${RED}Prisma client generation failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

echo -e "${YELLOW}Step 5: Building application...${NC}"
pnpm build || {
    echo -e "${RED}Build failed${NC}"
    exit 1
}

echo -e "${GREEN}✓ Build completed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Restarting application with PM2...${NC}"

# Check if PM2 process exists
if pm2 list | grep -q "badminton-scoring"; then
    echo "Reloading existing PM2 process (zero-downtime)..."
    pm2 reload ecosystem.config.js --update-env || {
        echo -e "${RED}PM2 reload failed${NC}"
        exit 1
    }
else
    echo "Starting new PM2 process..."
    pm2 start ecosystem.config.js || {
        echo -e "${RED}PM2 start failed${NC}"
        exit 1
    }
fi

# Save PM2 process list
pm2 save

echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

echo -e "${YELLOW}Step 7: Running health check...${NC}"
sleep 5 # Wait for app to start

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}Warning: Health check failed. Please check application logs.${NC}"
    echo "View logs with: pm2 logs badminton-scoring"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status               - Check application status"
echo "  pm2 logs badminton-scoring - View application logs"
echo "  pm2 monit                - Monitor resources"
echo "  pm2 restart all          - Restart all processes"
echo ""
