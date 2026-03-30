import { NextRequest } from "next/server"
import { successResponse, errorResponse } from "@/lib/api/responses"
import { syncAuctionTeamsToTournament } from "@/lib/auctionSyncTeamsToTournament"

export async function POST(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const result = await syncAuctionTeamsToTournament(params.auctionId, {
      requireSoldPlayers: true,
      skipOnTeamNameConflict: false,
    })

    if (!result.ok) {
      return errorResponse(result.error, 400)
    }

    return successResponse(
      {
        teams: [],
        count: result.teamsCreated,
      },
      201
    )
  } catch (error) {
    console.error("Sync teams error:", error)
    return errorResponse("Failed to create tournament teams", 500)
  }
}
