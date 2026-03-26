import { describe, it, expect } from "vitest"
import { MatchValidator } from "@/lib/scoring-engine/MatchValidator"
import type { Players, MatchConfig } from "@/lib/scoring-engine/types"

describe("MatchValidator", () => {
  const validSinglesPlayers: Players = {
    sideA: { player1: "Alice" },
    sideB: { player1: "Bob" },
  }

  const validDoublesPlayers: Players = {
    sideA: { player1: "Alice", player2: "Carol" },
    sideB: { player1: "Bob", player2: "David" },
  }

  const defaultConfig: MatchConfig = {
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
  }

  describe("validatePlayers", () => {
    describe("Singles validation", () => {
      it("should validate correct singles players", () => {
        const result = MatchValidator.validatePlayers(validSinglesPlayers, "SINGLES")
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it("should reject missing side A player 1", () => {
        const players: Players = {
          sideA: { player1: "" },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("Team A player 1 is required")
      })

      it("should reject missing side B player 1", () => {
        const players: Players = {
          sideA: { player1: "Alice" },
          sideB: { player1: "" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("Team B player 1 is required")
      })

      it("should reject player 2 in singles", () => {
        const players: Players = {
          sideA: { player1: "Alice", player2: "Carol" },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("should not be set for singles")
      })
    })

    describe("Doubles validation", () => {
      it("should validate correct doubles players", () => {
        const result = MatchValidator.validatePlayers(validDoublesPlayers, "DOUBLES")
        expect(result.valid).toBe(true)
      })

      it("should reject missing side A player 2 in doubles", () => {
        const players: Players = {
          sideA: { player1: "Alice" },
          sideB: { player1: "Bob", player2: "David" },
        }
        const result = MatchValidator.validatePlayers(players, "DOUBLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("Team A player 2 is required for doubles")
      })

      it("should reject missing side B player 2 in doubles", () => {
        const players: Players = {
          sideA: { player1: "Alice", player2: "Carol" },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "DOUBLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("Team B player 2 is required for doubles")
      })
    })

    describe("Common validations", () => {
      it("should reject duplicate player names", () => {
        const players: Players = {
          sideA: { player1: "Alice", player2: "Bob" },
          sideB: { player1: "Bob", player2: "David" },
        }
        const result = MatchValidator.validatePlayers(players, "DOUBLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("must be unique")
      })

      it("should reject same name for both singles players", () => {
        const players: Players = {
          sideA: { player1: "Alice" },
          sideB: { player1: "Alice" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("must be unique")
      })

      it("should reject player name that is too long", () => {
        const longName = "A".repeat(101)
        const players: Players = {
          sideA: { player1: longName },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("too long")
      })

      it("should accept player name at max length", () => {
        const maxName = "A".repeat(100)
        const players: Players = {
          sideA: { player1: maxName },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(true)
      })

      it("should reject whitespace-only player names", () => {
        const players: Players = {
          sideA: { player1: "   " },
          sideB: { player1: "Bob" },
        }
        const result = MatchValidator.validatePlayers(players, "SINGLES")
        expect(result.valid).toBe(false)
        expect(result.error).toContain("is required")
      })
    })
  })

  describe("validateMatchName", () => {
    it("should validate correct match name", () => {
      const result = MatchValidator.validateMatchName("Friendly Match")
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject empty match name", () => {
      const result = MatchValidator.validateMatchName("")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject whitespace-only match name", () => {
      const result = MatchValidator.validateMatchName("   ")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject match name that is too long", () => {
      const longName = "A".repeat(201)
      const result = MatchValidator.validateMatchName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("too long")
    })

    it("should accept match name at max length", () => {
      const maxName = "A".repeat(200)
      const result = MatchValidator.validateMatchName(maxName)
      expect(result.valid).toBe(true)
    })

    it("should accept match name with special characters", () => {
      const result = MatchValidator.validateMatchName("Tournament 2024 - Finals (Best of 5)")
      expect(result.valid).toBe(true)
    })
  })

  describe("validateMatchCreation", () => {
    it("should validate correct singles match creation", () => {
      const result = MatchValidator.validateMatchCreation(
        "Friendly Singles",
        "SINGLES",
        validSinglesPlayers,
        defaultConfig
      )
      expect(result.valid).toBe(true)
    })

    it("should validate correct doubles match creation", () => {
      const result = MatchValidator.validateMatchCreation(
        "Friendly Doubles",
        "DOUBLES",
        validDoublesPlayers,
        defaultConfig
      )
      expect(result.valid).toBe(true)
    })

    it("should reject invalid match name", () => {
      const result = MatchValidator.validateMatchCreation(
        "",
        "SINGLES",
        validSinglesPlayers,
        defaultConfig
      )
      expect(result.valid).toBe(false)
      expect(result.error).toContain("required")
    })

    it("should reject invalid players", () => {
      const invalidPlayers: Players = {
        sideA: { player1: "" },
        sideB: { player1: "Bob" },
      }
      const result = MatchValidator.validateMatchCreation(
        "Test Match",
        "SINGLES",
        invalidPlayers,
        defaultConfig
      )
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Team A player 1 is required")
    })

    it("should handle all validations together", () => {
      const longName = "A".repeat(201)
      const result = MatchValidator.validateMatchCreation(
        longName,
        "SINGLES",
        validSinglesPlayers,
        defaultConfig
      )
      expect(result.valid).toBe(false)
    })
  })
})
