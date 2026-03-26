import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionPlayerRepository } from "@/lib/db/repositories/AuctionPlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { prisma } from "@/lib/db/client"

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sell"),
    soldPrice: z.number().positive("Price must be positive"),
    soldToTeamId: z.string().min(1, "Team is required"),
  }),
  z.object({ action: z.literal("unsold") }),
  z.object({ action: z.literal("reset") }),
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { auctionId: string; auctionPlayerId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const { action } = parsed.data

    if (action === "sell") {
      const { soldPrice, soldToTeamId } = parsed.data

      // Validate team has enough budget
      const team = await prisma.auctionTeam.findUnique({
        where: { id: soldToTeamId },
      })
      if (!team) {
        return errorResponse("Team not found", 404)
      }

      const remaining = team.budget - team.spent
      if (remaining < soldPrice) {
        return errorResponse(
          `Insufficient budget. Team has ${remaining} remaining but bid is ${soldPrice}`,
          400
        )
      }

      const player = await AuctionPlayerRepository.markSold(
        params.auctionPlayerId,
        { soldPrice, soldToTeamId }
      )

      return successResponse({ player })
    }

    if (action === "unsold") {
      const player = await AuctionPlayerRepository.markUnsold(params.auctionPlayerId)
      return successResponse({ player })
    }

    if (action === "reset") {
      const player = await AuctionPlayerRepository.resetToAvailable(params.auctionPlayerId)
      return successResponse({ player })
    }
  } catch (error: any) {
    if (error?.code === "P2025") {
      return errorResponse("Auction player not found", 404)
    }
    console.error("Update auction player error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { auctionId: string; auctionPlayerId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    await AuctionPlayerRepository.delete(params.auctionPlayerId)
    return successResponse({ message: "Player removed from auction" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return errorResponse("Auction player not found", 404)
    }
    console.error("Delete auction player error:", error)
    return errorResponse("Internal server error", 500)
  }
}
