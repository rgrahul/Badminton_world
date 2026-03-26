#!/usr/bin/env bash
#
# Badminton World - One-click deploy script
# Usage:
#   ./deploy.sh              # Full setup + deploy (first time)
#   ./deploy.sh --start      # Start services (already set up)
#   ./deploy.sh --stop       # Stop all services
#   ./deploy.sh --restart    # Restart the app (keep DB running)
#   ./deploy.sh --status     # Show status of all services
#   ./deploy.sh --reset-db   # Wipe DB and re-seed
#
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Resolve project root (where this script lives) ──────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Helper functions ─────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

check_command() {
  if ! command -v "$1" &>/dev/null; then
    fail "'$1' is not installed. Please install it first."
  fi
}

# ── Prerequisite checks ─────────────────────────────────────────────
check_prerequisites() {
  info "Checking prerequisites..."

  check_command "node"
  check_command "docker"
  check_command "git"

  # Check Node version (need >= 18)
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    fail "Node.js >= 18 required. Found: $(node -v)"
  fi
  success "Node.js $(node -v)"

  # Check Docker is running
  if ! docker info &>/dev/null; then
    fail "Docker is not running. Please start Docker Desktop."
  fi
  success "Docker is running"

  # Check for pnpm; install if missing
  if ! command -v pnpm &>/dev/null; then
    warn "pnpm not found. Installing via corepack..."
    corepack enable
    corepack prepare pnpm@latest --activate
  fi
  success "pnpm $(pnpm -v)"

  # Check for pm2; install globally if missing
  if ! command -v pm2 &>/dev/null; then
    warn "pm2 not found. Installing globally..."
    npm install -g pm2
  fi
  success "pm2 $(pm2 -v)"
}

# ── .env setup ───────────────────────────────────────────────────────
setup_env() {
  if [ ! -f .env ]; then
    info "Creating .env from .env.example..."
    cp .env.example .env

    # Generate a random NEXTAUTH_SECRET
    if command -v openssl &>/dev/null; then
      SECRET=$(openssl rand -base64 32)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your-secret-key-here-generate-with-openssl-rand-base64-32|${SECRET}|" .env
      else
        sed -i "s|your-secret-key-here-generate-with-openssl-rand-base64-32|${SECRET}|" .env
      fi
      success "Generated NEXTAUTH_SECRET"
    else
      warn "openssl not found — please set NEXTAUTH_SECRET in .env manually"
    fi

    success ".env created"
  else
    success ".env already exists"
  fi
}

# ── Database (Docker) ────────────────────────────────────────────────
start_database() {
  info "Starting PostgreSQL via Docker Compose..."
  docker compose up -d

  # Wait for DB to be ready
  info "Waiting for database to be healthy..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker compose exec -T postgres pg_isready -U postgres &>/dev/null; then
      success "PostgreSQL is ready"
      return 0
    fi
    retries=$((retries - 1))
    sleep 1
  done
  fail "PostgreSQL did not become ready in time"
}

stop_database() {
  info "Stopping PostgreSQL..."
  docker compose down
  success "Database stopped"
}

# ── Dependencies ─────────────────────────────────────────────────────
install_dependencies() {
  info "Installing dependencies with pnpm..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  success "Dependencies installed"
}

# ── Prisma / DB migrations ──────────────────────────────────────────
run_migrations() {
  info "Running Prisma migrations..."
  pnpm prisma:generate
  npx prisma migrate deploy
  success "Database migrated"
}

seed_database() {
  info "Seeding database..."
  pnpm prisma:seed || warn "Seeding skipped or already done"
  success "Database seeded"
}

# ── Build ────────────────────────────────────────────────────────────
build_app() {
  info "Building Next.js app for production..."
  pnpm build
  success "Build complete"
}

# ── Start / Stop / Restart (PM2) ────────────────────────────────────
start_app() {
  info "Starting app with PM2..."
  mkdir -p logs
  pm2 start ecosystem.config.js
  success "App started on http://localhost:3000"
  pm2 status
}

stop_app() {
  info "Stopping app..."
  pm2 stop ecosystem.config.js 2>/dev/null || true
  pm2 delete ecosystem.config.js 2>/dev/null || true
  success "App stopped"
}

restart_app() {
  info "Restarting app..."
  pm2 restart ecosystem.config.js
  success "App restarted"
  pm2 status
}

show_status() {
  echo ""
  info "=== Service Status ==="
  echo ""
  info "Docker containers:"
  docker compose ps 2>/dev/null || echo "  (none running)"
  echo ""
  info "PM2 processes:"
  pm2 status 2>/dev/null || echo "  (none running)"
  echo ""
  info "App URL: http://localhost:3000"
  echo ""
}

# ── Full deploy (first time) ────────────────────────────────────────
full_deploy() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   Badminton World — Deploy Script        ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
  echo ""

  check_prerequisites
  setup_env
  start_database
  install_dependencies
  run_migrations
  seed_database
  build_app
  stop_app          # clean up any previous PM2 instances
  start_app

  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   Deployment complete!                   ║${NC}"
  echo -e "${GREEN}║   App running at http://localhost:3000   ║${NC}"
  echo -e "${GREEN}║                                          ║${NC}"
  echo -e "${GREEN}║   Useful commands:                       ║${NC}"
  echo -e "${GREEN}║     ./deploy.sh --status                 ║${NC}"
  echo -e "${GREEN}║     ./deploy.sh --stop                   ║${NC}"
  echo -e "${GREEN}║     ./deploy.sh --restart                ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
  echo ""
}

# ── CLI argument handling ────────────────────────────────────────────
case "${1:-}" in
  --start)
    start_database
    start_app
    ;;
  --stop)
    stop_app
    stop_database
    ;;
  --restart)
    restart_app
    ;;
  --status)
    show_status
    ;;
  --reset-db)
    warn "This will WIPE the database and re-seed."
    read -rp "Continue? [y/N] " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      npx prisma migrate reset --force
      seed_database
      success "Database reset complete"
    else
      info "Cancelled"
    fi
    ;;
  --help|-h)
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  (none)       Full setup + deploy (first time)"
    echo "  --start      Start DB + app (already set up)"
    echo "  --stop       Stop app + DB"
    echo "  --restart    Restart app only"
    echo "  --status     Show status of services"
    echo "  --reset-db   Wipe database and re-seed"
    echo "  --help       Show this help"
    ;;
  *)
    full_deploy
    ;;
esac
