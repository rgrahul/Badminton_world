import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const fixtures = await prisma.fixture.findMany({
      where: {
        teamMatch: {
          tournamentId: params.tournamentId,
        },
      },
      include: {
        teamMatch: {
          select: {
            id: true,
            name: true,
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
          },
        },
        match: {
          select: {
            id: true,
            status: true,
            winningSide: true,
            setsWonBySideA: true,
            setsWonBySideB: true,
          },
        },
        teamAPlayer1: { select: { id: true, name: true, profilePhoto: true } },
        teamAPlayer2: { select: { id: true, name: true, profilePhoto: true } },
        teamBPlayer1: { select: { id: true, name: true, profilePhoto: true } },
        teamBPlayer2: { select: { id: true, name: true, profilePhoto: true } },
      },
      orderBy: [
        { teamMatch: { createdAt: "asc" } },
        { fixtureNumber: "asc" },
      ],
    })

    return successResponse({ fixtures })
  } catch (error) {
    console.error("Get fixtures error:", error)
    return errorResponse("Internal server error", 500)
  }
}
