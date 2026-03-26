import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { MatchRepository } from "@/lib/db/repositories/MatchRepository"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

// CUIDs are 25 chars, lowercase alphanumeric
const CUID_REGEX = /^c[a-z0-9]{24}$/

async function resolvePlayerName(value: string | null | undefined): Promise<string | null | undefined> {
  if (!value || !CUID_REGEX.test(value)) return value
  const player = await prisma.player.findUnique({ where: { id: value }, select: { name: true } })
  return player?.name ?? value
}

export async function GET(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const match = await MatchRepository.findByIdWithDetails(params.matchId)
    if (!match) {
      return errorResponse("Match not found", 404)
    }

    // Determine current server (including positions for doubles)
    let currentServer: Record<string, unknown> | null = null
    if (match.status === "IN_PROGRESS") {
      const rallies = match.rallies || []
      const currentSet = match.sets.find((s: { setNumber: number }) => s.setNumber === match.currentSetNumber)

      // Check if we're at the start of a new set
      const currentSetRallies = currentSet
        ? rallies.filter((r: { setId: string }) => r.setId === currentSet.id)
        : []
      const isNewSetStart = currentSetRallies.length === 0 && rallies.length > 0

      if (isNewSetStart) {
        // BWF rule: winner of previous set serves first
        const previousSet = match.sets
          .filter((s: { completedAt: Date | null; winningSide: string | null }) => s.completedAt && s.winningSide)
          .sort((a: { setNumber: number }, b: { setNumber: number }) => b.setNumber - a.setNumber)[0]

        if (previousSet) {
          const winningSide = previousSet.winningSide as string
          currentServer = {
            servingSide: winningSide,
            serverName: winningSide === "A" ? match.sideAPlayer1 : match.sideBPlayer1,
          }
          if (match.type === "DOUBLES" && match.sideAPlayer2 && match.sideBPlayer2) {
            currentServer.positions = {
              sideA: { rightCourt: match.sideAPlayer1, leftCourt: match.sideAPlayer2 },
              sideB: { rightCourt: match.sideBPlayer1, leftCourt: match.sideBPlayer2 },
            }
          }
        }
      } else if (rallies.length > 0) {
        const lastRally = rallies[rallies.length - 1]
        currentServer = {
          servingSide: lastRally.servingSide,
          serverName: lastRally.serverName,
        }
        if (lastRally.serverPositions && match.type === "DOUBLES") {
          currentServer.positions = lastRally.serverPositions
        }
      } else if (match.initialServingSide && match.initialServerName) {
        currentServer = {
          servingSide: match.initialServingSide,
          serverName: match.initialServerName,
        }
        if (match.type === "DOUBLES" && match.sideAPlayer2 && match.sideBPlayer2) {
          // Server starts in right court at 0-0; receiver in right court on their side
          const servSide = match.initialServingSide
          const sideAPositions = servSide === "A"
            ? (match.initialServerName === match.sideAPlayer1
              ? { rightCourt: match.sideAPlayer1, leftCourt: match.sideAPlayer2 }
              : { rightCourt: match.sideAPlayer2!, leftCourt: match.sideAPlayer1 })
            : (match.initialReceiverName && match.initialReceiverName === match.sideAPlayer2
              ? { rightCourt: match.sideAPlayer2, leftCourt: match.sideAPlayer1 }
              : { rightCourt: match.sideAPlayer1, leftCourt: match.sideAPlayer2 })
          const sideBPositions = servSide === "B"
            ? (match.initialServerName === match.sideBPlayer1
              ? { rightCourt: match.sideBPlayer1, leftCourt: match.sideBPlayer2 }
              : { rightCourt: match.sideBPlayer2!, leftCourt: match.sideBPlayer1 })
            : (match.initialReceiverName && match.initialReceiverName === match.sideBPlayer2
              ? { rightCourt: match.sideBPlayer2, leftCourt: match.sideBPlayer1 }
              : { rightCourt: match.sideBPlayer1, leftCourt: match.sideBPlayer2 })
          currentServer.positions = { sideA: sideAPositions, sideB: sideBPositions }
        }
      }
    }

    // Resolve player IDs stored as names (legacy data issue)
    const resolvedMatch = { ...match } as any
    resolvedMatch.sideAPlayer1 = await resolvePlayerName(match.sideAPlayer1) ?? match.sideAPlayer1
    resolvedMatch.sideAPlayer2 = await resolvePlayerName(match.sideAPlayer2)
    resolvedMatch.sideBPlayer1 = await resolvePlayerName(match.sideBPlayer1) ?? match.sideBPlayer1
    resolvedMatch.sideBPlayer2 = await resolvePlayerName(match.sideBPlayer2)

    return successResponse({ match: resolvedMatch, currentServer })
  } catch (error) {
    console.error("Get match error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const match = await MatchRepository.findById(params.matchId)
    if (!match) {
      return errorResponse("Match not found", 404)
    }

    const body = await request.json()

    // Prevent tournament change if match has started
    if (body.tournamentId !== undefined && match.status !== "NOT_STARTED") {
      return errorResponse("Cannot change tournament once match has started", 400)
    }

    // Pick only allowed fields to prevent unknown field errors
    const allowedFields = [
      "name", "status", "currentSetNumber", "setsWonBySideA", "setsWonBySideB",
      "winningSide", "startedAt", "completedAt", "tournamentId",
      "initialServingSide", "initialServerName", "initialReceiverName",
      "tossWonBy", "tossChoice", "courtSwapped",
    ] as const
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    const updatedMatch = await MatchRepository.update(params.matchId, updateData as any)

    return successResponse({ match: updatedMatch })
  } catch (error) {
    console.error("Update match error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return errorResponse(message, 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const match = await MatchRepository.findById(params.matchId)
    if (!match) {
      return errorResponse("Match not found", 404)
    }

    await MatchRepository.delete(params.matchId)

    return successResponse({ message: "Match deleted successfully" })
  } catch (error) {
    console.error("Delete match error:", error)
    return errorResponse("Internal server error", 500)
  }
}
