import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { AuctionTeamRepository } from "@/lib/db/repositories/AuctionTeamRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

const createSchema = z.object({
  teams: z.array(
    z.object({
      name: z.string().min(1, "Team name is required"),
      budget: z.number().min(0, "Budget must be non-negative"),
      logoUrl: z.string().optional(),
    })
  ).min(1, "At least one team is required"),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const auction = await AuctionRepository.findById(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    const teams = await AuctionTeamRepository.findByAuctionId(params.auctionId)
    return successResponse({ teams })
  } catch (error) {
    console.error("List auction teams error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const auction = await AuctionRepository.findById(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const teams = await AuctionTeamRepository.createMany(
      params.auctionId,
      parsed.data.teams
    )

    return successResponse({ teams }, 201)
  } catch (error) {
    console.error("Create auction teams error:", error)
    return errorResponse("Internal server error", 500)
  }
}
