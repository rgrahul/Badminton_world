import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { KnockoutRepository } from "@/lib/db/repositories/KnockoutRepository"
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

    const bracket = await KnockoutRepository.findByTournamentId(params.tournamentId)

    return successResponse({ bracket })
  } catch (error) {
    console.error("Get knockout bracket error:", error)
    return errorResponse("Internal server error", 500)
  }
}
