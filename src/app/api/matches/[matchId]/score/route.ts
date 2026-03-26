import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { MatchRepository } from "@/lib/db/repositories/MatchRepository"
import { SetRepository } from "@/lib/db/repositories/SetRepository"
import { RallyRepository } from "@/lib/db/repositories/RallyRepository"
import { MatchEngine } from "@/lib/scoring-engine/MatchEngine"
import { ServerTracker } from "@/lib/scoring-engine/ServerTracker"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"
import type { Side, MatchState, Players, ServerInfo } from "@/lib/scoring-engine/types"

const scoreSchema = z.object({
  scoringSide: z.enum(["A", "B"]),
})

export async function POST(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const { scoringSide } = scoreSchema.parse(body)

    // Get match with details
    const match = await MatchRepository.findByIdWithDetails(params.matchId)
    if (!match) {
      return errorResponse("Match not found", 404)
    }

    if (match.status === "COMPLETED") {
      return errorResponse("Match is already completed")
    }

    // Start match if not started
    let matchStatus = match.status
    if (match.status === "NOT_STARTED") {
      // Check tournament restrictions if match is part of a tournament
      if (match.tournament) {
        if (match.tournament.status === "UPCOMING") {
          return errorResponse("Cannot start match. Tournament has not started yet.", 400)
        }
      }

      await MatchRepository.update(match.id, {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      })
      matchStatus = "IN_PROGRESS"
    }

    // Build match state from database
    const players: Players = {
      sideA: {
        player1: match.sideAPlayer1,
        player2: match.sideAPlayer2 || undefined,
      },
      sideB: {
        player1: match.sideBPlayer1,
        player2: match.sideBPlayer2 || undefined,
      },
    }

    // Find the current set by setNumber (not just the last one in array)
    const currentSet = match.sets.find((s) => s.setNumber === match.currentSetNumber)
    if (!currentSet) {
      return errorResponse(`Set ${match.currentSetNumber} not found`)
    }

    const rallies = match.rallies

    // Determine current server (including positions for doubles)
    let serverInfo: ServerInfo = {
      servingSide: "A" as Side,
      serverName: match.sideAPlayer1,
    }

    // Check if we're at the start of a new set (current set has no rallies)
    const currentSetRallies = rallies.filter((r) => r.setId === currentSet.id)
    const isNewSetStart = currentSetRallies.length === 0 && rallies.length > 0

    if (isNewSetStart) {
      // BWF rule: winner of previous set serves first, positions reset
      const previousSet = match.sets
        .filter((s) => s.completedAt && s.winningSide)
        .sort((a, b) => b.setNumber - a.setNumber)[0]

      if (previousSet) {
        serverInfo = ServerTracker.getServerForNewSet(
          previousSet.winningSide as Side,
          players,
          match.type
        )
      }
    } else if (rallies.length > 0) {
      const lastRally = rallies[rallies.length - 1]
      serverInfo = {
        servingSide: lastRally.servingSide as Side,
        serverName: lastRally.serverName,
      }
      // Reconstruct positions from stored data (for doubles)
      if (lastRally.serverPositions && match.type === "DOUBLES") {
        const pos = lastRally.serverPositions as Record<string, Record<string, string>>
        serverInfo.positions = {
          sideA: { rightCourt: pos.sideA.rightCourt, leftCourt: pos.sideA.leftCourt },
          sideB: { rightCourt: pos.sideB.rightCourt, leftCourt: pos.sideB.leftCourt },
        }
      }
    } else if (match.initialServingSide && match.initialServerName) {
      serverInfo = {
        servingSide: match.initialServingSide as Side,
        serverName: match.initialServerName,
      }
      // For doubles, set positions based on toss selections
      if (match.type === "DOUBLES" && players.sideA.player2 && players.sideB.player2) {
        const servSide = match.initialServingSide
        // Server starts in right court at 0-0; receiver in right court on their side
        const sideAPos = servSide === "A"
          ? (match.initialServerName === match.sideAPlayer1
            ? { rightCourt: match.sideAPlayer1, leftCourt: match.sideAPlayer2! }
            : { rightCourt: match.sideAPlayer2!, leftCourt: match.sideAPlayer1 })
          : (match.initialReceiverName && match.initialReceiverName === match.sideAPlayer2
            ? { rightCourt: match.sideAPlayer2!, leftCourt: match.sideAPlayer1 }
            : { rightCourt: match.sideAPlayer1, leftCourt: match.sideAPlayer2! })
        const sideBPos = servSide === "B"
          ? (match.initialServerName === match.sideBPlayer1
            ? { rightCourt: match.sideBPlayer1, leftCourt: match.sideBPlayer2! }
            : { rightCourt: match.sideBPlayer2!, leftCourt: match.sideBPlayer1 })
          : (match.initialReceiverName && match.initialReceiverName === match.sideBPlayer2
            ? { rightCourt: match.sideBPlayer2!, leftCourt: match.sideBPlayer1 }
            : { rightCourt: match.sideBPlayer1, leftCourt: match.sideBPlayer2! })
        serverInfo.positions = { sideA: sideAPos, sideB: sideBPos }
      }
    }

    // For doubles without stored positions, initialize them
    if (match.type === "DOUBLES" && !serverInfo.positions && players.sideA.player2 && players.sideB.player2) {
      serverInfo.positions = {
        sideA: { rightCourt: players.sideA.player1, leftCourt: players.sideA.player2 },
        sideB: { rightCourt: players.sideB.player1, leftCourt: players.sideB.player2 },
      }
    }

    const matchState: MatchState = {
      config: {
        setsCount: match.setsCount,
        pointsToWin: match.pointsToWin,
        deuceCap: match.deuceCap,
      },
      type: match.type,
      status: matchStatus, // Use the updated status (fixes NOT_STARTED bug)
      players,
      score: {
        currentSetNumber: match.currentSetNumber,
        currentSetScoreA: currentSet.scoreA,
        currentSetScoreB: currentSet.scoreB,
        setsWonBySideA: match.setsWonBySideA,
        setsWonBySideB: match.setsWonBySideB,
        sets: match.sets.map((s) => ({
          setNumber: s.setNumber,
          scoreA: s.scoreA,
          scoreB: s.scoreB,
          winningSide: s.winningSide as Side | undefined,
          isComplete: !!s.completedAt,
        })),
      },
      server: serverInfo,
      winningSide: match.winningSide as Side | undefined,
      rallyCount: rallies.length,
    }

    // Add point using scoring engine
    const result = MatchEngine.addPoint(matchState, scoringSide)
    const newState = MatchEngine.applyRallyResult(matchState, result)

    // Save to database
    await SetRepository.update(currentSet.id, {
      scoreA: result.newScore.currentSetScoreA,
      scoreB: result.newScore.currentSetScoreB,
      winningSide: result.setCompleted
        ? result.newScore.sets[result.newScore.sets.length - 1].winningSide
        : null,
      completedAt: result.setCompleted ? new Date() : null,
    })

    await RallyRepository.create({
      matchId: match.id,
      setId: currentSet.id,
      rallyNumber: newState.rallyCount,
      setRallyNum: result.newScore.currentSetScoreA + result.newScore.currentSetScoreB,
      scoringSide,
      scoreA: result.newScore.currentSetScoreA,
      scoreB: result.newScore.currentSetScoreB,
      servingSide: result.newServer.servingSide,
      serverName: result.newServer.serverName,
      serverPositions: result.newServer.positions ?? null,
    })

    // If set completed but match not complete, create new set first
    if (result.setCompleted && !result.matchCompleted) {
      await SetRepository.create({
        matchId: match.id,
        setNumber: result.newScore.currentSetNumber + 1,
      })
    }

    // Update match with correct currentSetNumber
    // NOTE: We don't auto-complete matches - user must click "Complete Match" button
    await MatchRepository.update(match.id, {
      currentSetNumber:
        result.setCompleted && !result.matchCompleted
          ? result.newScore.currentSetNumber + 1 // Move to next set
          : result.newScore.currentSetNumber, // Stay on current set
      setsWonBySideA: result.newScore.setsWonBySideA,
      setsWonBySideB: result.newScore.setsWonBySideB,
      winningSide: result.winningSide || null,
      // Keep match IN_PROGRESS even when someone wins - let user click Complete Match button
      status: "IN_PROGRESS",
      completedAt: null,
    })

    return successResponse({
      result,
      matchStatus: {
        status: newState.status,
        currentScore: {
          setNumber: result.newScore.currentSetNumber,
          scoreA: result.newScore.currentSetScoreA,
          scoreB: result.newScore.currentSetScoreB,
        },
        setsWon: {
          sideA: result.newScore.setsWonBySideA,
          sideB: result.newScore.setsWonBySideB,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Score point error:", error)
    return errorResponse("Internal server error", 500)
  }
}
