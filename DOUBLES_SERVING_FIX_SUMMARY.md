# Doubles Serving Logic Fix - Summary

## Overview
Fixed the doubles match serving logic to correctly implement BWF (Badminton World Federation) official rules. The previous implementation incorrectly just alternated partners; the new implementation properly tracks player positions and determines servers based on score and court positions.

## What Was Changed

### 1. Updated Types (`src/lib/scoring-engine/types.ts`)
Added `positions` field to `ServerInfo` interface to track which player is in which court:
```typescript
interface ServerInfo {
  servingSide: Side
  serverName: string
  positions?: {
    sideA: {
      rightCourt: string  // player name in right service court
      leftCourt: string   // player name in left service court
    }
    sideB: {
      rightCourt: string
      leftCourt: string
    }
  }
}
```

### 2. Rewrote ServerTracker (`src/lib/scoring-engine/ServerTracker.ts`)
Completely rewrote the `getNextServer()` method to implement correct BWF rules:

**Key BWF Rules Implemented:**
- Service court is determined by the **serving team's score**:
  - EVEN score (0, 2, 4...) = serve from RIGHT court
  - ODD score (1, 3, 5...) = serve from LEFT court

- When **serving side WINS** a rally:
  - Players on serving side **SWITCH positions**
  - Server is determined by who is now in the correct service court

- When **service CHANGES** (receiving side wins):
  - Receiving side does **NOT switch positions**
  - Server is determined by who is in the correct service court based on their score

### 3. Updated MatchEngine (`src/lib/scoring-engine/MatchEngine.ts`)
Updated `startNewSet()` to pass match type to `getServerForNewSet()` so positions can be properly reset.

### 4. Updated Tests
- Completely rewrote `tests/unit/scoring-engine/ServerTracker.test.ts` with comprehensive tests covering all BWF doubles scenarios
- Fixed `tests/unit/scoring-engine/MatchValidator.test.ts` to use "Team" terminology instead of "Side"
- All 126 tests now pass

### 5. Added Documentation
Created `docs/BWF_DOUBLES_SERVING_RULES.md` with detailed explanation of:
- BWF official rules for doubles serving
- How the rules are implemented in code
- Complete examples and rally sequences
- Testing information

## Backwards Compatibility

The implementation maintains backwards compatibility:
- Existing matches without `positions` data will have positions automatically initialized when the next point is scored
- Singles matches are unaffected (positions are only used for doubles)
- The database schema doesn't need to change - positions are stored in the JSON `currentServer` field

## Testing

All tests pass successfully:
```
✓ ServerTracker.test.ts (20 tests)
✓ ScoringRules.test.ts (30 tests)
✓ SetEngine.test.ts (25 tests)
✓ MatchValidator.test.ts (23 tests)
✓ MatchEngine.test.ts (28 tests)

Total: 126 tests passed
```

## Impact on Application

**For Singles Matches:**
- No change - singles logic remains exactly the same

**For Doubles Matches:**
- Server selection now follows official BWF rules
- Players' positions are tracked throughout the match
- Server determination is based on score and position (not simple alternation)
- More realistic and accurate doubles gameplay

## Example of Correct Behavior

**Old (Incorrect) Behavior:**
```
0-0: Alice serves
Team A wins (1-0): Carol serves (just alternates)
Team A wins (2-0): Alice serves (just alternates back)
```

**New (Correct BWF) Behavior:**
```
0-0: Alice serves from right court (score is even)
Team A wins (1-0): Players switch positions, Alice now in left, serves from left (score is odd)
Team A wins (2-0): Players switch positions, Alice now in right, serves from right (score is even)
Team B wins (2-1): Service changes, no position switch, Team B serves from left (their score 1 is odd)
```

## Files Modified

1. `src/lib/scoring-engine/types.ts` - Added positions to ServerInfo
2. `src/lib/scoring-engine/ServerTracker.ts` - Rewrote doubles logic
3. `src/lib/scoring-engine/MatchEngine.ts` - Pass match type to getServerForNewSet
4. `tests/unit/scoring-engine/ServerTracker.test.ts` - New comprehensive tests
5. `tests/unit/scoring-engine/MatchValidator.test.ts` - Fixed terminology
6. `docs/BWF_DOUBLES_SERVING_RULES.md` - New documentation

## Next Steps

1. Test the application with actual doubles matches to verify the logic works correctly in the UI
2. Ensure the server indicator component properly displays position information if needed
3. Consider adding a visual court diagram showing player positions for doubles matches (optional enhancement)

## References

- BWF Laws of Badminton - Section 9: Service
- BWF Handbook II - Section 4: Technical Officials
- Official BWF Rules: https://corporate.bwfbadminton.com/statutes/
