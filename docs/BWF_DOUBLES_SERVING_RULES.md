# BWF Doubles Serving Rules Implementation

This document explains how the badminton doubles serving rules are implemented according to the Badminton World Federation (BWF) official rules.

## Overview

The doubles serving rules in badminton are based on:
1. **Court positions** - Each player has a position (right court or left court)
2. **Score-based service courts** - The service court is determined by the serving team's score
3. **Position switching** - Players switch positions only when the serving side wins a rally

## Key Rules

### 1. Service Court Determination

The service court is determined by the **SERVING team's score**:

- **EVEN score (0, 2, 4, 6, 8...)** → Serve from **RIGHT court**
- **ODD score (1, 3, 5, 7, 9...)** → Serve from **LEFT court**

### 2. Initial Setup (0-0)

At the start of a game or set:
- Player 1 of each team starts in the **right court**
- Player 2 of each team starts in the **left court**
- The initial serving team's Player 1 serves from the right court (score is 0, which is even)

### 3. When Serving Side WINS a Rally

When the serving side wins a point:

1. The two players on the **serving side SWITCH positions** with each other
2. The new score determines which court to serve from (even = right, odd = left)
3. The player now standing in the correct service court becomes the server

**Example:**
```
Initial: Team A serving at 0-0 (even)
- Alice in right court, Carol in left court
- Alice serves (right court, score is even)

Team A wins → Score becomes 1-0 (odd)
- Alice and Carol SWITCH positions
- Alice now in left court, Carol in right court
- Alice serves (left court, score is odd)

Team A wins again → Score becomes 2-0 (even)
- Alice and Carol SWITCH positions again
- Alice now in right court, Carol in left court
- Alice serves (right court, score is even)
```

### 4. When Service Changes (Receiving Side Wins)

When the receiving side wins the rally:

1. Service passes to the opposing team
2. The **receiving side does NOT switch positions** (they stay where they are)
3. The new score determines which court to serve from
4. The player in the correct service court on the new serving side becomes the server

**Example:**
```
Team A serving at 2-0, Team B wins
Score becomes 2-1 (odd for Team B)
- Team B players do NOT switch positions
- Team B must serve from left court (score is odd)
- Whoever is in Team B's left court serves
```

### 5. Starting a New Set

At the start of a new set:
- Player positions reset to initial setup (Player 1 right, Player 2 left)
- The team that won the previous set serves first
- That team's Player 1 serves from the right court (0-0 is even)

## Implementation Details

### Data Structure

The `ServerInfo` interface tracks:
```typescript
{
  servingSide: "A" | "B",
  serverName: string,
  positions?: {
    sideA: {
      rightCourt: string,  // Player name in right court
      leftCourt: string    // Player name in left court
    },
    sideB: {
      rightCourt: string,
      leftCourt: string
    }
  }
}
```

### Key Functions

1. **`getInitialServer()`** - Sets up initial positions at 0-0
2. **`getNextServer()`** - Determines next server after each rally
3. **`getServerForNewSet()`** - Resets positions for new set
4. **`validateServer()`** - Validates server info and positions

## Examples

### Complete Rally Sequence

```
Game starts: 0-0
Serving: Team A, Alice (right court, even score)

Rally 1: Team A wins → 1-0
- Team A switches: Alice → left, Carol → right
- Serving: Team A, Alice (left court, odd score)

Rally 2: Team A wins → 2-0
- Team A switches: Alice → right, Carol → left
- Serving: Team A, Alice (right court, even score)

Rally 3: Team B wins → 2-1
- No position switch (service changed)
- Team B's score is odd (1)
- Serving: Team B, whoever is in left court

Rally 4: Team B wins → 2-2
- Team B switches: positions swap
- Team B's score is even (2)
- Serving: Team B, whoever is now in right court

Rally 5: Team A wins → 3-2
- No position switch (service changed)
- Team A's score is odd (3)
- Serving: Team A, whoever is in left court
```

### Service at 20-20 (Deuce)

```
Score: 20-20
If Team A serves and wins → 21-20
- Team A switches positions
- Score is odd (21)
- Team A serves from left court

If Team A serves and loses → 20-21
- No position switch
- Team B's score is odd (21)
- Team B serves from left court
```

## Testing

The implementation includes comprehensive unit tests covering:
- Initial server setup
- Position switching when serving side wins
- Service changes when receiving side wins
- Score-based service court determination
- Position validation
- Backwards compatibility for existing matches

Run tests with:
```bash
npm test -- ServerTracker.test.ts
```

## References

- [BWF Laws of Badminton - Section 9: Service](https://corporate.bwfbadminton.com/statutes/)
- BWF Handbook II - Section 4: Technical Officials
- Laws of Badminton 2020 Edition
