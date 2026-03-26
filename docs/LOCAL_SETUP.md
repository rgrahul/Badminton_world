# Local Development Setup

## Prerequisites

| Tool       | Version  | Install                                  |
|------------|----------|------------------------------------------|
| Node.js    | >= 18.x  | https://nodejs.org or `nvm install 18`   |
| pnpm       | >= 8.x   | `npm install -g pnpm`                    |
| Docker     | >= 20.x  | https://docs.docker.com/get-docker/      |
| Git        | >= 2.x   | https://git-scm.com                      |

> Docker is used for PostgreSQL. If you have PostgreSQL installed natively, you can skip Docker and point `DATABASE_URL` to your local instance.

---

## Quick Start (automated)

Run the setup script from the project root:

```bash
chmod +x scripts/local-setup.sh
./scripts/local-setup.sh
```

This will:
1. Check that Node.js, pnpm, and Docker are installed
2. Start PostgreSQL in Docker
3. Install dependencies
4. Create `.env` from `.env.example`
5. Generate the Prisma client
6. Run database migrations
7. Seed demo data
8. Start the dev server at http://localhost:3000

---

## Manual Setup (step by step)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

**Option A - Docker (recommended)**:
```bash
docker compose up -d
```

This starts PostgreSQL 14 on port 5432 with:
- User: `postgres`
- Password: `postgres`
- Database: `badminton_scoring`

Verify it's running:
```bash
docker compose ps
```

**Option B - Native PostgreSQL**:
Create the database manually:
```sql
CREATE DATABASE badminton_scoring;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/badminton_scoring?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

Generate a proper secret:
```bash
openssl rand -base64 32
```

### 4. Set Up Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed demo data (creates umpire + admin users and sample matches)
pnpm prisma:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open http://localhost:3000. Log in with:
- Email: `umpire@example.com`
- Password: `password123`

---

## Useful Commands

| Command                | Description                              |
|------------------------|------------------------------------------|
| `pnpm dev`             | Start dev server (hot reload)            |
| `pnpm build`           | Production build                         |
| `pnpm start`           | Start production server                  |
| `pnpm lint`            | Run ESLint                               |
| `pnpm test`            | Run unit tests (Vitest)                  |
| `pnpm test:coverage`   | Run tests with coverage report           |
| `pnpm test:e2e`        | Run Playwright E2E tests                 |
| `pnpm prisma:generate` | Regenerate Prisma client after schema changes |
| `pnpm prisma:migrate`  | Create and apply migrations              |
| `pnpm prisma:seed`     | Seed database with demo data             |
| `pnpm prisma:studio`   | Open Prisma Studio (DB browser) at http://localhost:5555 |

---

## Database Management

### Reset Database
```bash
# Drop all tables, rerun migrations, and reseed
npx prisma migrate reset
```

### View Database
```bash
pnpm prisma:studio
```
Opens a web UI at http://localhost:5555 to browse/edit data.

### Create a New Migration
After editing `prisma/schema.prisma`:
```bash
pnpm prisma:migrate
```
Enter a descriptive migration name when prompted.

---

## Stopping Services

```bash
# Stop the dev server
Ctrl+C

# Stop PostgreSQL
docker compose down

# Stop and remove database volume (deletes all data)
docker compose down -v
```

---

## Troubleshooting

### Port 5432 already in use
Another PostgreSQL instance is running. Stop it or change the port in `docker-compose.yml` and `DATABASE_URL`.

### Port 3000 already in use
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### Prisma client out of date
After pulling new schema changes:
```bash
pnpm prisma:generate
```

### bcrypt build errors
bcrypt requires native compilation. If it fails:
```bash
pnpm rebuild bcrypt
```

### Database connection refused
Make sure PostgreSQL is running:
```bash
docker compose ps
docker compose up -d  # restart if needed
```
