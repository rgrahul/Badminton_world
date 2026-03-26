import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tournamentId: string; playerId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    // Check if player is used in any team for this tournament
    const teamUsage = await prisma.teamPlayer.findFirst({
      where: {
        playerId: params.playerId,
        team: { tournamentId: params.tournamentId },
      },
      include: { team: { select: { name: true } } },
    })

    if (teamUsage) {
      return errorResponse(
        `Cannot remove player - assigned to team "${teamUsage.team.name}". Remove from team first.`,
        400
      )
    }

    // Check if player is assigned to any fixture in this tournament
    const fixtureUsage = await prisma.fixture.findFirst({
      where: {
        teamMatch: { tournamentId: params.tournamentId },
        OR: [
          { teamAPlayer1Id: params.playerId },
          { teamAPlayer2Id: params.playerId },
          { teamBPlayer1Id: params.playerId },
          { teamBPlayer2Id: params.playerId },
        ],
      },
    })

    if (fixtureUsage) {
      return errorResponse(
        "Cannot remove player - assigned to a fixture in this tournament. Remove from fixture first.",
        400
      )
    }

    // Delete the TournamentPlayer record
    await prisma.tournamentPlayer.deleteMany({
      where: {
        tournamentId: params.tournamentId,
        playerId: params.playerId,
      },
    })

    return successResponse({ removed: true })
  } catch (error) {
    console.error("Remove tournament player error:", error)
    return errorResponse("Internal server error", 500)
  }
}
