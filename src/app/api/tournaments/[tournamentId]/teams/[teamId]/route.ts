import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { TeamRepository } from "@/lib/db/repositories/TeamRepository"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { derivePlayerCategory } from "@/lib/constants"

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  teamSize: z.number().int().positive().optional(),
  requiredMale: z.number().int().min(0).optional(),
  requiredFemale: z.number().int().min(0).optional(),
  requiredKid: z.number().int().min(0).optional(),
  playerIds: z.array(z.string()).optional(),
  logoUrl: z.string().nullable().optional(),
  captainId: z.string().min(1).nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string; teamId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const team = await TeamRepository.findByIdWithMatches(params.teamId)
    if (!team) {
      return errorResponse("Team not found", 404)
    }

    if (team.tournamentId !== params.tournamentId) {
      return errorResponse("Team not found in this tournament", 404)
    }

    // Merge teamMatchesAsA and teamMatchesAsB into a single sorted list
    const teamMatches = [...team.teamMatchesAsA, ...team.teamMatchesAsB].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return successResponse({ team: { ...team, teamMatches } })
  } catch (error) {
    console.error("Get team error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tournamentId: string; teamId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const existingTeam = await TeamRepository.findById(params.teamId)
    if (!existingTeam) {
      return errorResponse("Team not found", 404)
    }

    if (existingTeam.tournamentId !== params.tournamentId) {
      return errorResponse("Team not found in this tournament", 404)
    }

    const body = await request.json()
    const validatedData = updateTeamSchema.parse(body)

    const hasPlayerUpdate = validatedData.playerIds !== undefined

    if (hasPlayerUpdate) {
      // Full update with players
      const teamSize = validatedData.teamSize ?? existingTeam.teamSize
      const requiredMale = validatedData.requiredMale ?? existingTeam.requiredMale
      const requiredFemale = validatedData.requiredFemale ?? existingTeam.requiredFemale
      const requiredKid = validatedData.requiredKid ?? existingTeam.requiredKid
      const playerIds = validatedData.playerIds!

      if (requiredMale + requiredFemale + requiredKid !== teamSize) {
        return errorResponse(
          "Composition mismatch: required Male + Female + Kid must equal team size",
          400
        )
      }

      if (playerIds.length !== teamSize) {
        return errorResponse(
          `Player count (${playerIds.length}) must equal team size (${teamSize})`,
          400
        )
      }

      const uniqueIds = new Set(playerIds)
      if (uniqueIds.size !== playerIds.length) {
        return errorResponse("Duplicate player IDs are not allowed", 400)
      }

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

      const playerAssignments = players.map((player) => ({
        playerId: player!.id,
        category: derivePlayerCategory(player!.age, player!.gender),
      }))

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

      let resolvedCaptain: string | null
      if (validatedData.captainId !== undefined) {
        resolvedCaptain = validatedData.captainId
      } else {
        const prev = existingTeam.captainId
        resolvedCaptain = prev && playerIds.includes(prev) ? prev : null
      }
      if (resolvedCaptain) {
        if (playerIds.length > 0 && !playerIds.includes(resolvedCaptain)) {
          return errorResponse("Captain must be on the team roster", 400)
        }
        if (playerIds.length === 0) {
          const cap = await PlayerRepository.findById(resolvedCaptain)
          if (!cap) {
            return errorResponse("Captain player not found", 400)
          }
        }
      }

      const team = await TeamRepository.updateWithPlayers(params.teamId, {
        name: validatedData.name,
        teamSize,
        requiredMale,
        requiredFemale,
        requiredKid,
        logoUrl: validatedData.logoUrl,
        captainId: resolvedCaptain,
        players: playerAssignments,
      })

      // Auto-register players to tournament pool (skip if already registered)
      await prisma.tournamentPlayer.createMany({
        data: playerIds.map((playerId) => ({
          tournamentId: params.tournamentId,
          playerId,
        })),
        skipDuplicates: true,
      })

      return successResponse({ team })
    } else {
      // Metadata-only update (name, composition, captain)
      const updateData: Record<string, unknown> = {}
      if (validatedData.name !== undefined) updateData.name = validatedData.name
      if (validatedData.teamSize !== undefined) updateData.teamSize = validatedData.teamSize
      if (validatedData.requiredMale !== undefined) updateData.requiredMale = validatedData.requiredMale
      if (validatedData.requiredFemale !== undefined) updateData.requiredFemale = validatedData.requiredFemale
      if (validatedData.requiredKid !== undefined) updateData.requiredKid = validatedData.requiredKid
      if (validatedData.logoUrl !== undefined) updateData.logoUrl = validatedData.logoUrl

      if (validatedData.captainId !== undefined) {
        if (validatedData.captainId !== null) {
          const rosterCount = await prisma.teamPlayer.count({
            where: { teamId: params.teamId },
          })
          const onTeam = await prisma.teamPlayer.findFirst({
            where: { teamId: params.teamId, playerId: validatedData.captainId },
          })
          if (rosterCount > 0 && !onTeam) {
            return errorResponse("Captain must be a player on this team", 400)
          }
          if (rosterCount === 0) {
            const cap = await PlayerRepository.findById(validatedData.captainId)
            if (!cap) {
              return errorResponse("Captain player not found", 400)
            }
          }
        }
        updateData.captainId = validatedData.captainId
      }

      const team = await TeamRepository.update(params.teamId, updateData as import("@/lib/db/repositories/TeamRepository").UpdateTeamInput)
      return successResponse({ team })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Update team error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tournamentId: string; teamId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const team = await TeamRepository.findById(params.teamId)
    if (!team) {
      return errorResponse("Team not found", 404)
    }

    if (team.tournamentId !== params.tournamentId) {
      return errorResponse("Team not found in this tournament", 404)
    }

    await TeamRepository.delete(params.teamId)

    return successResponse({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Delete team error:", error)
    return errorResponse("Internal server error", 500)
  }
}
