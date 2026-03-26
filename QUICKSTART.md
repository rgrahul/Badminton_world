# Quick Start Guide

## Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- pnpm (will be installed if needed)

## 5-Minute Setup

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Database
```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/badminton_scoring?schema=public"

# Run migrations
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed.ts
```

### 4. Start Development Server
```bash
pnpm dev
```

### 5. Open Application
Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Login

**Email**: `umpire@example.com`
**Password**: `password123`

## What to Try

### Create Your First Match
1. Click "Create New Match"
2. Enter player names:
   - Side A Player 1: "Alice"
   - Side B Player 1: "Bob"
3. Leave defaults (Best of 3, 21 points, deuce cap 30)
4. Click "Create Match"

### Score a Match
1. From match list, click "Score" on your new match
2. Click "Side A" or "Side B" buttons to add points
3. Watch as:
   - Scores update automatically
   - Server indicator changes
   - BWF rules enforced (deuce at 20-20, etc.)
4. Try the "Undo" button to remove last point

### Explore Features
- **Match List**: Filter by status (In Progress, Completed, etc.)
- **Match Details**: View set-by-set breakdown
- **Undo**: Removes last point while preserving history
- **Auto-completion**: Match completes when a side wins 2 sets

## Test the Scoring Rules

### Test Deuce
1. Create a match
2. Score to 20-20
3. Notice you need 2-point lead to win
4. Score to 22-20 - set completes

### Test Deuce Cap
1. In a set at 29-29
2. Next point to 30 wins automatically (deuce cap)

### Test Match Completion
1. Complete 2 sets for one side
2. Match automatically marks as COMPLETED
3. Winner announced

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm test         # Run unit tests
pnpm test:e2e     # Run E2E tests (when implemented)
npx prisma studio # Open database GUI
```

## Verify Everything Works

### Check Database
```bash
npx prisma studio
```
Should show:
- 2 users (umpire, admin)
- 2 sample matches

### Run Tests
```bash
npx vitest run tests/unit/scoring-engine/
```
Should show:
- ✓ 122 tests passing
- 100% coverage

### Check API
```bash
# List matches (requires login)
curl http://localhost:3000/api/matches

# Health check
curl http://localhost:3000/api/health
```

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose restart
```

### Port Already in Use
```bash
# Change port in package.json dev script
"dev": "next dev -p 3001"
```

### Build Errors
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate
```

## Next Steps

1. **Create Multiple Matches**: Test different scenarios
2. **Try Doubles**: Create a doubles match (4 players)
3. **Test Undo**: Use undo feature multiple times
4. **Review Code**: Check `src/lib/scoring-engine/` for BWF rules
5. **Add Export** (future): Export matches as JSON/CSV/PDF
6. **View Analytics** (future): See match statistics

## Project Structure Quick Reference

```
src/
├── app/                 # Next.js pages & API routes
│   ├── api/            # REST API endpoints
│   ├── matches/        # Match pages
│   └── login/          # Auth pages
├── components/
│   ├── match/          # Scoring UI components
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── scoring-engine/ # BWF rules (100% tested)
│   ├── db/             # Database repositories
│   └── auth/           # NextAuth config
└── hooks/              # React hooks

tests/
└── unit/scoring-engine/ # 122 passing tests
```

## Common Tasks

### Add New User
```bash
# Via UI: Register page
# Or via API:
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'
```

### Delete a Match
```bash
# Via UI: Match details → Delete button
# Or via API:
curl -X DELETE http://localhost:3000/api/matches/{matchId}
```

### View Database
```bash
npx prisma studio
# Opens GUI at http://localhost:5555
```

## Support & Documentation

- **README.md**: Full documentation
- **IMPLEMENTATION_SUMMARY.md**: What's been built
- **Tests**: See `tests/unit/scoring-engine/` for examples
- **API**: Check `src/app/api/` for endpoint code

## Performance Tips

- **Matches page**: Loads quickly with pagination
- **Live scoring**: Optimistic updates for instant feedback
- **Database**: Indexed queries for fast filtering
- **Build**: Production build optimizes bundle size

Enjoy your badminton scoring app! 🏸
