import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { TeamRepository } from "@/lib/db/repositories/TeamRepository"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { derivePlayerCategory } from "@/lib/constants"

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  teamSize: z.number().int().min(0, "Team size cannot be negative"),
  requiredMale: z.number().int().min(0),
  requiredFemale: z.number().int().min(0),
  requiredKid: z.number().int().min(0),
  playerIds: z.array(z.string()),
  logoUrl: z.string().optional(),
  skipCompositionValidation: z.boolean().optional(),
  captainId: z.string().min(1).nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const tournament = await TournamentRepository.findById(params.tournamentId)
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    const teams = await TeamRepository.findByTournamentId(params.tournamentId)

    return successResponse({ teams })
  } catch (error) {
    console.error("Get teams error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const tournament = await TournamentRepository.findById(params.tournamentId)
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)

    const {
      requiredMale,
      requiredFemale,
      requiredKid,
      teamSize,
      playerIds,
      skipCompositionValidation,
      captainId: captainIdRaw,
    } = validatedData

    if (captainIdRaw) {
      if (!playerIds.includes(captainIdRaw)) {
        return errorResponse("Captain must be one of the players on this team", 400)
      }
    }

    // Check for duplicate player IDs
    const uniqueIds = new Set(playerIds)
    if (uniqueIds.size !== playerIds.length) {
      return errorResponse("Duplicate player IDs are not allowed", 400)
    }

    let playerAssignments: { playerId: string; category: string }[] = []

    if (playerIds.length > 0) {
      // Fetch all players and validate they exist
      const players = await Promise.all(
        playerIds.map((id) => PlayerRepository.findById(id))
      )

      const missingPlayers = playerIds.filter((id, i) => !players[i])
      if (missingPlayers.length > 0) {
        return errorResponse(
          `Players not found: ${missingPlayers.join(", ")}`,
          400
        )
      }

      // Derive categories
      playerAssignments = players.map((player) => ({
        playerId: player!.id,
        category: derivePlayerCategory(player!.age, player!.gender),
      }))
    }

    if (!skipCompositionValidation) {
      // Validate composition adds up
      if (requiredMale + requiredFemale + requiredKid !== teamSize) {
        return errorResponse(
          "Composition mismatch: required Male + Female + Kid must equal team size",
          400
        )
      }

      // Validate player count matches team size
      if (playerIds.length !== teamSize) {
        return errorResponse(
          `Player count (${playerIds.length}) must equal team size (${teamSize})`,
          400
        )
      }

      const maleCount = playerAssignments.filter((p) => p.category === "MALE").length
      const femaleCount = playerAssignments.filter((p) => p.category === "FEMALE").length
      const kidCount = playerAssignments.filter((p) => p.category === "KID").length

      if (maleCount !== requiredMale) {
        return errorResponse(
          `Male player count (${maleCount}) does not match required (${requiredMale})`,
          400
        )
      }
      if (femaleCount !== requiredFemale) {
        return errorResponse(
          `Female player count (${femaleCount}) does not match required (${requiredFemale})`,
          400
        )
      }
      if (kidCount !== requiredKid) {
        return errorResponse(
          `Kid player count (${kidCount}) does not match required (${requiredKid})`,
          400
        )
      }
    }

    const team = await TeamRepository.create({
      name: validatedData.name,
      tournamentId: params.tournamentId,
      teamSize,
      requiredMale,
      requiredFemale,
      requiredKid,
      players: playerAssignments,
      logoUrl: validatedData.logoUrl,
      captainId: captainIdRaw ?? null,
    })

    // Auto-register players to tournament pool (skip if already registered)
    if (playerIds.length > 0) {
      await prisma.tournamentPlayer.createMany({
        data: playerIds.map((playerId) => ({
          tournamentId: params.tournamentId,
          playerId,
        })),
        skipDuplicates: true,
      })
    }

    return successResponse({ team }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Create team error:", error)
    return errorResponse("Internal server error", 500)
  }
}
