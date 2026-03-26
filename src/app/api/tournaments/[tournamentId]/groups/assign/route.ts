import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { GroupRepository } from "@/lib/db/repositories/GroupRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"

const assignSchema = z.object({
  assignments: z.array(
    z.object({
      teamId: z.string(),
      groupId: z.string(),
    })
  ),
})

export async function PUT(
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
    const { assignments } = assignSchema.parse(body)

    const groups = await GroupRepository.assignTeamsToGroups(
      params.tournamentId,
      assignments
    )

    return successResponse({ groups })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }
    console.error("Assign groups error:", error)
    return errorResponse("Internal server error", 500)
  }
}
