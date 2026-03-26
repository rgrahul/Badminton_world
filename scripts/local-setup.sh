#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Badminton Tournament App - Local Setup Script
# Automates the full local development environment setup.
# Usage: ./scripts/local-setup.sh [--skip-seed] [--no-start]
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SKIP_SEED=false
NO_START=false

for arg in "$@"; do
  case $arg in
    --skip-seed) SKIP_SEED=true ;;
    --no-start)  NO_START=true ;;
    --help|-h)
      echo "Usage: ./scripts/local-setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-seed   Skip database seeding"
      echo "  --no-start    Set up everything but don't start the dev server"
      echo "  --help, -h    Show this help message"
      exit 0
      ;;
  esac
done

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

log()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
step()  { echo -e "\n${BLUE}==>${NC} $1"; }

# ---- 1. Check prerequisites ----
step "Checking prerequisites..."

MISSING=()

if ! command -v node &> /dev/null; then
  MISSING+=("Node.js (>= 18) - https://nodejs.org")
else
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    MISSING+=("Node.js >= 18 (current: $(node -v))")
  else
    log "Node.js $(node -v)"
  fi
fi

if ! command -v pnpm &> /dev/null; then
  MISSING+=("pnpm - run: npm install -g pnpm")
else
  log "pnpm $(pnpm -v)"
fi

if ! command -v docker &> /dev/null; then
  warn "Docker not found - you'll need PostgreSQL running locally on port 5432"
  DOCKER_AVAILABLE=false
else
  log "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
  DOCKER_AVAILABLE=true
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  err "Missing required tools:"
  for m in "${MISSING[@]}"; do
    echo "  - $m"
  done
  exit 1
fi

# ---- 2. Start PostgreSQL ----
step "Setting up PostgreSQL..."

if [ "$DOCKER_AVAILABLE" = true ]; then
  if docker compose ps --status running 2>/dev/null | grep -q "badminton-postgres"; then
    log "PostgreSQL container already running"
  else
    info "Starting PostgreSQL via Docker..."
    docker compose up -d
    info "Waiting for PostgreSQL to be ready..."
    RETRIES=30
    until docker compose exec -T postgres pg_isready -U postgres &>/dev/null || [ $RETRIES -eq 0 ]; do
      sleep 1
      RETRIES=$((RETRIES - 1))
    done
    if [ $RETRIES -eq 0 ]; then
      err "PostgreSQL failed to start within 30 seconds"
      exit 1
    fi
    log "PostgreSQL is ready"
  fi
else
  warn "Skipping Docker PostgreSQL - ensure PostgreSQL is running on localhost:5432"
fi

# ---- 3. Install dependencies ----
step "Installing dependencies..."

if [ -d "node_modules" ]; then
  info "node_modules exists, running install to sync..."
fi
pnpm install
log "Dependencies installed"

# ---- 4. Configure environment ----
step "Configuring environment..."

if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a random NEXTAUTH_SECRET
  SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-secret-change-in-production")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|your-secret-key-here-generate-with-openssl-rand-base64-32|${SECRET}|" .env
  else
    sed -i "s|your-secret-key-here-generate-with-openssl-rand-base64-32|${SECRET}|" .env
  fi
  log "Created .env with generated NEXTAUTH_SECRET"
else
  log ".env already exists, skipping"
fi

# ---- 5. Generate Prisma client ----
step "Generating Prisma client..."

pnpm prisma:generate
log "Prisma client generated"

# ---- 6. Run migrations ----
step "Running database migrations..."

pnpm prisma:migrate
log "Migrations applied"

# ---- 7. Seed database ----
if [ "$SKIP_SEED" = false ]; then
  step "Seeding database..."
  pnpm prisma:seed
  log "Database seeded with demo data"
else
  info "Skipping seed (--skip-seed)"
fi

# ---- 8. Summary ----
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  App URL:        http://localhost:3000"
echo "  Prisma Studio:  pnpm prisma:studio (http://localhost:5555)"
echo ""
echo "  Demo accounts:"
echo "    Umpire: umpire@example.com / password123"
echo "    Admin:  admin@example.com  / password123"
echo ""

# ---- 9. Start dev server ----
if [ "$NO_START" = false ]; then
  step "Starting development server..."
  echo ""
  pnpm dev
else
  info "Run 'pnpm dev' to start the development server."
fi
