import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const { playerId } = params

    // Get the player to find their name (Match model stores player names, not IDs)
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    })

    if (!player) {
      return errorResponse("Player not found", 404)
    }

    const playerName = player.name

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10))
    const typeFilter = searchParams.get("type") as "SINGLES" | "DOUBLES" | null
    const resultFilter = searchParams.get("result") as "WIN" | "LOSS" | null

    // Validate enum filters
    if (typeFilter && !["SINGLES", "DOUBLES"].includes(typeFilter)) {
      return errorResponse("Invalid type filter. Must be SINGLES or DOUBLES")
    }
    if (resultFilter && !["WIN", "LOSS"].includes(resultFilter)) {
      return errorResponse("Invalid result filter. Must be WIN or LOSS")
    }

    // Build the where clause: find all matches where the player participated
    const playerCondition = {
      OR: [
        { sideAPlayer1: playerName },
        { sideAPlayer2: playerName },
        { sideBPlayer1: playerName },
        { sideBPlayer2: playerName },
      ],
    }

    const typeCondition = typeFilter ? { type: typeFilter } : {}

    // Find all matches for this player (unfiltered by result, for summary stats)
    const allMatches = await prisma.match.findMany({
      where: {
        ...playerCondition,
      },
      orderBy: { createdAt: "desc" },
    })

    // Get all rallies from player's matches for service stats
    const matchIds = allMatches.map((m) => m.id)

    // Build a map of matchId -> player's side
    const playerSideMap: Record<string, string> = {}
    for (const m of allMatches) {
      const isOnA = m.sideAPlayer1 === playerName || m.sideAPlayer2 === playerName
      playerSideMap[m.id] = isOnA ? "A" : "B"
    }

    const allRallies = matchIds.length > 0
      ? await prisma.rally.findMany({
          where: {
            matchId: { in: matchIds },
            isDeleted: false,
          },
          select: {
            matchId: true,
            serverName: true,
            servingSide: true,
            scoringSide: true,
          },
        })
      : []

    // Service stats: when this player was serving
    const playerServes = allRallies.filter((r) => r.serverName === playerName)
    const servicePointsWon = playerServes.filter(
      (r) => r.scoringSide === r.servingSide
    ).length
    const servicePointsLost = playerServes.filter(
      (r) => r.scoringSide !== r.servingSide
    ).length
    const totalServicePoints = servicePointsWon + servicePointsLost

    // Service break stats: when opponent was serving and player's side scored
    const opponentServes = allRallies.filter(
      (r) => r.serverName !== playerName && r.servingSide !== playerSideMap[r.matchId]
    )
    const breakPointsWon = opponentServes.filter(
      (r) => r.scoringSide === playerSideMap[r.matchId]
    ).length
    const breakPointsLost = opponentServes.filter(
      (r) => r.scoringSide !== playerSideMap[r.matchId]
    ).length
    const totalBreakPoints = breakPointsWon + breakPointsLost

    // Determine player side and result for each match
    const enrichedMatches = allMatches.map((match) => {
      const isOnSideA =
        match.sideAPlayer1 === playerName || match.sideAPlayer2 === playerName
      const playerSide = isOnSideA ? "A" : "B"

      let result: "WIN" | "LOSS" | "IN_PROGRESS" | "NOT_STARTED"
      if (match.status === "COMPLETED" && match.winningSide) {
        result = match.winningSide === playerSide ? "WIN" : "LOSS"
      } else if (match.status === "IN_PROGRESS") {
        result = "IN_PROGRESS"
      } else {
        result = "NOT_STARTED"
      }

      return {
        id: match.id,
        name: match.name,
        type: match.type,
        status: match.status,
        winningSide: match.winningSide,
        setsWonBySideA: match.setsWonBySideA,
        setsWonBySideB: match.setsWonBySideB,
        playerSide,
        result,
        createdAt: match.createdAt,
        startedAt: match.startedAt,
        completedAt: match.completedAt,
      }
    })

    // Compute summary from ALL matches (before pagination/result filtering)
    const completedMatches = enrichedMatches.filter(
      (m) => m.status === "COMPLETED"
    )
    const totalWins = completedMatches.filter((m) => m.result === "WIN").length
    const totalLosses = completedMatches.filter(
      (m) => m.result === "LOSS"
    ).length

    const singlesMatches = completedMatches.filter(
      (m) => m.type === "SINGLES"
    )
    const doublesMatches = completedMatches.filter(
      (m) => m.type === "DOUBLES"
    )
    const singlesWins = singlesMatches.filter((m) => m.result === "WIN").length
    const singlesLosses = singlesMatches.filter(
      (m) => m.result === "LOSS"
    ).length
    const doublesWins = doublesMatches.filter((m) => m.result === "WIN").length
    const doublesLosses = doublesMatches.filter(
      (m) => m.result === "LOSS"
    ).length

    const summary = {
      totalMatches: enrichedMatches.length,
      totalWins,
      totalLosses,
      winPercentage:
        completedMatches.length > 0
          ? Math.round((totalWins / completedMatches.length) * 10000) / 100
          : 0,
      serviceStats: {
        totalServes: totalServicePoints,
        pointsWon: servicePointsWon,
        pointsLost: servicePointsLost,
        winPercentage:
          totalServicePoints > 0
            ? Math.round((servicePointsWon / totalServicePoints) * 10000) / 100
            : 0,
      },
      breakStats: {
        totalOpponentServes: totalBreakPoints,
        breaksWon: breakPointsWon,
        breaksLost: breakPointsLost,
        breakPercentage:
          totalBreakPoints > 0
            ? Math.round((breakPointsWon / totalBreakPoints) * 10000) / 100
            : 0,
      },
      byType: {
        SINGLES: {
          played: singlesMatches.length,
          wins: singlesWins,
          losses: singlesLosses,
          winPercentage:
            singlesMatches.length > 0
              ? Math.round(
                  (singlesWins / singlesMatches.length) * 10000
                ) / 100
              : 0,
        },
        DOUBLES: {
          played: doublesMatches.length,
          wins: doublesWins,
          losses: doublesLosses,
          winPercentage:
            doublesMatches.length > 0
              ? Math.round(
                  (doublesWins / doublesMatches.length) * 10000
                ) / 100
              : 0,
        },
      },
    }

    // Apply type and result filters for the paginated match list
    let filteredMatches = enrichedMatches
    if (typeFilter) {
      filteredMatches = filteredMatches.filter((m) => m.type === typeFilter)
    }
    if (resultFilter) {
      filteredMatches = filteredMatches.filter((m) => m.result === resultFilter)
    }

    const paginatedMatches = filteredMatches.slice(offset, offset + limit)

    // Recent form: last 5 completed match results (most recent first)
    const recentForm = completedMatches
      .slice(0, 5)
      .map((m) => (m.result === "WIN" ? "W" : "L"))

    return successResponse({
      summary,
      matches: paginatedMatches,
      recentForm,
    })
  } catch (error) {
    console.error("Get player stats error:", error)
    return errorResponse("Internal server error", 500)
  }
}
