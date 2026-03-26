import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { TeamMatchRepository } from "@/lib/db/repositories/TeamMatchRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import {
  validateFixtureAssignment,
  isDoublesFixture,
} from "@/lib/validation/teamMatchValidation"

const assignPlayersSchema = z.object({
  teamAPlayer1Id: z.string().min(1),
  teamAPlayer2Id: z.string().nullable().optional(),
  teamBPlayer1Id: z.string().min(1),
  teamBPlayer2Id: z.string().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      tournamentId: string
      teamMatchId: string
      fixtureId: string
    }
  }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const fixture = await TeamMatchRepository.getFixture(params.fixtureId)
    if (!fixture || fixture.teamMatchId !== params.teamMatchId) {
      return errorResponse("Fixture not found", 404)
    }

    if (fixture.matchId) {
      return errorResponse(
        "Fixture already has a match created. Cannot reassign players.",
        400
      )
    }

    const body = await request.json()
    const validatedData = assignPlayersSchema.parse(body)

    const doubles = isDoublesFixture(fixture.fixtureType)

    // Build existing assignments for duplicate checking
    const existingAssignments = fixture.teamMatch.fixtures.map((f) => ({
      fixtureId: f.id,
      teamAPlayer1Id: f.teamAPlayer1Id,
      teamAPlayer2Id: f.teamAPlayer2Id,
      teamBPlayer1Id: f.teamBPlayer1Id,
      teamBPlayer2Id: f.teamBPlayer2Id,
    }))

    // Get team match category and genderRestriction for gender validation
    const teamMatch = await TeamMatchRepository.findById(params.teamMatchId)

    const validation = validateFixtureAssignment(
      fixture.fixtureType,
      validatedData.teamAPlayer1Id,
      doubles ? (validatedData.teamAPlayer2Id ?? null) : null,
      validatedData.teamBPlayer1Id,
      doubles ? (validatedData.teamBPlayer2Id ?? null) : null,
      fixture.teamMatch.teamA.players,
      fixture.teamMatch.teamB.players,
      existingAssignments,
      params.fixtureId,
      teamMatch?.category as "ADULT" | "KIDS" | undefined,
      teamMatch?.genderRestriction,
      teamMatch?.allowPlayerReuse
    )

    if (!validation.valid) {
      return errorResponse(validation.errors.join(", "), 400)
    }

    // Assign players
    const updatedFixture = await TeamMatchRepository.assignFixturePlayers(
      params.fixtureId,
      {
        teamAPlayer1Id: validatedData.teamAPlayer1Id,
        teamAPlayer2Id: doubles ? (validatedData.teamAPlayer2Id ?? null) : null,
        teamBPlayer1Id: validatedData.teamBPlayer1Id,
        teamBPlayer2Id: doubles ? (validatedData.teamBPlayer2Id ?? null) : null,
      }
    )

    // Auto-create Match record since players are now assigned
    const teamAP1 = fixture.teamMatch.teamA.players.find(
      (p) => p.playerId === validatedData.teamAPlayer1Id
    )
    const teamBP1 = fixture.teamMatch.teamB.players.find(
      (p) => p.playerId === validatedData.teamBPlayer1Id
    )
    const teamAP2 = doubles
      ? fixture.teamMatch.teamA.players.find(
          (p) => p.playerId === validatedData.teamAPlayer2Id
        )
      : null
    const teamBP2 = doubles
      ? fixture.teamMatch.teamB.players.find(
          (p) => p.playerId === validatedData.teamBPlayer2Id
        )
      : null

    const fixtureTypeLabel: Record<string, string> = {
      MEN_DOUBLES: "Men's Doubles",
      WOMEN_DOUBLES: "Women's Doubles",
      MIXED_DOUBLES: "Mixed Doubles",
      MEN_SINGLES: "Men's Singles",
      WOMEN_SINGLES: "Women's Singles",
      KIDS_SINGLES: "Kids Singles",
      KIDS_DOUBLES: "Kids Doubles",
    }
    const typeLabel = fixtureTypeLabel[fixture.fixtureType] || fixture.fixtureType

    const matchName = `${fixture.teamMatch.teamA.name} vs ${fixture.teamMatch.teamB.name} - ${typeLabel} #${fixture.fixtureNumber}`

    const match = await TeamMatchRepository.createFixtureMatch(
      params.fixtureId,
      {
        name: matchName,
        type: doubles ? "DOUBLES" : "SINGLES",
        sideAPlayer1: teamAP1?.player.name ?? "Unknown",
        sideAPlayer2: teamAP2?.player.name,
        sideBPlayer1: teamBP1?.player.name ?? "Unknown",
        sideBPlayer2: teamBP2?.player.name,
        tournamentId: params.tournamentId,
        setsCount: teamMatch?.setsCount,
        pointsToWin: teamMatch?.pointsToWin,
        deuceCap: teamMatch?.deuceCap,
      }
    )

    return successResponse({
      fixture: updatedFixture,
      match,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Assign fixture players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
