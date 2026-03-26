import { describe, it, expect } from "vitest"
import { SetEngine } from "@/lib/scoring-engine/SetEngine"
import type { MatchConfig, SetScore } from "@/lib/scoring-engine/types"

describe("SetEngine", () => {
  const defaultConfig: MatchConfig = {
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
  }

  describe("createNewSet", () => {
    it("should create a new set with initial scores", () => {
      const set = SetEngine.createNewSet(1)
      expect(set.setNumber).toBe(1)
      expect(set.scoreA).toBe(0)
      expect(set.scoreB).toBe(0)
      expect(set.isComplete).toBe(false)
      expect(set.winningSide).toBeUndefined()
    })

    it("should create sets with different numbers", () => {
      const set2 = SetEngine.createNewSet(2)
      expect(set2.setNumber).toBe(2)
      const set3 = SetEngine.createNewSet(3)
      expect(set3.setNumber).toBe(3)
    })
  })

  describe("addPoint", () => {
    it("should add point to side A", () => {
      const set = SetEngine.createNewSet(1)
      const updatedSet = SetEngine.addPoint(set, "A", defaultConfig)
      expect(updatedSet.scoreA).toBe(1)
      expect(updatedSet.scoreB).toBe(0)
      expect(updatedSet.isComplete).toBe(false)
    })

    it("should add point to side B", () => {
      const set = SetEngine.createNewSet(1)
      const updatedSet = SetEngine.addPoint(set, "B", defaultConfig)
      expect(updatedSet.scoreA).toBe(0)
      expect(updatedSet.scoreB).toBe(1)
      expect(updatedSet.isComplete).toBe(false)
    })

    it("should add multiple points", () => {
      let set = SetEngine.createNewSet(1)
      set = SetEngine.addPoint(set, "A", defaultConfig)
      set = SetEngine.addPoint(set, "A", defaultConfig)
      set = SetEngine.addPoint(set, "B", defaultConfig)
      expect(set.scoreA).toBe(2)
      expect(set.scoreB).toBe(1)
    })

    it("should complete set when side A reaches 21 with 2-point lead", () => {
      let set: SetScore = { setNumber: 1, scoreA: 20, scoreB: 18, isComplete: false }
      set = SetEngine.addPoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(21)
      expect(set.scoreB).toBe(18)
      expect(set.isComplete).toBe(true)
      expect(set.winningSide).toBe("A")
    })

    it("should complete set when side B reaches 21 with 2-point lead", () => {
      let set: SetScore = { setNumber: 1, scoreA: 17, scoreB: 20, isComplete: false }
      set = SetEngine.addPoint(set, "B", defaultConfig)
      expect(set.scoreB).toBe(21)
      expect(set.isComplete).toBe(true)
      expect(set.winningSide).toBe("B")
    })

    it("should not complete set at 21-20", () => {
      let set: SetScore = { setNumber: 1, scoreA: 21, scoreB: 19, isComplete: false }
      set = SetEngine.addPoint(set, "B", defaultConfig)
      expect(set.scoreA).toBe(21)
      expect(set.scoreB).toBe(20)
      expect(set.isComplete).toBe(false)
    })

    it("should complete set in deuce with 2-point lead", () => {
      let set: SetScore = { setNumber: 1, scoreA: 22, scoreB: 21, isComplete: false }
      set = SetEngine.addPoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(23)
      expect(set.scoreB).toBe(21)
      expect(set.isComplete).toBe(true)
      expect(set.winningSide).toBe("A")
    })

    it("should complete set at deuce cap", () => {
      let set: SetScore = { setNumber: 1, scoreA: 29, scoreB: 28, isComplete: false }
      set = SetEngine.addPoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(30)
      expect(set.isComplete).toBe(true)
      expect(set.winningSide).toBe("A")
    })

    it("should throw error when adding point to completed set", () => {
      const completedSet: SetScore = {
        setNumber: 1,
        scoreA: 21,
        scoreB: 19,
        isComplete: true,
        winningSide: "A",
      }
      expect(() => SetEngine.addPoint(completedSet, "B", defaultConfig)).toThrow(
        "Cannot add point to completed set"
      )
    })
  })

  describe("removePoint", () => {
    it("should remove point from side A", () => {
      let set: SetScore = { setNumber: 1, scoreA: 5, scoreB: 3, isComplete: false }
      set = SetEngine.removePoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(4)
      expect(set.scoreB).toBe(3)
    })

    it("should remove point from side B", () => {
      let set: SetScore = { setNumber: 1, scoreA: 5, scoreB: 3, isComplete: false }
      set = SetEngine.removePoint(set, "B", defaultConfig)
      expect(set.scoreA).toBe(5)
      expect(set.scoreB).toBe(2)
    })

    it("should throw error when removing from zero score", () => {
      const set: SetScore = { setNumber: 1, scoreA: 0, scoreB: 3, isComplete: false }
      expect(() => SetEngine.removePoint(set, "A", defaultConfig)).toThrow(
        "Cannot remove point: Side A has zero points"
      )
    })

    it("should uncomplete a set when removing winning point", () => {
      let set: SetScore = {
        setNumber: 1,
        scoreA: 21,
        scoreB: 19,
        isComplete: true,
        winningSide: "A",
      }
      set = SetEngine.removePoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(20)
      expect(set.scoreB).toBe(19)
      expect(set.isComplete).toBe(false)
      expect(set.winningSide).toBeUndefined()
    })

    it("should handle removing point in deuce", () => {
      let set: SetScore = { setNumber: 1, scoreA: 22, scoreB: 21, isComplete: false }
      set = SetEngine.removePoint(set, "A", defaultConfig)
      expect(set.scoreA).toBe(21)
      expect(set.scoreB).toBe(21)
      expect(set.isComplete).toBe(false)
    })
  })

  describe("validateSet", () => {
    it("should validate a correct set", () => {
      const set: SetScore = { setNumber: 1, scoreA: 10, scoreB: 8, isComplete: false }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should validate a completed set", () => {
      const set: SetScore = {
        setNumber: 1,
        scoreA: 21,
        scoreB: 19,
        isComplete: true,
        winningSide: "A",
      }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(true)
    })

    it("should reject negative scores", () => {
      const set: SetScore = { setNumber: 1, scoreA: -1, scoreB: 5, isComplete: false }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("negative")
    })

    it("should reject invalid set number", () => {
      const set: SetScore = { setNumber: 0, scoreA: 5, scoreB: 3, isComplete: false }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("at least 1")
    })

    it("should reject incorrect completion status", () => {
      const set: SetScore = {
        setNumber: 1,
        scoreA: 21,
        scoreB: 19,
        isComplete: false, // Should be true
        winningSide: undefined,
      }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("completion status")
    })

    it("should reject incorrect winning side", () => {
      const set: SetScore = {
        setNumber: 1,
        scoreA: 21,
        scoreB: 19,
        isComplete: true,
        winningSide: "B", // Should be "A"
      }
      const result = SetEngine.validateSet(set, defaultConfig)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("winning side")
    })
  })

  describe("getSetSummary", () => {
    it("should summarize an in-progress set", () => {
      const set: SetScore = { setNumber: 1, scoreA: 10, scoreB: 8, isComplete: false }
      const summary = SetEngine.getSetSummary(set)
      expect(summary).toBe("Set 1: 10-8 (in progress)")
    })

    it("should summarize a completed set", () => {
      const set: SetScore = {
        setNumber: 2,
        scoreA: 19,
        scoreB: 21,
        isComplete: true,
        winningSide: "B",
      }
      const summary = SetEngine.getSetSummary(set)
      expect(summary).toBe("Set 2: 19-21 (B won)")
    })

    it("should summarize a deuce set", () => {
      const set: SetScore = {
        setNumber: 3,
        scoreA: 30,
        scoreB: 28,
        isComplete: true,
        winningSide: "A",
      }
      const summary = SetEngine.getSetSummary(set)
      expect(summary).toBe("Set 3: 30-28 (A won)")
    })
  })
})
