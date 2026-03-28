import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { AuctionRepository } from "@/lib/db/repositories/AuctionRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { prisma } from "@/lib/db/client"

const importSchema = z.object({
  players: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email().optional().nullable(),
        mobileNumber: z.string().optional().nullable(),
        age: z.number().int().optional().nullable(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
        yearsOfExperience: z.number().int().optional().nullable(),
        skillRating: z.number().int().optional().nullable(),
        profilePhoto: z.string().optional().nullable(),
        basePrice: z.number().min(0).default(0),
      })
    )
    .min(1, "At least one player is required"),
})

export async function POST(request: NextRequest, { params }: { params: { auctionId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    if (session.user.role !== "ADMIN") {
      return errorResponse("Only admins can import auction players", 403)
    }

    const auction = await AuctionRepository.findById(params.auctionId)
    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    const body = await request.json()
    const parsed = importSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdPlayers: { playerId: string; basePrice: number }[] = []

      for (const row of parsed.data.players) {
        // Try to find existing player: match by (name + email), (name + mobile), or name-only
        let existingPlayer = null

        if (row.email) {
          existingPlayer = await tx.player.findFirst({
            where: {
              name: { equals: row.name, mode: "insensitive" },
              email: row.email,
            },
          })
        }

        if (!existingPlayer && row.mobileNumber) {
          existingPlayer = await tx.player.findFirst({
            where: {
              name: { equals: row.name, mode: "insensitive" },
              mobileNumber: row.mobileNumber,
            },
          })
        }

        if (!existingPlayer) {
          existingPlayer = await tx.player.findFirst({
            where: { name: { equals: row.name, mode: "insensitive" } },
          })
        }

        let player
        if (existingPlayer) {
          // Update existing player with any new data
          player = await tx.player.update({
            where: { id: existingPlayer.id },
            data: {
              email: row.email || existingPlayer.email,
              mobileNumber: row.mobileNumber || existingPlayer.mobileNumber,
              age: row.age ?? existingPlayer.age,
              gender: row.gender || existingPlayer.gender,
              yearsOfExperience: row.yearsOfExperience ?? existingPlayer.yearsOfExperience,
              skillRating: row.skillRating ?? existingPlayer.skillRating,
              profilePhoto: row.profilePhoto || existingPlayer.profilePhoto,
            },
          })
        } else {
          // Create new global Player record
          player = await tx.player.create({
            data: {
              name: row.name,
              email: row.email || undefined,
              mobileNumber: row.mobileNumber || undefined,
              age: row.age || undefined,
              gender: row.gender || undefined,
              yearsOfExperience: row.yearsOfExperience || undefined,
              skillRating: row.skillRating || undefined,
              profilePhoto: row.profilePhoto || undefined,
            },
          })
        }

        // If auction is linked to a tournament, also create TournamentPlayer
        if (auction.tournamentId) {
          await tx.tournamentPlayer.createMany({
            data: [{ tournamentId: auction.tournamentId, playerId: player.id }],
            skipDuplicates: true,
          })
        }

        createdPlayers.push({
          playerId: player.id,
          basePrice: row.basePrice,
        })
      }

      // Create AuctionPlayer records
      await tx.auctionPlayer.createMany({
        data: createdPlayers.map((p, i) => ({
          auctionId: params.auctionId,
          playerId: p.playerId,
          basePrice: p.basePrice,
          sortOrder: i,
        })),
        skipDuplicates: true,
      })

      return { count: createdPlayers.length }
    })

    return successResponse(
      {
        message: `Imported ${result.count} players`,
        count: result.count,
      },
      201
    )
  } catch (error) {
    console.error("Import auction players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
