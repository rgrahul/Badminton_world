import { describe, it, expect } from "vitest"
import { ServerTracker } from "@/lib/scoring-engine/ServerTracker"
import type { Players, ServerInfo } from "@/lib/scoring-engine/types"

describe("ServerTracker", () => {
  const singlesPlayers: Players = {
    sideA: { player1: "Alice" },
    sideB: { player1: "Bob" },
  }

  const doublesPlayers: Players = {
    sideA: { player1: "Alice", player2: "Carol" },
    sideB: { player1: "Bob", player2: "David" },
  }

  describe("getInitialServer", () => {
    it("should return side A player 1 for singles", () => {
      const server = ServerTracker.getInitialServer(singlesPlayers, "SINGLES")
      expect(server.servingSide).toBe("A")
      expect(server.serverName).toBe("Alice")
      expect(server.positions).toBeUndefined()
    })

    it("should return side A player 1 for doubles with positions", () => {
      const server = ServerTracker.getInitialServer(doublesPlayers, "DOUBLES")
      expect(server.servingSide).toBe("A")
      expect(server.serverName).toBe("Alice")
      expect(server.positions).toBeDefined()
      expect(server.positions?.sideA.rightCourt).toBe("Alice")
      expect(server.positions?.sideA.leftCourt).toBe("Carol")
      expect(server.positions?.sideB.rightCourt).toBe("Bob")
      expect(server.positions?.sideB.leftCourt).toBe("David")
    })
  })

  describe("getNextServer - Singles", () => {
    it("should keep same server when they win the point", () => {
      const currentServer: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
      }
      const newServer = ServerTracker.getNextServer(
        currentServer,
        "A",
        singlesPlayers,
        "SINGLES",
        5,
        4
      )
      expect(newServer.servingSide).toBe("A")
      expect(newServer.serverName).toBe("Alice")
    })

    it("should switch server when opponent wins the point", () => {
      const currentServer: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
      }
      const newServer = ServerTracker.getNextServer(
        currentServer,
        "B",
        singlesPlayers,
        "SINGLES",
        5,
        6
      )
      expect(newServer.servingSide).toBe("B")
      expect(newServer.serverName).toBe("Bob")
    })
  })

  describe("getNextServer - Doubles (BWF Rules)", () => {
    describe("Serving side WINS rally", () => {
      it("should switch positions and determine server based on score (even->odd)", () => {
        // Team A serving at 0-0 (even), Alice in right court
        const currentServer: ServerInfo = {
          servingSide: "A",
          serverName: "Alice",
          positions: {
            sideA: { rightCourt: "Alice", leftCourt: "Carol" },
            sideB: { rightCourt: "Bob", leftCourt: "David" },
          },
        }

        // Team A scores: 1-0 (odd score, should serve from left)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "A",
          doublesPlayers,
          "DOUBLES",
          1, // scoreA after point
          0  // scoreB
        )

        expect(newServer.servingSide).toBe("A")
        // After switching: Alice in left, Carol in right
        // Score is odd (1), so serve from left court
        expect(newServer.serverName).toBe("Alice")
        expect(newServer.positions?.sideA.rightCourt).toBe("Carol")
        expect(newServer.positions?.sideA.leftCourt).toBe("Alice")
      })

      it("should switch positions and determine server based on score (odd->even)", () => {
        // Team A serving at 1-0 (odd), Alice in left court (after previous switch)
        const currentServer: ServerInfo = {
          servingSide: "A",
          serverName: "Alice",
          positions: {
            sideA: { rightCourt: "Carol", leftCourt: "Alice" },
            sideB: { rightCourt: "Bob", leftCourt: "David" },
          },
        }

        // Team A scores: 2-0 (even score, should serve from right)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "A",
          doublesPlayers,
          "DOUBLES",
          2, // scoreA after point
          0  // scoreB
        )

        expect(newServer.servingSide).toBe("A")
        // After switching: Carol in left, Alice in right
        // Score is even (2), so serve from right court
        expect(newServer.serverName).toBe("Alice")
        expect(newServer.positions?.sideA.rightCourt).toBe("Alice")
        expect(newServer.positions?.sideA.leftCourt).toBe("Carol")
      })

      it("should handle Team B winning multiple consecutive rallies", () => {
        // Team B serving at 4-5 (odd), David in left court
        const currentServer: ServerInfo = {
          servingSide: "B",
          serverName: "David",
          positions: {
            sideA: { rightCourt: "Alice", leftCourt: "Carol" },
            sideB: { rightCourt: "Bob", leftCourt: "David" },
          },
        }

        // Team B scores: 4-6 (even score, should serve from right)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "B",
          doublesPlayers,
          "DOUBLES",
          4, // scoreA
          6  // scoreB after point
        )

        expect(newServer.servingSide).toBe("B")
        // After switching: David in right, Bob in left
        // Score is even (6), so serve from right court
        expect(newServer.serverName).toBe("David")
        expect(newServer.positions?.sideB.rightCourt).toBe("David")
        expect(newServer.positions?.sideB.leftCourt).toBe("Bob")
      })
    })

    describe("Service changes (receiving side wins rally)", () => {
      it("should pass service without switching positions (even score)", () => {
        // Team A serving, Team B wins to make it 0-1
        const currentServer: ServerInfo = {
          servingSide: "A",
          serverName: "Alice",
          positions: {
            sideA: { rightCourt: "Alice", leftCourt: "Carol" },
            sideB: { rightCourt: "Bob", leftCourt: "David" },
          },
        }

        // Team B wins: 0-1 (odd score for Team B, serve from left)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "B",
          doublesPlayers,
          "DOUBLES",
          0, // scoreA
          1  // scoreB after point
        )

        expect(newServer.servingSide).toBe("B")
        // Positions don't change, score is odd (1), serve from left
        expect(newServer.serverName).toBe("David")
        expect(newServer.positions?.sideB.rightCourt).toBe("Bob")
        expect(newServer.positions?.sideB.leftCourt).toBe("David")
      })

      it("should pass service without switching positions (odd score)", () => {
        // Team B serving, Team A wins
        const currentServer: ServerInfo = {
          servingSide: "B",
          serverName: "David",
          positions: {
            sideA: { rightCourt: "Carol", leftCourt: "Alice" },
            sideB: { rightCourt: "David", leftCourt: "Bob" },
          },
        }

        // Team A wins: 8-7 (even score for Team A, serve from right)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "A",
          doublesPlayers,
          "DOUBLES",
          8, // scoreA after point
          7  // scoreB
        )

        expect(newServer.servingSide).toBe("A")
        // Positions don't change, score is even (8), serve from right
        expect(newServer.serverName).toBe("Carol")
        expect(newServer.positions?.sideA.rightCourt).toBe("Carol")
        expect(newServer.positions?.sideA.leftCourt).toBe("Alice")
      })

      it("should determine correct server at 20-20 (even score)", () => {
        // Close game, service changes at 20-20
        const currentServer: ServerInfo = {
          servingSide: "A",
          serverName: "Alice",
          positions: {
            sideA: { rightCourt: "Alice", leftCourt: "Carol" },
            sideB: { rightCourt: "Bob", leftCourt: "David" },
          },
        }

        // Team B wins: 20-20 (even score for Team B, serve from right)
        const newServer = ServerTracker.getNextServer(
          currentServer,
          "B",
          doublesPlayers,
          "DOUBLES",
          20, // scoreA
          20  // scoreB after point
        )

        expect(newServer.servingSide).toBe("B")
        expect(newServer.serverName).toBe("Bob") // Even score, right court
        expect(newServer.positions?.sideB.rightCourt).toBe("Bob")
      })
    })

    it("should handle backwards compatibility - initialize positions if missing", () => {
      // Old match without positions
      const currentServer: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
        // No positions
      }

      // Team A wins
      const newServer = ServerTracker.getNextServer(
        currentServer,
        "A",
        doublesPlayers,
        "DOUBLES",
        1, // scoreA after point
        0  // scoreB
      )

      expect(newServer.servingSide).toBe("A")
      expect(newServer.positions).toBeDefined()
      expect(newServer.positions?.sideA.rightCourt).toBe("Carol")
      expect(newServer.positions?.sideA.leftCourt).toBe("Alice")
    })
  })

  describe("getServerForNewSet", () => {
    it("should return side A player 1 if they won previous set (singles)", () => {
      const server = ServerTracker.getServerForNewSet("A", doublesPlayers, "SINGLES")
      expect(server.servingSide).toBe("A")
      expect(server.serverName).toBe("Alice")
      expect(server.positions).toBeUndefined()
    })

    it("should return side B player 1 with reset positions if they won previous set (doubles)", () => {
      const server = ServerTracker.getServerForNewSet("B", doublesPlayers, "DOUBLES")
      expect(server.servingSide).toBe("B")
      expect(server.serverName).toBe("Bob")
      expect(server.positions).toBeDefined()
      // Positions reset to initial
      expect(server.positions?.sideA.rightCourt).toBe("Alice")
      expect(server.positions?.sideA.leftCourt).toBe("Carol")
      expect(server.positions?.sideB.rightCourt).toBe("Bob")
      expect(server.positions?.sideB.leftCourt).toBe("David")
    })
  })

  describe("validateServer", () => {
    it("should validate correct server for singles", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
      }
      const result = ServerTracker.validateServer(server, singlesPlayers)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should validate correct server for doubles with positions", () => {
      const server: ServerInfo = {
        servingSide: "B",
        serverName: "David",
        positions: {
          sideA: { rightCourt: "Alice", leftCourt: "Carol" },
          sideB: { rightCourt: "Bob", leftCourt: "David" },
        },
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(true)
    })

    it("should reject invalid player name", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "InvalidPlayer",
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("not a valid player")
    })

    it("should reject server on wrong side", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "Bob", // Bob is on side B
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("not on side A")
    })

    it("should reject invalid position player", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
        positions: {
          sideA: { rightCourt: "Alice", leftCourt: "InvalidPlayer" },
          sideB: { rightCourt: "Bob", leftCourt: "David" },
        },
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("not a valid player")
    })

    it("should reject duplicate player in same side courts", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
        positions: {
          sideA: { rightCourt: "Alice", leftCourt: "Alice" }, // Same player
          sideB: { rightCourt: "Bob", leftCourt: "David" },
        },
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("cannot be in both courts")
    })

    it("should reject server not in their side positions", () => {
      const server: ServerInfo = {
        servingSide: "A",
        serverName: "Alice",
        positions: {
          sideA: { rightCourt: "Carol", leftCourt: "Carol" }, // Alice not in positions
          sideB: { rightCourt: "Bob", leftCourt: "David" },
        },
      }
      const result = ServerTracker.validateServer(server, doublesPlayers)
      expect(result.valid).toBe(false)
    })
  })
})
