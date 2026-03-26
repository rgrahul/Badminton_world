import type { MatchConfig, SetScore, Side } from "./types"
import { ScoringRules } from "./ScoringRules"

export class SetEngine {
  /**
   * Creates a new set with initial scores
   * @param setNumber - The set number (1, 2, 3, etc.)
   * @returns New set score object
   */
  static createNewSet(setNumber: number): SetScore {
    return {
      setNumber,
      scoreA: 0,
      scoreB: 0,
      isComplete: false,
    }
  }

  /**
   * Adds a point to the specified side in a set
   * @param currentSet - Current set score
   * @param scoringSide - Side that scored the point
   * @param config - Match configuration
   * @returns Updated set score
   */
  static addPoint(
    currentSet: SetScore,
    scoringSide: Side,
    config: MatchConfig
  ): SetScore {
    if (currentSet.isComplete) {
      throw new Error("Cannot add point to completed set")
    }

    const newScoreA = scoringSide === "A" ? currentSet.scoreA + 1 : currentSet.scoreA
    const newScoreB = scoringSide === "B" ? currentSet.scoreB + 1 : currentSet.scoreB

    // Check if set is won
    const setWon = ScoringRules.isSetWon(newScoreA, newScoreB, config)

    return {
      ...currentSet,
      scoreA: newScoreA,
      scoreB: newScoreB,
      isComplete: setWon.isWon,
      winningSide: setWon.winningSide,
    }
  }

  /**
   * Removes a point from the specified side in a set (for undo)
   * @param currentSet - Current set score
   * @param scoringSide - Side to remove point from
   * @param config - Match configuration
   * @returns Updated set score
   */
  static removePoint(
    currentSet: SetScore,
    scoringSide: Side,
    config: MatchConfig
  ): SetScore {
    const currentScore = scoringSide === "A" ? currentSet.scoreA : currentSet.scoreB

    if (currentScore === 0) {
      throw new Error(`Cannot remove point: Side ${scoringSide} has zero points`)
    }

    const newScoreA = scoringSide === "A" ? currentSet.scoreA - 1 : currentSet.scoreA
    const newScoreB = scoringSide === "B" ? currentSet.scoreB - 1 : currentSet.scoreB

    // Re-check if set is still won after removing point
    const setWon = ScoringRules.isSetWon(newScoreA, newScoreB, config)

    return {
      ...currentSet,
      scoreA: newScoreA,
      scoreB: newScoreB,
      isComplete: setWon.isWon,
      winningSide: setWon.winningSide,
    }
  }

  /**
   * Validates a set score
   * @param set - Set to validate
   * @param config - Match configuration
   * @returns Validation result
   */
  static validateSet(
    set: SetScore,
    config: MatchConfig
  ): { valid: boolean; error?: string } {
    if (set.scoreA < 0 || set.scoreB < 0) {
      return { valid: false, error: "Scores cannot be negative" }
    }

    if (set.setNumber < 1) {
      return { valid: false, error: "Set number must be at least 1" }
    }

    // Validate that completion status matches scores
    const setWon = ScoringRules.isSetWon(set.scoreA, set.scoreB, config)
    if (set.isComplete !== setWon.isWon) {
      return {
        valid: false,
        error: "Set completion status does not match scores",
      }
    }

    if (set.isComplete && set.winningSide !== setWon.winningSide) {
      return {
        valid: false,
        error: "Set winning side does not match scores",
      }
    }

    return { valid: true }
  }

  /**
   * Gets a summary of the set
   * @param set - Set to summarize
   * @returns Human-readable summary
   */
  static getSetSummary(set: SetScore): string {
    const status = set.isComplete ? `(${set.winningSide} won)` : "(in progress)"
    return `Set ${set.setNumber}: ${set.scoreA}-${set.scoreB} ${status}`
  }
}
