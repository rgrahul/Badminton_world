import type { MatchConfig, Side, SetScore } from "./types"

export class ScoringRules {
  /**
   * Determines if a set is won based on BWF rules
   * @param scoreA - Score for side A
   * @param scoreB - Score for side B
   * @param config - Match configuration
   * @returns Object with isWon flag and winningSide
   */
  static isSetWon(
    scoreA: number,
    scoreB: number,
    config: MatchConfig
  ): { isWon: boolean; winningSide?: Side } {
    const { pointsToWin, deuceCap } = config

    // Check if either side reached deuce cap
    if (scoreA >= deuceCap) {
      return { isWon: true, winningSide: "A" }
    }
    if (scoreB >= deuceCap) {
      return { isWon: true, winningSide: "B" }
    }

    // Check if side A won with 2-point lead
    if (scoreA >= pointsToWin && scoreA - scoreB >= 2) {
      return { isWon: true, winningSide: "A" }
    }

    // Check if side B won with 2-point lead
    if (scoreB >= pointsToWin && scoreB - scoreA >= 2) {
      return { isWon: true, winningSide: "B" }
    }

    return { isWon: false }
  }

  /**
   * Determines if the match is won based on sets won
   * @param setsWonBySideA - Number of sets won by side A
   * @param setsWonBySideB - Number of sets won by side B
   * @param config - Match configuration
   * @returns Object with isWon flag and winningSide
   */
  static isMatchWon(
    setsWonBySideA: number,
    setsWonBySideB: number,
    config: MatchConfig
  ): { isWon: boolean; winningSide?: Side } {
    const setsToWin = Math.ceil(config.setsCount / 2)

    if (setsWonBySideA >= setsToWin) {
      return { isWon: true, winningSide: "A" }
    }

    if (setsWonBySideB >= setsToWin) {
      return { isWon: true, winningSide: "B" }
    }

    return { isWon: false }
  }

  /**
   * Checks if the current score is in deuce (20-20 by default)
   * @param scoreA - Score for side A
   * @param scoreB - Score for side B
   * @param config - Match configuration
   * @returns True if in deuce
   */
  static isDeuce(scoreA: number, scoreB: number, config: MatchConfig): boolean {
    const deucePoint = config.pointsToWin - 1
    return scoreA >= deucePoint && scoreB >= deucePoint
  }

  /**
   * Validates match configuration
   * @param config - Match configuration to validate
   * @returns Validation result
   */
  static validateConfig(config: MatchConfig): { valid: boolean; error?: string } {
    if (config.setsCount < 1 || config.setsCount % 2 === 0) {
      return {
        valid: false,
        error: "Sets count must be an odd number (e.g., 3 or 5)",
      }
    }

    if (config.pointsToWin < 1) {
      return {
        valid: false,
        error: "Points to win must be at least 1",
      }
    }

    if (config.deuceCap < config.pointsToWin) {
      return {
        valid: false,
        error: "Deuce cap must be greater than or equal to points to win",
      }
    }

    return { valid: true }
  }

  /**
   * Validates a point addition
   * @param scoreA - Current score for side A
   * @param scoreB - Current score for side B
   * @param scoringSide - Side that is scoring
   * @param config - Match configuration
   * @returns Validation result
   */
  static validatePointAddition(
    scoreA: number,
    scoreB: number,
    scoringSide: Side,
    config: MatchConfig
  ): { valid: boolean; error?: string } {
    // Check if set is already won
    const setWon = this.isSetWon(scoreA, scoreB, config)
    if (setWon.isWon) {
      return {
        valid: false,
        error: "Cannot add point: set is already won",
      }
    }

    return { valid: true }
  }
}
