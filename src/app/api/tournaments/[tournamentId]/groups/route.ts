import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { GroupRepository } from "@/lib/db/repositories/GroupRepository"
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

    const groups = await GroupRepository.findByTournamentId(params.tournamentId)
    const allStandings = await GroupRepository.computeAllGroupStandings(params.tournamentId)

    return successResponse({ groups, standings: allStandings })
  } catch (error) {
    console.error("Get groups error:", error)
    return errorResponse("Internal server error", 500)
  }
}
