import { describe, it, expect } from "vitest"
import { ScoringRules } from "@/lib/scoring-engine/ScoringRules"
import type { MatchConfig } from "@/lib/scoring-engine/types"

describe("ScoringRules", () => {
  const defaultConfig: MatchConfig = {
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
  }

  describe("isSetWon", () => {
    it("should return false when neither side has enough points", () => {
      const result = ScoringRules.isSetWon(10, 8, defaultConfig)
      expect(result.isWon).toBe(false)
      expect(result.winningSide).toBeUndefined()
    })

    it("should return true when side A reaches points to win with 2-point lead", () => {
      const result = ScoringRules.isSetWon(21, 19, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })

    it("should return true when side B reaches points to win with 2-point lead", () => {
      const result = ScoringRules.isSetWon(18, 21, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("B")
    })

    it("should return false at 21-20 (need 2-point lead)", () => {
      const result = ScoringRules.isSetWon(21, 20, defaultConfig)
      expect(result.isWon).toBe(false)
    })

    it("should return false at 20-21 (need 2-point lead)", () => {
      const result = ScoringRules.isSetWon(20, 21, defaultConfig)
      expect(result.isWon).toBe(false)
    })

    it("should return true at 22-20 (2-point lead in deuce)", () => {
      const result = ScoringRules.isSetWon(22, 20, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })

    it("should return true at 25-27 (2-point lead in extended deuce)", () => {
      const result = ScoringRules.isSetWon(25, 27, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("B")
    })

    it("should return true when side A reaches deuce cap", () => {
      const result = ScoringRules.isSetWon(30, 29, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })

    it("should return true when side B reaches deuce cap", () => {
      const result = ScoringRules.isSetWon(28, 30, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("B")
    })

    it("should work with custom points to win", () => {
      const customConfig: MatchConfig = {
        setsCount: 3,
        pointsToWin: 15,
        deuceCap: 20,
      }
      const result = ScoringRules.isSetWon(15, 13, customConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })
  })

  describe("isMatchWon", () => {
    it("should return false when neither side has won enough sets", () => {
      const result = ScoringRules.isMatchWon(1, 1, defaultConfig)
      expect(result.isWon).toBe(false)
    })

    it("should return true when side A wins best of 3 (2 sets)", () => {
      const result = ScoringRules.isMatchWon(2, 0, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })

    it("should return true when side B wins best of 3 (2 sets)", () => {
      const result = ScoringRules.isMatchWon(0, 2, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("B")
    })

    it("should return true when side A wins 2-1", () => {
      const result = ScoringRules.isMatchWon(2, 1, defaultConfig)
      expect(result.isWon).toBe(true)
      expect(result.winningSide).toBe("A")
    })

    it("should work with best of 5 configuration", () => {
      const bestOf5Config: MatchConfig = {
        setsCount: 5,
        pointsToWin: 21,
        deuceCap: 30,
      }

      expect(ScoringRules.isMatchWon(2, 1, bestOf5Config).isWon).toBe(false)
      expect(ScoringRules.isMatchWon(3, 0, bestOf5Config).isWon).toBe(true)
      expect(ScoringRules.isMatchWon(3, 2, bestOf5Config).isWon).toBe(true)
    })
  })

  describe("isDeuce", () => {
    it("should return false before deuce point", () => {
      expect(ScoringRules.isDeuce(19, 19, defaultConfig)).toBe(false)
    })

    it("should return true at 20-20", () => {
      expect(ScoringRules.isDeuce(20, 20, defaultConfig)).toBe(true)
    })

    it("should return true at 21-21", () => {
      expect(ScoringRules.isDeuce(21, 21, defaultConfig)).toBe(true)
    })

    it("should return true at 25-27", () => {
      expect(ScoringRules.isDeuce(25, 27, defaultConfig)).toBe(true)
    })

    it("should return false at 20-18", () => {
      expect(ScoringRules.isDeuce(20, 18, defaultConfig)).toBe(false)
    })

    it("should work with custom points to win", () => {
      const customConfig: MatchConfig = {
        setsCount: 3,
        pointsToWin: 11,
        deuceCap: 15,
      }
      expect(ScoringRules.isDeuce(10, 10, customConfig)).toBe(true)
      expect(ScoringRules.isDeuce(9, 9, customConfig)).toBe(false)
    })
  })

  describe("validateConfig", () => {
    it("should validate a correct configuration", () => {
      const result = ScoringRules.validateConfig(defaultConfig)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject even number of sets", () => {
      const invalidConfig: MatchConfig = {
        setsCount: 4,
        pointsToWin: 21,
        deuceCap: 30,
      }
      const result = ScoringRules.validateConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("odd number")
    })

    it("should reject zero sets", () => {
      const invalidConfig: MatchConfig = {
        setsCount: 0,
        pointsToWin: 21,
        deuceCap: 30,
      }
      const result = ScoringRules.validateConfig(invalidConfig)
      expect(result.valid).toBe(false)
    })

    it("should reject points to win less than 1", () => {
      const invalidConfig: MatchConfig = {
        setsCount: 3,
        pointsToWin: 0,
        deuceCap: 30,
      }
      const result = ScoringRules.validateConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("at least 1")
    })

    it("should reject deuce cap less than points to win", () => {
      const invalidConfig: MatchConfig = {
        setsCount: 3,
        pointsToWin: 21,
        deuceCap: 20,
      }
      const result = ScoringRules.validateConfig(invalidConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("greater than or equal")
    })
  })

  describe("validatePointAddition", () => {
    it("should allow adding point to ongoing set", () => {
      const result = ScoringRules.validatePointAddition(10, 8, "A", defaultConfig)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should allow adding point in deuce", () => {
      const result = ScoringRules.validatePointAddition(20, 21, "A", defaultConfig)
      expect(result.valid).toBe(true)
    })

    it("should reject adding point when set is already won", () => {
      const result = ScoringRules.validatePointAddition(21, 19, "A", defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("already won")
    })

    it("should reject adding point when deuce cap reached", () => {
      const result = ScoringRules.validatePointAddition(30, 28, "B", defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("already won")
    })
  })
})
