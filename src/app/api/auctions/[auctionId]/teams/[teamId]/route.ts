import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionTeamRepository } from "@/lib/db/repositories/AuctionTeamRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  budget: z.number().min(0).optional(),
  logoUrl: z.string().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { auctionId: string; teamId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const team = await AuctionTeamRepository.update(params.teamId, parsed.data)
    return successResponse({ team })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return errorResponse("Team not found", 404)
    }
    console.error("Update auction team error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { auctionId: string; teamId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    await AuctionTeamRepository.delete(params.teamId)
    return successResponse({ message: "Team deleted successfully" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return errorResponse("Team not found", 404)
    }
    console.error("Delete auction team error:", error)
    return errorResponse("Internal server error", 500)
  }
}
