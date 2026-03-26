import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { TeamRepository } from "@/lib/db/repositories/TeamRepository"
import { TeamMatchRepository } from "@/lib/db/repositories/TeamMatchRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import {
  validateTeamEligibility,
  type TeamMatchFormat,
} from "@/lib/validation/teamMatchValidation"

const createTeamMatchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  teamAId: z.string().min(1, "Team A is required"),
  teamBId: z.string().min(1, "Team B is required"),
  category: z.enum(["ADULT", "KIDS"]),
  genderRestriction: z.boolean().optional(),
  menDoublesCount: z.number().int().min(0).default(0),
  womenDoublesCount: z.number().int().min(0).default(0),
  mixedDoublesCount: z.number().int().min(0).default(0),
  menSinglesCount: z.number().int().min(0).default(0),
  womenSinglesCount: z.number().int().min(0).default(0),
  kidsSinglesCount: z.number().int().min(0).default(0),
  kidsDoublesCount: z.number().int().min(0).default(0),
  setsCount: z.number().int().min(1).max(5).default(3),
  pointsToWin: z.number().int().min(1).max(30).default(21),
  deuceCap: z.number().int().min(1).max(50).default(30),
  allowPlayerReuse: z.boolean().default(false),
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

    const teamMatches = await TeamMatchRepository.findByTournamentId(
      params.tournamentId
    )

    return successResponse({ teamMatches })
  } catch (error) {
    console.error("Get team matches error:", error)
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
    const validatedData = createTeamMatchSchema.parse(body)

    // Teams must be different
    if (validatedData.teamAId === validatedData.teamBId) {
      return errorResponse("Team A and Team B must be different teams", 400)
    }

    // Verify both teams exist and belong to tournament
    const [teamA, teamB] = await Promise.all([
      TeamRepository.findById(validatedData.teamAId),
      TeamRepository.findById(validatedData.teamBId),
    ])

    if (!teamA || teamA.tournament.id !== params.tournamentId) {
      return errorResponse("Team A not found in this tournament", 404)
    }
    if (!teamB || teamB.tournament.id !== params.tournamentId) {
      return errorResponse("Team B not found in this tournament", 404)
    }

    const format: TeamMatchFormat = {
      menDoublesCount: validatedData.menDoublesCount,
      womenDoublesCount: validatedData.womenDoublesCount,
      mixedDoublesCount: validatedData.mixedDoublesCount,
      menSinglesCount: validatedData.menSinglesCount,
      womenSinglesCount: validatedData.womenSinglesCount,
      kidsSinglesCount: validatedData.kidsSinglesCount,
      kidsDoublesCount: validatedData.kidsDoublesCount,
    }

    // At least one fixture required
    const totalFixtures = Object.values(format).reduce((sum, v) => sum + v, 0)
    if (totalFixtures === 0) {
      return errorResponse("At least one fixture type must have count > 0", 400)
    }

    // Category-specific validation
    if (validatedData.category === "ADULT") {
      if (format.kidsSinglesCount > 0 || format.kidsDoublesCount > 0) {
        return errorResponse(
          "Adult category cannot have kids fixture types",
          400
        )
      }
    }

    if (
      validatedData.category === "KIDS" &&
      !validatedData.genderRestriction
    ) {
      if (
        format.menDoublesCount > 0 ||
        format.womenDoublesCount > 0 ||
        format.mixedDoublesCount > 0 ||
        format.menSinglesCount > 0 ||
        format.womenSinglesCount > 0
      ) {
        return errorResponse(
          "Kids category without gender restriction can only have kids fixture types",
          400
        )
      }
    }

    // Validate team eligibility
    const teamAEligibility = validateTeamEligibility(
      teamA.players,
      format,
      validatedData.category,
      validatedData.genderRestriction,
      validatedData.allowPlayerReuse
    )
    if (!teamAEligibility.valid) {
      return errorResponse(
        `Team A (${teamA.name}): ${teamAEligibility.errors.join(", ")}`,
        400
      )
    }

    const teamBEligibility = validateTeamEligibility(
      teamB.players,
      format,
      validatedData.category,
      validatedData.genderRestriction,
      validatedData.allowPlayerReuse
    )
    if (!teamBEligibility.valid) {
      return errorResponse(
        `Team B (${teamB.name}): ${teamBEligibility.errors.join(", ")}`,
        400
      )
    }

    const teamMatch = await TeamMatchRepository.create({
      name: validatedData.name,
      tournamentId: params.tournamentId,
      teamAId: validatedData.teamAId,
      teamBId: validatedData.teamBId,
      category: validatedData.category,
      genderRestriction: validatedData.genderRestriction,
      ...format,
      setsCount: validatedData.setsCount,
      pointsToWin: validatedData.pointsToWin,
      deuceCap: validatedData.deuceCap,
      allowPlayerReuse: validatedData.allowPlayerReuse,
    })

    return successResponse({ teamMatch }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Create team match error:", error)
    return errorResponse("Internal server error", 500)
  }
}
