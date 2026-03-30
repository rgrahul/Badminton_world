import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { AuctionPlayerRepository } from "@/lib/db/repositories/AuctionPlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { prisma } from "@/lib/db/client"
import { getTournamentCaptainPlayerIds } from "@/lib/tournamentCaptainPlayers"
import type { SkillCategory } from "@prisma/client"

const basePriceBySkillCategorySchema = z.object({
  BEGINNER: z.number().min(0),
  INTERMEDIATE: z.number().min(0),
  INTERMEDIATE_PLUS: z.number().min(0),
  ADVANCED: z.number().min(0),
})

const addPlayersSchema = z.union([
  z.object({
    playerIds: z.array(z.string()).min(1),
    basePrice: z.number().min(0).default(0),
  }),
  z.object({
    fromTournament: z.literal(true),
    /** Used when player has no skillCategory, or when basePriceBySkillCategory is omitted (flat price for all). */
    basePrice: z.number().min(0).default(0),
    basePriceBySkillCategory: basePriceBySkillCategorySchema.optional(),
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

    let rowsForCreate: { playerId: string; basePrice: number }[]

    if ("fromTournament" in parsed.data) {
      if (!auction.tournamentId) {
        return errorResponse("Auction is not linked to a tournament", 400)
      }

      const basePrice = parsed.data.basePrice
      const byCat = parsed.data.basePriceBySkillCategory

      const tournamentPlayers = await prisma.tournamentPlayer.findMany({
        where: { tournamentId: auction.tournamentId },
        select: {
          playerId: true,
          player: { select: { skillCategory: true } },
        },
      })

      if (tournamentPlayers.length === 0) {
        return errorResponse("No players found in tournament", 400)
      }

      const resolvePrice = (category: SkillCategory | null): number => {
        if (byCat && category && category in byCat) {
          return byCat[category as keyof typeof byCat]
        }
        return basePrice
      }

      rowsForCreate = tournamentPlayers.map((tp) => ({
        playerId: tp.playerId,
        basePrice: resolvePrice(tp.player.skillCategory),
      }))
    } else {
      const basePrice = parsed.data.basePrice
      const playerIds = parsed.data.playerIds
      rowsForCreate = playerIds.map((playerId) => ({ playerId, basePrice }))
    }

    if (auction.tournamentId) {
      const captainIds = await getTournamentCaptainPlayerIds(auction.tournamentId)
      if (captainIds.length > 0) {
        const block = new Set(captainIds)
        rowsForCreate = rowsForCreate.filter((r) => !block.has(r.playerId))
      }
    }

    if (rowsForCreate.length === 0) {
      return errorResponse("No players to add after excluding tournament captains", 400)
    }

    const players = await AuctionPlayerRepository.createMany(params.auctionId, rowsForCreate)

    return successResponse({ players }, 201)
  } catch (error) {
    console.error("Add auction players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
