import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function GET(request: NextRequest, { params }: { params: { tournamentId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const tournament = await TournamentRepository.findByIdWithMatchesAndTeams(params.tournamentId)
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    return successResponse({ tournament })
  } catch (error) {
    console.error("Get tournament error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const tournament = await TournamentRepository.findById(params.tournamentId)
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    const body = await request.json()

    // Validate tournament start date if status is being changed to ONGOING
    if (body.status === "ONGOING" && tournament.status === "UPCOMING") {
      const today = new Date()
      const tournamentStart = new Date(tournament.dateFrom)
      today.setHours(0, 0, 0, 0)
      tournamentStart.setHours(0, 0, 0, 0)

      if (today < tournamentStart) {
        return errorResponse(
          `Cannot start tournament before scheduled date. Tournament starts on ${tournamentStart.toLocaleDateString()}.`,
          400
        )
      }
    }

    // Validate all matches are done when completing a tournament
    if (body.status === "COMPLETED" && tournament.status === "ONGOING") {
      const tournamentWithMatches = await TournamentRepository.findByIdWithMatches(params.tournamentId)
      const incompleteMatches = tournamentWithMatches?.matches?.filter(
        (m: any) => m.status !== "COMPLETED" && m.status !== "ABANDONED"
      ) || []

      if (incompleteMatches.length > 0) {
        return errorResponse(
          `Cannot finish tournament. ${incompleteMatches.length} match(es) are still incomplete (NOT_STARTED or IN_PROGRESS). Complete or abandon all matches first.`,
          400
        )
      }
    }

    // Convert date strings to Date objects if present
    if (body.dateFrom) {
      body.dateFrom = new Date(body.dateFrom)
    }
    if (body.dateTo) {
      body.dateTo = new Date(body.dateTo)
    }

    const updatedTournament = await TournamentRepository.update(params.tournamentId, body)

    return successResponse({ tournament: updatedTournament })
  } catch (error) {
    console.error("Update tournament error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const tournament = await TournamentRepository.findById(params.tournamentId)
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    await TournamentRepository.delete(params.tournamentId)

    return successResponse({ message: "Tournament deleted successfully" })
  } catch (error) {
    console.error("Delete tournament error:", error)
    return errorResponse("Internal server error", 500)
  }
}
