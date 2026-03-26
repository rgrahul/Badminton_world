import { describe, it, expect } from "vitest"
import { MatchEngine } from "@/lib/scoring-engine/MatchEngine"
import { ServerTracker } from "@/lib/scoring-engine/ServerTracker"
import type { Players, MatchState, Side } from "@/lib/scoring-engine/types"

/**
 * BWF Simplified Rules of Badminton (Dec 2015) - Full verification
 * Tests trace through the exact doubles example from page 2 of the PDF
 * and verify all singles/doubles service rules.
 */

describe("BWF Rules - Singles", () => {
  const players: Players = {
    sideA: { player1: "PlayerA" },
    sideB: { player1: "PlayerB" },
  }
  const config = { setsCount: 3, pointsToWin: 21, deuceCap: 30 }

  it("should follow complete singles service sequence", () => {
    let state = MatchEngine.createMatch("SINGLES", players, config)
    state = MatchEngine.startMatch(state)

    // 0-0: A serves from right (even score)
    expect(state.server.servingSide).toBe("A")
    expect(state.server.serverName).toBe("PlayerA")
    // Server score is 0 (even) → right court

    // Rally 1: A wins → 1-0, A continues serving
    let result = MatchEngine.addPoint(state, "A")
    state = MatchEngine.applyRallyResult(state, result)
    expect(state.server.servingSide).toBe("A")
    expect(state.server.serverName).toBe("PlayerA")
    // Server score is 1 (odd) → left court

    // Rally 2: A wins → 2-0, A continues
    result = MatchEngine.addPoint(state, "A")
    state = MatchEngine.applyRallyResult(state, result)
    expect(state.server.servingSide).toBe("A")
    // Server score is 2 (even) → right court

    // Rally 3: B wins → 2-1, service passes to B
    result = MatchEngine.addPoint(state, "B")
    state = MatchEngine.applyRallyResult(state, result)
    expect(state.server.servingSide).toBe("B")
    expect(state.server.serverName).toBe("PlayerB")
    // B's score is 1 (odd) → left court

    // Rally 4: B wins → 2-2, B continues
    result = MatchEngine.addPoint(state, "B")
    state = MatchEngine.applyRallyResult(state, result)
    expect(state.server.servingSide).toBe("B")
    // B's score is 2 (even) → right court

    // Rally 5: A wins → 3-2, service passes to A
    result = MatchEngine.addPoint(state, "A")
    state = MatchEngine.applyRallyResult(state, result)
    expect(state.server.servingSide).toBe("A")
    expect(state.server.serverName).toBe("PlayerA")
    // A's score is 3 (odd) → left court
  })

  it("should handle deuce correctly (20-all needs 2-point lead)", () => {
    let state = MatchEngine.createMatch("SINGLES", players, config)
    state = MatchEngine.startMatch(state)

    // Simulate to 20-20
    for (let i = 0; i < 20; i++) {
      let r = MatchEngine.addPoint(state, "A")
      state = MatchEngine.applyRallyResult(state, r)
      r = MatchEngine.addPoint(state, "B")
      state = MatchEngine.applyRallyResult(state, r)
    }
    expect(state.score.currentSetScoreA).toBe(20)
    expect(state.score.currentSetScoreB).toBe(20)

    // 21-20: not won yet (no 2-point lead)
    let r = MatchEngine.addPoint(state, "A")
    expect(r.setCompleted).toBe(false)
    state = MatchEngine.applyRallyResult(state, r)

    // 21-21: still not won
    r = MatchEngine.addPoint(state, "B")
    expect(r.setCompleted).toBe(false)
    state = MatchEngine.applyRallyResult(state, r)

    // 22-21: still not won
    r = MatchEngine.addPoint(state, "A")
    expect(r.setCompleted).toBe(false)
    state = MatchEngine.applyRallyResult(state, r)

    // 22-22: still not won
    r = MatchEngine.addPoint(state, "B")
    expect(r.setCompleted).toBe(false)
    state = MatchEngine.applyRallyResult(state, r)

    // 23-22: still not won
    r = MatchEngine.addPoint(state, "A")
    expect(r.setCompleted).toBe(false)
    state = MatchEngine.applyRallyResult(state, r)

    // 24-22: WON (2-point lead after deuce)
    r = MatchEngine.addPoint(state, "A")
    expect(r.setCompleted).toBe(true)
    expect(r.newScore.sets[0].winningSide).toBe("A")
  })

  it("should cap at 30 points (29-all → 30th point wins)", () => {
    let state = MatchEngine.createMatch("SINGLES", players, config)
    state = MatchEngine.startMatch(state)

    // Simulate to 29-29
    for (let i = 0; i < 29; i++) {
      let r = MatchEngine.addPoint(state, "A")
      state = MatchEngine.applyRallyResult(state, r)
      r = MatchEngine.addPoint(state, "B")
      state = MatchEngine.applyRallyResult(state, r)
    }
    expect(state.score.currentSetScoreA).toBe(29)
    expect(state.score.currentSetScoreB).toBe(29)

    // 30-29: wins immediately (deuce cap)
    const r = MatchEngine.addPoint(state, "A")
    expect(r.setCompleted).toBe(true)
    expect(r.newScore.sets[0].winningSide).toBe("A")
  })

  it("should have set winner serve first in next set", () => {
    let state = MatchEngine.createMatch("SINGLES", players, config)
    state = MatchEngine.startMatch(state)

    // Side B wins set 1 quickly (pointsToWin=21, but let's use a custom config)
    const quickConfig = { setsCount: 3, pointsToWin: 3, deuceCap: 5 }
    let quickState = MatchEngine.createMatch("SINGLES", players, quickConfig)
    quickState = MatchEngine.startMatch(quickState)

    // B wins 3 points: 0-3
    for (let i = 0; i < 3; i++) {
      const r = MatchEngine.addPoint(quickState, "B")
      quickState = MatchEngine.applyRallyResult(quickState, r)
    }
    expect(quickState.score.sets[0].isComplete).toBe(true)
    expect(quickState.score.sets[0].winningSide).toBe("B")

    // Start new set - B should serve (winner of previous set)
    quickState = MatchEngine.startNewSet(quickState, "B")
    expect(quickState.server.servingSide).toBe("B")
    expect(quickState.server.serverName).toBe("PlayerB")
  })
})

describe("BWF Rules - Doubles (PDF Page 2 Example)", () => {
  // A & B vs C & D. A & B won toss, A serves to C.
  const players: Players = {
    sideA: { player1: "A", player2: "B" },
    sideB: { player1: "C", player2: "D" },
  }

  it("should follow the exact BWF PDF doubles example step by step", () => {
    // --- Love All (0-0) ---
    // Right Service Court (even). A serves to C.
    // Initial: A right, B left | C right, D left
    const initial = ServerTracker.getInitialServer(players, "DOUBLES")
    expect(initial.servingSide).toBe("A")
    expect(initial.serverName).toBe("A")
    expect(initial.positions?.sideA.rightCourt).toBe("A")
    expect(initial.positions?.sideA.leftCourt).toBe("B")
    expect(initial.positions?.sideB.rightCourt).toBe("C")
    expect(initial.positions?.sideB.leftCourt).toBe("D")

    // --- Rally 1: A&B win → 1-0 ---
    // A&B change courts. A serves from Left (odd). A serves to D.
    const after1 = ServerTracker.getNextServer(initial, "A", players, "DOUBLES", 1, 0)
    expect(after1.servingSide).toBe("A")
    expect(after1.serverName).toBe("A") // A now in left court, score odd → left
    expect(after1.positions?.sideA.rightCourt).toBe("B") // swapped
    expect(after1.positions?.sideA.leftCourt).toBe("A") // swapped
    // C&D stay same
    expect(after1.positions?.sideB.rightCourt).toBe("C")
    expect(after1.positions?.sideB.leftCourt).toBe("D")

    // --- Rally 2: C&D win → 1-1 ---
    // Nobody changes courts. D serves to A (Left, odd score for C&D=1)
    const after2 = ServerTracker.getNextServer(after1, "B", players, "DOUBLES", 1, 1)
    expect(after2.servingSide).toBe("B")
    expect(after2.serverName).toBe("D") // C&D's score is 1 (odd) → left court → D
    // Nobody swaps
    expect(after2.positions?.sideA.rightCourt).toBe("B")
    expect(after2.positions?.sideA.leftCourt).toBe("A")
    expect(after2.positions?.sideB.rightCourt).toBe("C")
    expect(after2.positions?.sideB.leftCourt).toBe("D")

    // --- Rally 3: A&B win → 2-1 ---
    // Nobody changes courts. B serves to C (Right, even score for A&B=2)
    const after3 = ServerTracker.getNextServer(after2, "A", players, "DOUBLES", 2, 1)
    expect(after3.servingSide).toBe("A")
    expect(after3.serverName).toBe("B") // A&B's score is 2 (even) → right court → B
    // Nobody swaps
    expect(after3.positions?.sideA.rightCourt).toBe("B")
    expect(after3.positions?.sideA.leftCourt).toBe("A")

    // --- Rally 4: C&D win → 2-2 ---
    // Nobody changes courts. C serves to B (Right, even score for C&D=2)
    const after4 = ServerTracker.getNextServer(after3, "B", players, "DOUBLES", 2, 2)
    expect(after4.servingSide).toBe("B")
    expect(after4.serverName).toBe("C") // C&D's score is 2 (even) → right court → C
    // Nobody swaps
    expect(after4.positions?.sideB.rightCourt).toBe("C")
    expect(after4.positions?.sideB.leftCourt).toBe("D")

    // --- Rally 5: C&D win → 2-3 ---
    // C&D change courts. C serves from Left (odd, score=3). C serves to A.
    const after5 = ServerTracker.getNextServer(after4, "B", players, "DOUBLES", 2, 3)
    expect(after5.servingSide).toBe("B")
    expect(after5.serverName).toBe("C") // After swap: D right, C left. Score 3 (odd) → left → C
    expect(after5.positions?.sideB.rightCourt).toBe("D") // swapped
    expect(after5.positions?.sideB.leftCourt).toBe("C") // swapped
    // A&B stay same
    expect(after5.positions?.sideA.rightCourt).toBe("B")
    expect(after5.positions?.sideA.leftCourt).toBe("A")

    // --- Rally 6: A&B win → 3-3 ---
    // Nobody changes courts. A serves to C (Left, odd score for A&B=3)
    const after6 = ServerTracker.getNextServer(after5, "A", players, "DOUBLES", 3, 3)
    expect(after6.servingSide).toBe("A")
    expect(after6.serverName).toBe("A") // A&B's score is 3 (odd) → left court → A
    // Nobody swaps
    expect(after6.positions?.sideA.rightCourt).toBe("B")
    expect(after6.positions?.sideA.leftCourt).toBe("A")

    // --- Rally 7: A&B win → 4-3 ---
    // A&B change courts. A serves from Right (even, score=4). A serves to D.
    const after7 = ServerTracker.getNextServer(after6, "A", players, "DOUBLES", 4, 3)
    expect(after7.servingSide).toBe("A")
    expect(after7.serverName).toBe("A") // After swap: A right, B left. Score 4 (even) → right → A
    expect(after7.positions?.sideA.rightCourt).toBe("A") // swapped back
    expect(after7.positions?.sideA.leftCourt).toBe("B") // swapped back
  })

  it("should reset positions for new set with winner serving", () => {
    const newSetServer = ServerTracker.getServerForNewSet("B", players, "DOUBLES")
    expect(newSetServer.servingSide).toBe("B")
    expect(newSetServer.serverName).toBe("C") // player1 of side B
    // Positions reset to initial
    expect(newSetServer.positions?.sideA.rightCourt).toBe("A")
    expect(newSetServer.positions?.sideA.leftCourt).toBe("B")
    expect(newSetServer.positions?.sideB.rightCourt).toBe("C")
    expect(newSetServer.positions?.sideB.leftCourt).toBe("D")
  })
})

describe("BWF Rules - Full Match Flow", () => {
  it("should complete a best-of-3 match correctly", () => {
    const players: Players = {
      sideA: { player1: "Alice" },
      sideB: { player1: "Bob" },
    }
    const config = { setsCount: 3, pointsToWin: 5, deuceCap: 7 }

    let state = MatchEngine.createMatch("SINGLES", players, config)
    state = MatchEngine.startMatch(state)

    // Set 1: A wins 5-0
    for (let i = 0; i < 5; i++) {
      const r = MatchEngine.addPoint(state, "A")
      state = MatchEngine.applyRallyResult(state, r)
      if (r.setCompleted) {
        expect(r.newScore.sets[0].winningSide).toBe("A")
        expect(state.score.setsWonBySideA).toBe(1)
      }
    }

    // Start set 2 - A (winner) serves first
    state = MatchEngine.startNewSet(state, "A")
    expect(state.server.servingSide).toBe("A")
    expect(state.score.currentSetNumber).toBe(2)
    expect(state.score.currentSetScoreA).toBe(0)
    expect(state.score.currentSetScoreB).toBe(0)

    // Set 2: B wins 5-0
    for (let i = 0; i < 5; i++) {
      const r = MatchEngine.addPoint(state, "B")
      state = MatchEngine.applyRallyResult(state, r)
    }
    expect(state.score.setsWonBySideB).toBe(1)

    // Start set 3 - B (winner of set 2) serves first
    state = MatchEngine.startNewSet(state, "B")
    expect(state.server.servingSide).toBe("B")
    expect(state.server.serverName).toBe("Bob")

    // Set 3: A wins 5-3 → match won
    for (let i = 0; i < 3; i++) {
      let r = MatchEngine.addPoint(state, "A")
      state = MatchEngine.applyRallyResult(state, r)
      r = MatchEngine.addPoint(state, "B")
      state = MatchEngine.applyRallyResult(state, r)
    }
    // 3-3, A scores 2 more
    let r = MatchEngine.addPoint(state, "A")
    state = MatchEngine.applyRallyResult(state, r)
    r = MatchEngine.addPoint(state, "A")
    state = MatchEngine.applyRallyResult(state, r)

    expect(r.setCompleted).toBe(true)
    expect(r.matchCompleted).toBe(true)
    expect(r.winningSide).toBe("A")
    expect(state.score.setsWonBySideA).toBe(2)
    expect(state.score.setsWonBySideB).toBe(1)
  })
})
