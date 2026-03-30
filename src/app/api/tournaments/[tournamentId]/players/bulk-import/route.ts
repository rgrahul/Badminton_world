import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { optionalImportedSkillCategorySchema } from "@/lib/skillCategory"
import { optionalExperienceSchema } from "@/lib/playerExperience"
import { optionalLastPlayedSchema } from "@/lib/playerLastPlayed"
import { optionalKeyStrengthSchema } from "@/lib/playerKeyStrength"

const playerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  experience: optionalExperienceSchema,
  lastPlayed: optionalLastPlayedSchema,
  keyStrength: optionalKeyStrengthSchema,
  skillCategory: optionalImportedSkillCategorySchema,
  profilePhoto: z.string().optional().nullable(),
})

const bulkImportSchema = z.object({
  players: z.array(playerSchema).min(1, "At least one player is required"),
})

export async function POST(request: NextRequest, { params }: { params: { tournamentId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    if (session.user.role !== "ADMIN") {
      return errorResponse("Only admins can perform bulk imports", 403)
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: params.tournamentId },
    })
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    const body = await request.json()
    const rawPlayers = (body.players as Record<string, unknown>[]).map((row) => ({
      ...row,
      skillCategory: row.skillCategory ?? row.skillRating,
      experience:
        row.experience ??
        row.Experience ??
        row.yearsOfExperience ??
        row.YearsOfExperience,
      lastPlayed: row.lastPlayed ?? row.LastPlayed ?? row.last_played,
      keyStrength: row.keyStrength ?? row.KeyStrength ?? row.key_strength,
    }))
    const { players } = bulkImportSchema.parse({ players: rawPlayers })

    let added = 0
    let reused = 0
    let created = 0

    for (const playerData of players) {
      // Try to find existing player: match by (name + email), (name + mobile), or name-only
      let existingPlayer = null

      if (playerData.email) {
        existingPlayer = await prisma.player.findFirst({
          where: {
            name: { equals: playerData.name, mode: "insensitive" },
            email: playerData.email,
          },
        })
      }

      if (!existingPlayer && playerData.mobileNumber) {
        existingPlayer = await prisma.player.findFirst({
          where: {
            name: { equals: playerData.name, mode: "insensitive" },
            mobileNumber: playerData.mobileNumber,
          },
        })
      }

      if (!existingPlayer) {
        existingPlayer = await prisma.player.findFirst({
          where: { name: { equals: playerData.name, mode: "insensitive" } },
        })
      }

      let player
      if (existingPlayer) {
        player = existingPlayer
        reused++
      } else {
        player = await prisma.player.create({
          data: {
            name: playerData.name,
            email: playerData.email || null,
            mobileNumber: playerData.mobileNumber || null,
            age: playerData.age || null,
            gender: playerData.gender || null,
            experience: playerData.experience ?? null,
            lastPlayed: playerData.lastPlayed ?? null,
            keyStrength: playerData.keyStrength ?? null,
            skillCategory: playerData.skillCategory ?? null,
            profilePhoto: playerData.profilePhoto || null,
          },
        })
        created++
      }

      // Add to tournament (skip if already registered)
      try {
        await prisma.tournamentPlayer.create({
          data: {
            tournamentId: params.tournamentId,
            playerId: player.id,
          },
        })
        added++
      } catch (e: any) {
        if (e.code !== "P2002") throw e
        // Already in tournament — still count as processed
      }
    }

    return successResponse(
      {
        message: `Processed ${players.length} players: ${created} new, ${reused} existing, ${added} added to tournament`,
        total: players.length,
        created,
        reused,
        added,
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Bulk import tournament players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
