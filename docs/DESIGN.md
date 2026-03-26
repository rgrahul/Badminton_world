# Badminton Tournament App - Design Document

## 1. Overview

A full-stack web application for managing badminton tournaments, live match scoring, team management, and player auctions. Built for tournament organizers and umpires to run end-to-end badminton events.

---

## 2. Architecture

```
+-----------+       +----------------+       +------------+
|  Browser  | <---> |  Next.js App   | <---> | PostgreSQL |
| (React)   |       |  (App Router)  |       |   (Prisma) |
+-----------+       +----------------+       +------------+
                           |
                    +------+------+
                    |  NextAuth   |
                    | (JWT Auth)  |
                    +-------------+
```

### Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React 18, Next.js 14 (App Router)   |
| Styling      | Tailwind CSS, shadcn/ui, Radix UI   |
| Auth         | NextAuth v5 (JWT, Credentials)      |
| Database     | PostgreSQL 14, Prisma ORM 5.20      |
| Validation   | Zod                                 |
| State        | Zustand (client), React useState    |
| Testing      | Vitest (unit), Playwright (E2E)     |
| Process Mgmt | PM2 (production)                    |

---

## 3. Database Schema

### Core Models (16 total)

```
User ──< Session
  |
  |──< Match ──< Set ──< Rally
  |──< Tournament ──< Team ──< TeamPlayer >── Player
  |                  |──< TeamMatch ──< Fixture
  |                  |──< TournamentGroup ──< GroupTeam
  |                  |──< KnockoutMatch
  |                  |──< TournamentPlayer
  |──< Auction ──< AuctionTeam
               |──< AuctionPlayer
```

### Key Relationships

- **Tournament** has many Teams, TeamMatches, Groups, KnockoutMatches
- **TeamMatch** links two Teams and generates multiple Fixtures
- **Fixture** links to a scored Match (1:1)
- **KnockoutMatch** self-references for bracket progression (winner feeds next round)
- **Rally** uses soft-delete for undo functionality

### Enums

| Enum                | Values                                                   |
|---------------------|----------------------------------------------------------|
| UserRole            | PLAYER, UMPIRE, ADMIN                                   |
| Gender              | MALE, FEMALE, OTHER                                     |
| TournamentFormat    | CUSTOM, LEAGUE_KNOCKOUT, KNOCKOUT_ONLY                   |
| TournamentStatus    | UPCOMING, ONGOING, COMPLETED, CANCELLED                  |
| MatchStatus         | NOT_STARTED, IN_PROGRESS, COMPLETED, ABANDONED           |
| FixtureType         | MEN_DOUBLES, WOMEN_DOUBLES, MIXED_DOUBLES, MEN_SINGLES, WOMEN_SINGLES, KIDS_SINGLES, KIDS_DOUBLES |
| PlayerCategory      | MALE, FEMALE, KID                                        |
| KnockoutRound       | ROUND_OF_32, ROUND_OF_16, QUARTER_FINAL, SEMI_FINAL, FINAL |
| AuctionStatus       | SETUP, LIVE, PAUSED, COMPLETED                           |
| AuctionPlayerStatus | AVAILABLE, SOLD, UNSOLD                                  |

---

## 4. Application Modules

### 4.1 Authentication & Authorization

- **Provider**: Credentials (email + bcrypt-hashed password)
- **Session**: JWT-based (stateless)
- **Roles**: PLAYER (read-only), UMPIRE (read+write), ADMIN (full access)
- **Middleware**: Blocks POST/PATCH/PUT/DELETE for PLAYER role on all `/api/*` routes
- **Pages**: `/login`, `/register`

### 4.2 Player Management

- CRUD operations for players with name, email, mobile, age, gender, skill rating, photo
- **Auto-categorization**: Players with age < 18 = KID, otherwise MALE/FEMALE based on gender
- **Bulk upload**: CSV/Excel import via `/players/bulk-upload`
- **Kid age cutoff**: Configurable constant (`KID_AGE_CUTOFF = 18`)

### 4.3 Match Scoring Engine

A pure TypeScript engine (zero framework dependencies) implementing BWF rules:

| Class           | Responsibility                              |
|-----------------|---------------------------------------------|
| ScoringRules    | Rally scoring, deuce detection, set victory |
| SetEngine       | Set-level score tracking                    |
| ServerTracker   | Singles/doubles server rotation             |
| MatchEngine     | Main orchestrator (sets, match completion)  |
| MatchValidator  | Input validation                            |

**Rules implemented**:
- Rally scoring (point on every rally)
- Set victory at 21+ with 2-point lead
- Deuce at 20-20 with cap at 30 (configurable)
- Best of 3 or 5 sets
- Doubles server rotation per BWF rules
- Undo via soft-deleted rallies

### 4.4 Tournament Management

Three formats supported:

**CUSTOM** - Manual match creation with no structured progression.

**LEAGUE_KNOCKOUT** - Two-stage format:
1. **League stage**: Teams assigned to groups, round-robin pairings auto-generated
2. **Knockout stage**: Top N teams per group seeded into elimination bracket
3. Group standings computed from match results (wins, fixture diff, point diff)

**KNOCKOUT_ONLY** - Single-elimination bracket:
- Auto-generated bracket structure (R32 through Final)
- Winner auto-advances when TeamMatch completes

**Team Match structure**:
- A TeamMatch between two teams contains multiple Fixtures
- Fixture types: men's/women's/mixed doubles, men's/women's/kids singles, kids doubles
- Each Fixture maps to a scored Match
- TeamMatch auto-completes when all fixtures are done (`recalculateResult()`)

### 4.5 Auction / Player Draft

- Create auctions linked to tournaments
- Set team budgets and player base prices
- Track bids: mark players as SOLD/UNSOLD with sale price
- Import player pools from Excel
- Teams created via auction skip composition validation (players added later)

---

## 5. API Design

All API routes follow a consistent pattern:

```typescript
// Response helpers
successResponse(data, statusCode)  // { success: true, data: ... }
errorResponse(message, statusCode) // { success: false, error: "..." }
```

### Endpoints Summary (37 total)

| Module       | Routes | Key Operations                              |
|--------------|--------|---------------------------------------------|
| Auth         | 3      | Register, NextAuth, test-auth               |
| Players      | 4      | CRUD, bulk upload                           |
| Matches      | 6      | CRUD, score point, undo                     |
| Tournaments  | 18     | CRUD, groups, knockout, teams, team-matches |
| Auctions     | 5      | CRUD, teams, players, import                |
| Health       | 1      | Health check                                |

### Validation

- All request bodies validated with Zod schemas
- Auth checked via `auth()` session helper
- Role enforcement via middleware

---

## 6. Data Access - Repository Pattern

All database operations use static methods in repository classes (`src/lib/db/repositories/`):

```typescript
class TeamRepository {
  static async create(data) { ... }
  static async findById(id) { ... }
  static async findByTournamentId(tournamentId) { ... }
  static async update(id, data) { ... }
  static async delete(id) { ... }
}
```

13 repositories covering all models. Complex operations use Prisma transactions.

---

## 7. Frontend Architecture

### Component Organization

```
src/components/
  ui/          - shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
  match/       - Scoring UI (ScoreBoard, BadmintonCourt, TossDialog, etc.)
  tournament/  - Tournament UI (KnockoutBracket, GroupCard, etc.)
  auction/     - Auction UI (PlayerSpotlight, BidPanel, etc.)
  team/        - Team management (TeamPlayerPicker)
  player/      - Player display (PlayerLink, PlayerAvatar)
  layout/      - App shell (Header)
```

### State Management

- **Server state**: Fetched via `fetch()` in client components, server components where possible
- **Client state**: React `useState` for forms, `zustand` for cross-component state
- **Confirmations**: `useAlertDialog` hook wrapping Radix AlertDialog

---

## 8. Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for stateless sessions
- Role-based middleware on all write API routes
- Zod validation on all inputs
- No `X-Powered-By` header (disabled in next.config.js)
- CSRF protection via NextAuth

---

## 9. Testing

| Type      | Framework   | Coverage Area        | Tests |
|-----------|-------------|----------------------|-------|
| Unit      | Vitest      | Scoring engine       | 122   |
| E2E       | Playwright  | User flows           | -     |
| Component | Testing Lib | React components     | -     |

Scoring engine has 100% test coverage across all 5 classes.
