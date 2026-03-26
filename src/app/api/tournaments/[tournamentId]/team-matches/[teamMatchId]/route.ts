import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TeamMatchRepository } from "@/lib/db/repositories/TeamMatchRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string; teamMatchId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    let teamMatch = await TeamMatchRepository.findById(params.teamMatchId)
    if (!teamMatch || teamMatch.tournamentId !== params.tournamentId) {
      return errorResponse("Team match not found", 404)
    }

    // Auto-detect completion: if not completed, check if all fixtures are done
    if (teamMatch.status !== "COMPLETED") {
      const allFixturesCompleted =
        teamMatch.fixtures.length > 0 &&
        teamMatch.fixtures.every(
          (f) => f.match && f.match.status === "COMPLETED"
        )
      if (allFixturesCompleted) {
        const updated = await TeamMatchRepository.recalculateResult(params.teamMatchId)
        if (updated) teamMatch = updated
      }
    }

    return successResponse({ teamMatch })
  } catch (error) {
    console.error("Get team match error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tournamentId: string; teamMatchId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const teamMatch = await TeamMatchRepository.findById(params.teamMatchId)
    if (!teamMatch || teamMatch.tournamentId !== params.tournamentId) {
      return errorResponse("Team match not found", 404)
    }

    await TeamMatchRepository.delete(params.teamMatchId)

    return successResponse({ message: "Team match deleted successfully" })
  } catch (error) {
    console.error("Delete team match error:", error)
    return errorResponse("Internal server error", 500)
  }
}
