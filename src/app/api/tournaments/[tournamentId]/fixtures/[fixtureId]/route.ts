import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

const updateFixtureSchema = z.object({
  imageUrl: z.string().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tournamentId: string; fixtureId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const fixture = await prisma.fixture.findUnique({
      where: { id: params.fixtureId },
      include: { teamMatch: { select: { tournamentId: true } } },
    })

    if (!fixture || fixture.teamMatch.tournamentId !== params.tournamentId) {
      return errorResponse("Fixture not found", 404)
    }

    const body = await request.json()
    const validatedData = updateFixtureSchema.parse(body)

    const updated = await prisma.fixture.update({
      where: { id: params.fixtureId },
      data: {
        imageUrl: validatedData.imageUrl,
      },
    })

    return successResponse({ fixture: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Update fixture error:", error)
    return errorResponse("Internal server error", 500)
  }
}
