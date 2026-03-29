import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { AuctionPlayerRepository } from "@/lib/db/repositories/AuctionPlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { prisma } from "@/lib/db/client"
import { getTournamentCaptainPlayerIds } from "@/lib/tournamentCaptainPlayers"

const addPlayersSchema = z.union([
  z.object({
    playerIds: z.array(z.string()).min(1),
    basePrice: z.number().min(0).default(0),
  }),
  z.object({
    fromTournament: z.literal(true),
    basePrice: z.number().min(0).default(0),
  }),
])

export async function GET(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined

    const auctionRow = await prisma.auction.findUnique({
      where: { id: params.auctionId },
      select: { tournamentId: true },
    })
    const excludePlayerIds =
      auctionRow?.tournamentId ?
        await getTournamentCaptainPlayerIds(auctionRow.tournamentId)
      : []

    const players = await AuctionPlayerRepository.findByAuctionId(params.auctionId, {
      status,
      search,
      excludePlayerIds,
    })
    const stats = await AuctionPlayerRepository.getStats(params.auctionId, excludePlayerIds)

    return successResponse({ players, stats })
  } catch (error) {
    console.error("List auction players error:", error)
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
    const parsed = addPlayersSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    let playerIds: string[]
    const basePrice = parsed.data.basePrice

    if ("fromTournament" in parsed.data) {
      if (!auction.tournamentId) {
        return errorResponse("Auction is not linked to a tournament", 400)
      }

      const tournamentPlayers = await prisma.tournamentPlayer.findMany({
        where: { tournamentId: auction.tournamentId },
        select: { playerId: true },
      })

      playerIds = tournamentPlayers.map((tp) => tp.playerId)
      if (playerIds.length === 0) {
        return errorResponse("No players found in tournament", 400)
      }
    } else {
      playerIds = parsed.data.playerIds
    }

    if (auction.tournamentId) {
      const captainIds = await getTournamentCaptainPlayerIds(auction.tournamentId)
      if (captainIds.length > 0) {
        const block = new Set(captainIds)
        playerIds = playerIds.filter((id) => !block.has(id))
      }
    }

    if (playerIds.length === 0) {
      return errorResponse("No players to add after excluding tournament captains", 400)
    }

    const players = await AuctionPlayerRepository.createMany(
      params.auctionId,
      playerIds.map((playerId) => ({ playerId, basePrice }))
    )

    return successResponse({ players }, 201)
  } catch (error) {
    console.error("Add auction players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
