#!/bin/bash

##############################################################################
# Initial Setup Script for Badminton Scoring Application
#
# This script handles first-time production setup including:
# - System dependency checks
# - pnpm installation
# - Database initialization
# - Environment configuration
# - Initial build and deployment
#
# Usage:
#   ./scripts/setup.sh
#
# Requirements:
#   - Ubuntu/Debian system with sudo access
#   - Node.js 20+ installed
#   - PostgreSQL installed and running
##############################################################################

set -e # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Badminton Scoring App - Initial Setup${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 20+ before continuing"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js version must be 20 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm
    echo -e "${GREEN}✓ pnpm installed${NC}"
else
    echo -e "${GREEN}✓ pnpm already installed${NC}"
fi
echo ""

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Warning: PostgreSQL client (psql) not found${NC}"
    echo "Please ensure PostgreSQL is installed and running"
    echo ""
else
    echo -e "${GREEN}✓ PostgreSQL client detected${NC}"
    echo ""
fi

# Environment setup
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"

    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo ""
        echo -e "${YELLOW}IMPORTANT: Please edit .env file with your configuration:${NC}"
        echo "  - DATABASE_URL: Your PostgreSQL connection string"
        echo "  - NEXTAUTH_SECRET: Generate with 'openssl rand -base64 32'"
        echo "  - NEXTAUTH_URL: Your production domain URL"
        echo ""
        read -p "Press Enter when you have configured .env file..."
    else
        echo -e "${YELLOW}Creating new .env file...${NC}"

        # Prompt for database configuration
        read -p "Database host (default: localhost): " DB_HOST
        DB_HOST=${DB_HOST:-localhost}

        read -p "Database port (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}

        read -p "Database name (default: badminton_scoring): " DB_NAME
        DB_NAME=${DB_NAME:-badminton_scoring}

        read -p "Database user (default: postgres): " DB_USER
        DB_USER=${DB_USER:-postgres}

        read -sp "Database password: " DB_PASS
        echo ""

        read -p "Production URL (e.g., https://badminton.example.com): " PROD_URL

        # Generate secret
        NEXTAUTH_SECRET=$(openssl rand -base64 32)

        # Create .env file
        cat > .env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# NextAuth
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="${PROD_URL}"

# Environment
NODE_ENV="production"
EOF

        echo -e "${GREEN}✓ .env file created${NC}"
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Load environment variables
source .env

# Install dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
pnpm install || {
    echo -e "${RED}Dependency installation failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create logs directory
echo -e "${YELLOW}Creating logs directory...${NC}"
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

# Database setup
echo -e "${YELLOW}Setting up database...${NC}"
echo "Running Prisma migrations..."
npx prisma migrate deploy || {
    echo -e "${RED}Database migration failed${NC}"
    echo "Please check your DATABASE_URL and ensure PostgreSQL is accessible"
    exit 1
}
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Generate Prisma Client
echo -e "${YELLOW}Generating Prisma Client...${NC}"
npx prisma generate || {
    echo -e "${RED}Prisma client generation failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Ask about seeding
read -p "Do you want to seed the database with sample data? (y/n): " SEED_CHOICE
if [ "$SEED_CHOICE" = "y" ] || [ "$SEED_CHOICE" = "Y" ]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    npx tsx prisma/seed.ts || {
        echo -e "${RED}Database seeding failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ Database seeded${NC}"
    echo ""
    echo "Demo credentials:"
    echo "  Email: umpire@example.com"
    echo "  Password: password123"
    echo ""
fi

# Build application
echo -e "${YELLOW}Building application...${NC}"
pnpm build || {
    echo -e "${RED}Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Start with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.js || {
    echo -e "${RED}PM2 start failed${NC}"
    exit 1
}

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
echo -e "${YELLOW}Configuring PM2 startup...${NC}"
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
if [ -s /tmp/pm2_startup.sh ]; then
    echo "Please run the following command with sudo:"
    cat /tmp/pm2_startup.sh
    echo ""
    read -p "Press Enter after running the command..."
fi

echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

# Health check
echo -e "${YELLOW}Running health check...${NC}"
sleep 5 # Wait for app to start

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}Warning: Health check failed${NC}"
    echo "The application may still be starting up."
    echo "Check logs with: pm2 logs badminton-scoring"
fi

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Setup completed successfully!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Application Status:"
pm2 list
echo ""
echo "Next Steps:"
echo "  1. Configure nginx reverse proxy (see DEPLOYMENT.md)"
echo "  2. Set up SSL with Let's Encrypt (see DEPLOYMENT.md)"
echo "  3. Configure firewall (see DEPLOYMENT.md)"
echo "  4. Set up database backups (see DEPLOYMENT.md)"
echo ""
echo "Useful Commands:"
echo "  pm2 status               - Check application status"
echo "  pm2 logs                 - View logs"
echo "  pm2 monit                - Monitor resources"
echo "  ./scripts/deploy.sh      - Deploy updates"
echo ""
