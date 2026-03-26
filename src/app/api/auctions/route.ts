import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tournamentId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const tournamentId = searchParams.get("tournamentId") || undefined

    const auctions = await AuctionRepository.findAll({ status, tournamentId })
    return successResponse({ auctions })
  } catch (error) {
    console.error("List auctions error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const auction = await AuctionRepository.create({
      name: parsed.data.name,
      tournamentId: parsed.data.tournamentId,
      createdById: session.user.id,
    })

    return successResponse({ auction }, 201)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return errorResponse("This tournament already has an auction", 409)
    }
    console.error("Create auction error:", error)
    return errorResponse("Internal server error", 500)
  }
}
