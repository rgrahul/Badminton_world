# Badminton Tournament App - User Guide

## Getting Started

After logging in, you land on the dashboard. From there you can navigate to Players, Matches, Tournaments, or Auctions using the header navigation.

### Default Credentials (after seeding)

| Role   | Email                | Password    |
|--------|----------------------|-------------|
| Umpire | umpire@example.com   | password123 |
| Admin  | admin@example.com    | password123 |

---

## 1. Player Management

### Add a Player
1. Go to **Players** from the header
2. Click **Add Player**
3. Fill in: Name (required), Email, Mobile, Age, Gender, Skill Rating (1-100), Profile Photo
4. Click **Create Player**

Players are auto-categorized:
- Age < 18 and Male/Female = **KID**
- Age >= 18 and Male = **MALE**
- Age >= 18 and Female = **FEMALE**

### Bulk Upload Players
1. Go to **Players** > **Bulk Upload**
2. Upload a CSV or Excel file with columns: name, email, mobileNumber, age, gender, skillRating
3. Review the preview and confirm the import

---

## 2. Standalone Match Scoring

For quick matches outside of tournaments.

### Create a Match
1. Go to **Matches** > **New Match**
2. Choose **Singles** or **Doubles**
3. Enter player names for Side A and Side B
4. Configure: Sets count (3 or 5), Points to win (default 21), Deuce cap (default 30)
5. Click **Create Match**

### Score a Match
1. Open a match and click **Score**
2. Complete the **toss** (who won, serve or side)
3. Select the **initial server** (and receiver for doubles)
4. Tap **Side A** or **Side B** button to award each point
5. The scoreboard auto-tracks:
   - Current score and set scores
   - Server rotation (BWF rules)
   - Court positions for doubles
   - Set transitions and match completion
6. Use the **Undo** button to reverse the last point

### Match Statuses
- **NOT_STARTED** - Created but scoring hasn't begun
- **IN_PROGRESS** - Currently being scored
- **COMPLETED** - Winner determined
- **ABANDONED** - Match cancelled mid-way

---

## 3. Tournament Management

### Create a Tournament
1. Go to **Tournaments** > **New Tournament**
2. Fill in:
   - Name, description, dates (from/to)
   - Organizer details (name, email, phone)
   - Venue and city
   - Category (e.g., "Open", "U19")
   - Format: **Custom**, **League + Knockout**, or **Knockout Only**
3. For League + Knockout, also set:
   - Number of groups
   - Teams qualifying per group
4. Set default match format (how many men's doubles, women's singles, etc.)
5. Click **Create**

### Add Teams
1. Open a tournament > **Teams** > **Add Team**
2. Enter team name and optional logo
3. Set composition rules (required male/female/kid players)
4. Select players matching the composition
5. **Auction mode**: Check "Players added via Auction" to create a team with 0 players (players assigned later through the auction)

### Tournament Formats

#### Custom
- Manually create team matches between any two teams
- No automated progression

#### League + Knockout
1. **Create groups**: The system generates groups and assigns teams
2. **Rearrange teams**: Drag teams between groups if needed
3. **Generate league matches**: Auto-creates round-robin matches within each group
4. **Score matches**: Score all fixtures in each team match
5. **View standings**: Group standings auto-computed (wins, fixture diff, point diff)
6. **Generate knockout bracket**: Top N teams per group seeded into elimination bracket
7. **Score knockout matches**: Winners auto-advance through the bracket

#### Knockout Only
1. Teams are seeded into an elimination bracket
2. Score each team match
3. Winners auto-advance to the next round
4. Bracket: Round of 32 > Round of 16 > Quarter-finals > Semi-finals > Final

### Team Matches
A team match between two teams consists of multiple fixtures:

| Fixture Type    | Players Per Side |
|-----------------|------------------|
| Men's Doubles   | 2 male           |
| Women's Doubles | 2 female         |
| Mixed Doubles   | 1 male + 1 female|
| Men's Singles   | 1 male           |
| Women's Singles  | 1 female          |
| Kids Singles    | 1 kid            |
| Kids Doubles    | 2 kids           |

**Workflow**:
1. Create a team match (or auto-generated in league/knockout)
2. Assign players to each fixture
3. Start and score each fixture's match
4. Team match auto-completes when all fixtures are done
5. Winner = team with more fixture wins (point diff as tiebreaker)

---

## 4. Player Auction / Draft

### Setup
1. Go to **Auctions** > **New Auction**
2. Link to a tournament (optional)
3. Add teams with budgets
4. Import player pool (from tournament players or Excel file)
5. Set base prices for players

### Running the Auction
1. Set auction status to **LIVE**
2. For each player:
   - Player appears in the spotlight
   - Teams bid on the player
   - Mark as **SOLD** (with price and team) or **UNSOLD**
3. Track remaining budgets and team compositions in real-time
4. Set to **COMPLETED** when done

### Player Statuses
- **AVAILABLE** - In the pool, not yet auctioned
- **SOLD** - Bought by a team
- **UNSOLD** - Went through auction with no buyer

---

## 5. Roles & Permissions

| Action              | PLAYER | UMPIRE | ADMIN |
|---------------------|--------|--------|-------|
| View matches/data   | Yes    | Yes    | Yes   |
| Create/edit matches | No     | Yes    | Yes   |
| Score matches       | No     | Yes    | Yes   |
| Manage tournaments  | No     | Yes    | Yes   |
| Manage players      | No     | Yes    | Yes   |
| Run auctions        | No     | Yes    | Yes   |

---

## 6. Tips

- **Undo is safe**: Undoing a point uses soft-delete, so the full rally history is preserved
- **Server rotation**: The app automatically tracks who should serve next per BWF rules - no manual tracking needed
- **Auto-completion**: Team matches auto-complete when all fixtures are scored; knockout matches auto-advance the winner
- **Flexible composition**: In auction mode, teams can be created empty and filled through the auction
- **Bulk operations**: Use CSV/Excel upload for large player pools instead of adding one by one
