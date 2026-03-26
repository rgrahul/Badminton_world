import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { GroupRepository } from "@/lib/db/repositories/GroupRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"

const generateSchema = z.object({
  numberOfGroups: z.number().int().min(2).max(26),
})

export async function POST(
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
    const { numberOfGroups } = generateSchema.parse(body)

    const groups = await GroupRepository.createGroups(params.tournamentId, numberOfGroups)

    return successResponse({ groups }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }
    console.error("Generate groups error:", error)
    return errorResponse("Internal server error", 500)
  }
}
