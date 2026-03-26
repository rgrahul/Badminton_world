import type { Side, Players, MatchType, ServerInfo } from "./types"

export class ServerTracker {
  /**
   * Determines the initial server for a match
   * Following BWF rules: Side A player 1 starts serving from right court at 0-0
   * @param players - Match players
   * @param type - Match type (singles/doubles)
   * @returns Server information
   */
  static getInitialServer(players: Players, type: MatchType): ServerInfo {
    const serverInfo: ServerInfo = {
      servingSide: "A",
      serverName: players.sideA.player1,
    }

    // For doubles, initialize court positions
    // At 0-0, we set up initial positions (player1 in right, player2 in left)
    if (type === "DOUBLES" && players.sideA.player2 && players.sideB.player2) {
      serverInfo.positions = {
        sideA: {
          rightCourt: players.sideA.player1,
          leftCourt: players.sideA.player2,
        },
        sideB: {
          rightCourt: players.sideB.player1,
          leftCourt: players.sideB.player2,
        },
      }
    }

    return serverInfo
  }

  /**
   * Determines the new server after a point is scored
   *
   * BWF Doubles Rules:
   * 1. Service court is determined by the SERVING team's score:
   *    - EVEN score (0,2,4,6...) = serve from RIGHT court
   *    - ODD score (1,3,5,7...) = serve from LEFT court
   *
   * 2. When serving side WINS a rally:
   *    - The two players on serving side SWITCH positions
   *    - The player now in the correct service court becomes the server
   *
   * 3. When serving side LOSES a rally:
   *    - Service passes to opponents
   *    - Receiving side does NOT switch positions
   *    - The player in the correct service court (based on their score) serves
   *
   * @param currentServer - Current server information
   * @param scoringSide - Side that won the rally
   * @param players - Match players
   * @param type - Match type
   * @param scoreA - Current score for side A (AFTER the point)
   * @param scoreB - Current score for side B (AFTER the point)
   * @returns New server information
   */
  static getNextServer(
    currentServer: ServerInfo,
    scoringSide: Side,
    players: Players,
    type: MatchType,
    scoreA: number,
    scoreB: number
  ): ServerInfo {
    // Singles logic - same player continues if they scored
    if (type === "SINGLES") {
      if (scoringSide !== currentServer.servingSide) {
        // Service changes to opponent
        return {
          servingSide: scoringSide,
          serverName: scoringSide === "A" ? players.sideA.player1 : players.sideB.player1,
        }
      }
      // Same player continues serving
      return currentServer
    }

    // DOUBLES LOGIC (following BWF rules)

    // Get current positions (if not set, initialize them)
    let positions = currentServer.positions
    if (!positions && players.sideA.player2 && players.sideB.player2) {
      // Initialize positions if not present (backwards compatibility)
      positions = {
        sideA: {
          rightCourt: players.sideA.player1,
          leftCourt: players.sideA.player2,
        },
        sideB: {
          rightCourt: players.sideB.player1,
          leftCourt: players.sideB.player2,
        },
      }
    }

    if (!positions) {
      throw new Error("Positions not initialized for doubles match")
    }

    // Case 1: Serving side WON the rally
    if (scoringSide === currentServer.servingSide) {
      // Players on serving side SWITCH positions
      const newPositions = { ...positions }

      if (scoringSide === "A") {
        const temp = newPositions.sideA.rightCourt
        newPositions.sideA.rightCourt = newPositions.sideA.leftCourt
        newPositions.sideA.leftCourt = temp
      } else {
        const temp = newPositions.sideB.rightCourt
        newPositions.sideB.rightCourt = newPositions.sideB.leftCourt
        newPositions.sideB.leftCourt = temp
      }

      // Determine server based on NEW score and NEW positions
      const servingScore = scoringSide === "A" ? scoreA : scoreB
      const isEvenScore = servingScore % 2 === 0
      const serviceCourtSide = isEvenScore ? "rightCourt" : "leftCourt"

      const newServerName = scoringSide === "A"
        ? newPositions.sideA[serviceCourtSide]
        : newPositions.sideB[serviceCourtSide]

      return {
        servingSide: scoringSide,
        serverName: newServerName,
        positions: newPositions,
      }
    }

    // Case 2: Serving side LOST the rally (service changes)
    // The receiving side becomes the serving side
    // Receiving side does NOT switch positions
    const newServingSide = scoringSide
    const newServingScore = scoringSide === "A" ? scoreA : scoreB
    const isEvenScore = newServingScore % 2 === 0
    const serviceCourtSide = isEvenScore ? "rightCourt" : "leftCourt"

    // Get the player in the correct service court on the new serving side
    const newServerName = scoringSide === "A"
      ? positions.sideA[serviceCourtSide]
      : positions.sideB[serviceCourtSide]

    return {
      servingSide: newServingSide,
      serverName: newServerName,
      positions, // Positions don't change when service switches
    }
  }

  /**
   * Determines the server for a new set
   * In badminton, the winner of the previous set serves first in the next set
   * Starting positions are reset to initial (player1 right, player2 left)
   *
   * @param previousSetWinner - Side that won the previous set
   * @param players - Match players
   * @param type - Match type
   * @returns Server information for new set
   */
  static getServerForNewSet(
    previousSetWinner: Side,
    players: Players,
    type: MatchType = "SINGLES"
  ): ServerInfo {
    const serverInfo: ServerInfo = {
      servingSide: previousSetWinner,
      serverName:
        previousSetWinner === "A" ? players.sideA.player1 : players.sideB.player1,
    }

    // For doubles, reset positions to initial state
    if (type === "DOUBLES" && players.sideA.player2 && players.sideB.player2) {
      serverInfo.positions = {
        sideA: {
          rightCourt: players.sideA.player1,
          leftCourt: players.sideA.player2,
        },
        sideB: {
          rightCourt: players.sideB.player1,
          leftCourt: players.sideB.player2,
        },
      }
    }

    return serverInfo
  }

  /**
   * Validates server information against players
   * @param server - Server info to validate
   * @param players - Match players
   * @returns Validation result
   */
  static validateServer(
    server: ServerInfo,
    players: Players
  ): { valid: boolean; error?: string } {
    const allPlayers = [
      players.sideA.player1,
      players.sideA.player2,
      players.sideB.player1,
      players.sideB.player2,
    ].filter((p) => p !== undefined)

    if (!allPlayers.includes(server.serverName)) {
      return {
        valid: false,
        error: `Server '${server.serverName}' is not a valid player`,
      }
    }

    // Validate that server is on the correct side
    const serverSidePlayers =
      server.servingSide === "A"
        ? [players.sideA.player1, players.sideA.player2]
        : [players.sideB.player1, players.sideB.player2]

    if (!serverSidePlayers.includes(server.serverName)) {
      return {
        valid: false,
        error: `Server '${server.serverName}' is not on side ${server.servingSide}`,
      }
    }

    // Validate positions for doubles
    if (server.positions) {
      const posPlayers = [
        server.positions.sideA.rightCourt,
        server.positions.sideA.leftCourt,
        server.positions.sideB.rightCourt,
        server.positions.sideB.leftCourt,
      ]

      // Check all position players are valid
      for (const player of posPlayers) {
        if (!allPlayers.includes(player)) {
          return {
            valid: false,
            error: `Position player '${player}' is not a valid player`,
          }
        }
      }

      // Check no duplicate players in same side
      if (server.positions.sideA.rightCourt === server.positions.sideA.leftCourt) {
        return {
          valid: false,
          error: "Same player cannot be in both courts on side A",
        }
      }
      if (server.positions.sideB.rightCourt === server.positions.sideB.leftCourt) {
        return {
          valid: false,
          error: "Same player cannot be in both courts on side B",
        }
      }

      // Validate server is in the correct court based on positions
      const serverInA = [server.positions.sideA.rightCourt, server.positions.sideA.leftCourt]
      const serverInB = [server.positions.sideB.rightCourt, server.positions.sideB.leftCourt]

      if (server.servingSide === "A" && !serverInA.includes(server.serverName)) {
        return {
          valid: false,
          error: `Server '${server.serverName}' is not in side A positions`,
        }
      }
      if (server.servingSide === "B" && !serverInB.includes(server.serverName)) {
        return {
          valid: false,
          error: `Server '${server.serverName}' is not in side B positions`,
        }
      }
    }

    return { valid: true }
  }
}
