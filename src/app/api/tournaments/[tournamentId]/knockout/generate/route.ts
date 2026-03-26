import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { GroupRepository } from "@/lib/db/repositories/GroupRepository"
import { KnockoutRepository } from "@/lib/db/repositories/KnockoutRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"
import type { GroupStanding } from "@/lib/tournament/bracket"

const generateSchema = z.object({
  seedFromGroups: z.boolean().optional().default(false),
  teamIds: z.array(z.string()).optional(),
})

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
    const { seedFromGroups, teamIds } = generateSchema.parse(body)

    if (seedFromGroups) {
      // Seed from group standings
      const allStandings = await GroupRepository.computeAllGroupStandings(params.tournamentId)
      const qualifyPerGroup = tournament.qualifyPerGroup ?? 2

      const totalQualifiers = allStandings.reduce(
        (sum, g) => sum + Math.min(g.standings.length, qualifyPerGroup),
        0
      )

      if (totalQualifiers < 2) {
        return errorResponse("Not enough qualifiers to generate a bracket", 400)
      }

      // Generate bracket skeleton
      await KnockoutRepository.generateBracket(params.tournamentId, totalQualifiers)

      // Convert standings to GroupStanding format for seeding
      const groupStandings: GroupStanding[][] = allStandings.map((g, groupIndex) =>
        g.standings.slice(0, qualifyPerGroup).map((s, i) => ({
          teamId: s.teamId,
          teamName: s.teamName,
          groupIndex,
          position: i + 1,
        }))
      )

      const bracket = await KnockoutRepository.seedFromGroups(
        params.tournamentId,
        groupStandings,
        qualifyPerGroup
      )

      // Auto-create team matches for first round where both teams are known
      for (const km of bracket) {
        if (km.teamAId && km.teamBId && !km.teamMatchId) {
          await KnockoutRepository.createTeamMatchForKnockout(km.id, tournament)
        }
      }

      // Fetch updated bracket
      const finalBracket = await KnockoutRepository.findByTournamentId(params.tournamentId)
      return successResponse({ bracket: finalBracket }, 201)
    } else if (teamIds && teamIds.length >= 2) {
      // Direct knockout with provided team IDs
      await KnockoutRepository.generateBracket(params.tournamentId, teamIds.length)

      // Seed teams in order
      const seedings = teamIds.map((teamId, i) => ({
        matchNumber: Math.floor(i / 2) + 1,
        slot: (i % 2 === 0 ? "A" : "B") as "A" | "B",
        teamId,
      }))

      const bracket = await KnockoutRepository.seedTeams(params.tournamentId, seedings)

      // Auto-create team matches for first round
      for (const km of bracket) {
        if (km.teamAId && km.teamBId && !km.teamMatchId) {
          await KnockoutRepository.createTeamMatchForKnockout(km.id, tournament)
        }
      }

      const finalBracket = await KnockoutRepository.findByTournamentId(params.tournamentId)
      return successResponse({ bracket: finalBracket }, 201)
    } else {
      return errorResponse("Provide either seedFromGroups or teamIds", 400)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }
    console.error("Generate knockout bracket error:", error)
    return errorResponse("Internal server error", 500)
  }
}
