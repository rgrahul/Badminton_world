import { describe, it, expect } from "vitest"
import { MatchEngine } from "@/lib/scoring-engine/MatchEngine"
import type { MatchConfig, MatchState, Players } from "@/lib/scoring-engine/types"

describe("MatchEngine", () => {
  const defaultConfig: MatchConfig = {
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
  }

  const singlesPlayers: Players = {
    sideA: { player1: "Alice" },
    sideB: { player1: "Bob" },
  }

  const doublesPlayers: Players = {
    sideA: { player1: "Alice", player2: "Carol" },
    sideB: { player1: "Bob", player2: "David" },
  }

  describe("createMatch", () => {
    it("should create a new singles match", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      expect(match.type).toBe("SINGLES")
      expect(match.status).toBe("NOT_STARTED")
      expect(match.config).toEqual(defaultConfig)
      expect(match.players).toEqual(singlesPlayers)
      expect(match.score.currentSetNumber).toBe(1)
      expect(match.score.currentSetScoreA).toBe(0)
      expect(match.score.currentSetScoreB).toBe(0)
      expect(match.score.setsWonBySideA).toBe(0)
      expect(match.score.setsWonBySideB).toBe(0)
      expect(match.score.sets).toHaveLength(1)
      expect(match.server.servingSide).toBe("A")
      expect(match.server.serverName).toBe("Alice")
      expect(match.rallyCount).toBe(0)
    })

    it("should create a new doubles match", () => {
      const match = MatchEngine.createMatch("DOUBLES", doublesPlayers, defaultConfig)
      expect(match.type).toBe("DOUBLES")
      expect(match.players).toEqual(doublesPlayers)
    })

    it("should throw error for invalid config", () => {
      const invalidConfig: MatchConfig = {
        setsCount: 2, // Even number
        pointsToWin: 21,
        deuceCap: 30,
      }
      expect(() =>
        MatchEngine.createMatch("SINGLES", singlesPlayers, invalidConfig)
      ).toThrow("Invalid config")
    })
  })

  describe("startMatch", () => {
    it("should start a match", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      expect(match.status).toBe("IN_PROGRESS")
    })

    it("should throw error if match already started", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      expect(() => MatchEngine.startMatch(match)).toThrow("already been started")
    })
  })

  describe("addPoint", () => {
    it("should add a point to side A", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      const result = MatchEngine.addPoint(match, "A")
      expect(result.scoringSide).toBe("A")
      expect(result.newScore.currentSetScoreA).toBe(1)
      expect(result.newScore.currentSetScoreB).toBe(0)
      expect(result.setCompleted).toBe(false)
      expect(result.matchCompleted).toBe(false)
    })

    it("should add a point to side B", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      const result = MatchEngine.addPoint(match, "B")
      expect(result.scoringSide).toBe("B")
      expect(result.newScore.currentSetScoreB).toBe(1)
    })

    it("should update server when same side wins", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      const result = MatchEngine.addPoint(match, "A")
      expect(result.newServer.servingSide).toBe("A")
      expect(result.newServer.serverName).toBe("Alice")
    })

    it("should switch server when opponent wins", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      const result = MatchEngine.addPoint(match, "B")
      expect(result.newServer.servingSide).toBe("B")
      expect(result.newServer.serverName).toBe("Bob")
    })

    it("should complete set when reaching 21 with 2-point lead", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      // Simulate score 20-18
      match.score.currentSetScoreA = 20
      match.score.currentSetScoreB = 18
      match.score.sets[0].scoreA = 20
      match.score.sets[0].scoreB = 18

      const result = MatchEngine.addPoint(match, "A")
      expect(result.setCompleted).toBe(true)
      expect(result.newScore.currentSetScoreA).toBe(21)
      expect(result.newScore.setsWonBySideA).toBe(1)
      expect(result.matchCompleted).toBe(false)
    })

    it("should complete match when side wins 2 sets", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      // Simulate score: A won 1 set, current set is 20-18
      match.score.setsWonBySideA = 1
      match.score.currentSetScoreA = 20
      match.score.currentSetScoreB = 18
      match.score.sets[0].scoreA = 20
      match.score.sets[0].scoreB = 18

      const result = MatchEngine.addPoint(match, "A")
      expect(result.setCompleted).toBe(true)
      expect(result.matchCompleted).toBe(true)
      expect(result.winningSide).toBe("A")
      expect(result.newScore.setsWonBySideA).toBe(2)
    })

    it("should throw error if match not in progress", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      expect(() => MatchEngine.addPoint(match, "A")).toThrow("not in progress")
    })

    it("should throw error if match already complete", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      match.winningSide = "A"
      expect(() => MatchEngine.addPoint(match, "B")).toThrow("already complete")
    })
  })

  describe("applyRallyResult", () => {
    it("should apply rally result to match state", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      const result = MatchEngine.addPoint(match, "A")
      match = MatchEngine.applyRallyResult(match, result)

      expect(match.score.currentSetScoreA).toBe(1)
      expect(match.rallyCount).toBe(1)
      expect(match.server.servingSide).toBe("A")
    })

    it("should update status to completed when match ends", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      match.score.setsWonBySideA = 1
      match.score.currentSetScoreA = 20
      match.score.currentSetScoreB = 18
      match.score.sets[0].scoreA = 20
      match.score.sets[0].scoreB = 18

      const result = MatchEngine.addPoint(match, "A")
      match = MatchEngine.applyRallyResult(match, result)

      expect(match.status).toBe("COMPLETED")
      expect(match.winningSide).toBe("A")
    })
  })

  describe("startNewSet", () => {
    it("should start a new set after first set completes", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      // Complete first set
      match.score.sets[0].isComplete = true
      match.score.sets[0].winningSide = "A"
      match.score.sets[0].scoreA = 21
      match.score.sets[0].scoreB = 19
      match.score.setsWonBySideA = 1

      match = MatchEngine.startNewSet(match, "A")

      expect(match.score.currentSetNumber).toBe(2)
      expect(match.score.sets).toHaveLength(2)
      expect(match.score.currentSetScoreA).toBe(0)
      expect(match.score.currentSetScoreB).toBe(0)
      expect(match.server.servingSide).toBe("A")
      expect(match.server.serverName).toBe("Alice")
    })

    it("should set correct server for new set", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      match.score.sets[0].isComplete = true
      match.score.sets[0].winningSide = "B"
      match.score.setsWonBySideB = 1

      match = MatchEngine.startNewSet(match, "B")

      expect(match.server.servingSide).toBe("B")
      expect(match.server.serverName).toBe("Bob")
    })

    it("should throw error if current set not complete", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      expect(() => MatchEngine.startNewSet(match, "A")).toThrow("not complete")
    })

    it("should throw error if match already complete", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      match.score.sets[0].isComplete = true
      match.winningSide = "A"

      expect(() => MatchEngine.startNewSet(match, "A")).toThrow("already complete")
    })
  })

  describe("getMatchSummary", () => {
    it("should generate summary for new match", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      const summary = MatchEngine.getMatchSummary(match)

      expect(summary).toContain("Match Status: NOT_STARTED")
      expect(summary).toContain("Sets: 0-0 (best of 3)")
      expect(summary).toContain("Set 1: 0-0 (in progress)")
    })

    it("should generate summary for in-progress match", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      match.score.currentSetScoreA = 10
      match.score.currentSetScoreB = 8
      match.score.sets[0].scoreA = 10
      match.score.sets[0].scoreB = 8

      const summary = MatchEngine.getMatchSummary(match)
      expect(summary).toContain("Match Status: IN_PROGRESS")
      expect(summary).toContain("Set 1: 10-8 (in progress)")
      expect(summary).toContain("Current Server: Alice")
    })

    it("should generate summary for completed match", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      match.status = "COMPLETED"
      match.winningSide = "A"
      match.score.setsWonBySideA = 2

      const summary = MatchEngine.getMatchSummary(match)
      expect(summary).toContain("Match Status: COMPLETED")
      expect(summary).toContain("Winner: Side A")
    })
  })

  describe("validateMatchState", () => {
    it("should validate a correct match state", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      const result = MatchEngine.validateMatchState(match)
      expect(result.valid).toBe(true)
    })

    it("should reject invalid config", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      // Manually corrupt config after creation to test validation
      const corruptedMatch = { ...match, config: { ...match.config, setsCount: 2 } }
      const result = MatchEngine.validateMatchState(corruptedMatch)
      expect(result.valid).toBe(false)
    })

    it("should reject invalid server", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      // Manually corrupt server after creation to test validation
      const corruptedMatch = {
        ...match,
        server: { servingSide: "A" as const, serverName: "Invalid" },
      }
      const result = MatchEngine.validateMatchState(corruptedMatch)
      expect(result.valid).toBe(false)
    })

    it("should reject incorrect sets won count", () => {
      const match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      // Manually corrupt sets won count after creation to test validation
      const corruptedMatch = {
        ...match,
        score: { ...match.score, setsWonBySideA: 5 },
      }
      const result = MatchEngine.validateMatchState(corruptedMatch)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("does not match completed sets")
    })

    it("should reject match that should be complete but isn't", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)
      // Complete two sets for side A
      match.score.sets[0].isComplete = true
      match.score.sets[0].winningSide = "A"
      match.score.sets[0].scoreA = 21
      match.score.sets[0].scoreB = 19
      match = MatchEngine.startNewSet(match, "A")
      match.score.sets[1].isComplete = true
      match.score.sets[1].winningSide = "A"
      match.score.sets[1].scoreA = 21
      match.score.sets[1].scoreB = 18
      match.score.setsWonBySideA = 2
      // But don't mark match as won (corruption)
      match.winningSide = undefined
      const result = MatchEngine.validateMatchState(match)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("should be complete")
    })
  })

  describe("Full match simulation", () => {
    it("should handle a complete best-of-3 match", () => {
      let match = MatchEngine.createMatch("SINGLES", singlesPlayers, defaultConfig)
      match = MatchEngine.startMatch(match)

      // Simulate Set 1: A wins 21-19
      // Interleave points to reach 21-19
      const set1Pattern = [
        ...Array(19).fill("A"),
        ...Array(19).fill("B"),
        "A",
        "A",
      ] as const
      for (const side of set1Pattern) {
        if (match.score.sets[0].isComplete) break
        const result = MatchEngine.addPoint(match, side)
        match = MatchEngine.applyRallyResult(match, result)
      }

      expect(match.score.setsWonBySideA).toBe(1)
      expect(match.score.sets[0].isComplete).toBe(true)

      // Start Set 2
      match = MatchEngine.startNewSet(match, "A")

      // Simulate Set 2: B wins 21-18
      const set2Pattern = [
        ...Array(18).fill("A"),
        ...Array(21).fill("B"),
      ] as const
      for (const side of set2Pattern) {
        if (match.score.sets[1].isComplete) break
        const result = MatchEngine.addPoint(match, side)
        match = MatchEngine.applyRallyResult(match, result)
      }

      expect(match.score.setsWonBySideA).toBe(1)
      expect(match.score.setsWonBySideB).toBe(1)

      // Start Set 3
      match = MatchEngine.startNewSet(match, "B")

      // Simulate Set 3: A wins 21-17 (match ends)
      const set3Pattern = [
        ...Array(17).fill("B"),
        ...Array(21).fill("A"),
      ] as const
      for (const side of set3Pattern) {
        if (match.status === "COMPLETED") break
        const result = MatchEngine.addPoint(match, side)
        match = MatchEngine.applyRallyResult(match, result)
        if (result.matchCompleted) {
          expect(result.winningSide).toBe("A")
        }
      }

      expect(match.status).toBe("COMPLETED")
      expect(match.winningSide).toBe("A")
      expect(match.score.setsWonBySideA).toBe(2)
      expect(match.score.setsWonBySideB).toBe(1)
    })
  })
})
