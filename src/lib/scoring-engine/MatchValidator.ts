import type { MatchConfig, MatchType, Players, ValidationResult } from "./types"

export class MatchValidator {
  /**
   * Validates player configuration
   * @param players - Players to validate
   * @param type - Match type
   * @returns Validation result
   */
  static validatePlayers(players: Players, type: MatchType): ValidationResult {
    // Validate side A player 1
    if (!players.sideA.player1 || players.sideA.player1.trim() === "") {
      return { valid: false, error: "Team A player 1 is required" }
    }

    // Validate side B player 1
    if (!players.sideB.player1 || players.sideB.player1.trim() === "") {
      return { valid: false, error: "Team B player 1 is required" }
    }

    // Validate doubles requirements
    if (type === "DOUBLES") {
      if (!players.sideA.player2 || players.sideA.player2.trim() === "") {
        return { valid: false, error: "Team A player 2 is required for doubles" }
      }
      if (!players.sideB.player2 || players.sideB.player2.trim() === "") {
        return { valid: false, error: "Team B player 2 is required for doubles" }
      }
    }

    // Validate singles requirements (no player 2)
    if (type === "SINGLES") {
      if (players.sideA.player2) {
        return {
          valid: false,
          error: "Team A player 2 should not be set for singles",
        }
      }
      if (players.sideB.player2) {
        return {
          valid: false,
          error: "Team B player 2 should not be set for singles",
        }
      }
    }

    // Validate unique player names
    const allPlayers = [
      players.sideA.player1,
      players.sideA.player2,
      players.sideB.player1,
      players.sideB.player2,
    ].filter((p) => p !== undefined && p !== null)

    const uniquePlayers = new Set(allPlayers)
    if (uniquePlayers.size !== allPlayers.length) {
      return { valid: false, error: "All player names must be unique" }
    }

    // Validate player name length
    for (const player of allPlayers) {
      if (player && player.length > 100) {
        return {
          valid: false,
          error: `Player name "${player}" is too long (max 100 characters)`,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validates match name
   * @param name - Match name to validate
   * @returns Validation result
   */
  static validateMatchName(name: string): ValidationResult {
    if (!name || name.trim() === "") {
      return { valid: false, error: "Match name is required" }
    }

    if (name.length > 200) {
      return {
        valid: false,
        error: "Match name is too long (max 200 characters)",
      }
    }

    return { valid: true }
  }

  /**
   * Validates complete match creation input
   * @param name - Match name
   * @param type - Match type
   * @param players - Match players
   * @param config - Match configuration
   * @returns Validation result
   */
  static validateMatchCreation(
    name: string,
    type: MatchType,
    players: Players,
    config: MatchConfig
  ): ValidationResult {
    // Validate name
    const nameValidation = this.validateMatchName(name)
    if (!nameValidation.valid) {
      return nameValidation
    }

    // Validate players
    const playersValidation = this.validatePlayers(players, type)
    if (!playersValidation.valid) {
      return playersValidation
    }

    // Config validation is handled by ScoringRules

    return { valid: true }
  }
}
