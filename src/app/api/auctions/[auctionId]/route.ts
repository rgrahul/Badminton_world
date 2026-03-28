import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["SETUP", "LIVE", "PAUSED", "COMPLETED"]).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { auctionId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const auction = await AuctionRepository.findByIdFull(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    return successResponse({ auction })
  } catch (error) {
    console.error("Get auction error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { auctionId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    if (session.user.role !== "ADMIN") {
      return errorResponse("Only admins can update auctions", 403)
    }

    const auction = await AuctionRepository.findById(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const updated = await AuctionRepository.update(params.auctionId, parsed.data)
    return successResponse({ auction: updated })
  } catch (error) {
    console.error("Update auction error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { auctionId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    if (session.user.role !== "ADMIN") {
      return errorResponse("Only admins can delete auctions", 403)
    }

    const auction = await AuctionRepository.findById(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    await AuctionRepository.delete(params.auctionId)
    return successResponse({ message: "Auction deleted successfully" })
  } catch (error) {
    console.error("Delete auction error:", error)
    return errorResponse("Internal server error", 500)
  }
}
