import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { GroupRepository } from "@/lib/db/repositories/GroupRepository"
import { TeamMatchRepository } from "@/lib/db/repositories/TeamMatchRepository"
import { generateRoundRobinPairings } from "@/lib/tournament/roundRobin"
import { errorResponse, successResponse } from "@/lib/api/responses"

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

    const groups = await GroupRepository.findByTournamentId(params.tournamentId)
    if (groups.length === 0) {
      return errorResponse("No groups found. Generate groups first.", 400)
    }

    const createdMatches = []

    for (const group of groups) {
      const teamIds = group.groupTeams.map((gt) => gt.teamId)
      if (teamIds.length < 2) continue

      const pairings = generateRoundRobinPairings(teamIds)

      // Get team names for match naming
      const teamNameMap: Record<string, string> = {}
      for (const gt of group.groupTeams) {
        teamNameMap[gt.teamId] = gt.team.name
      }

      for (let i = 0; i < pairings.length; i++) {
        const [teamAId, teamBId] = pairings[i]
        const name = `${group.name}: ${teamNameMap[teamAId]} vs ${teamNameMap[teamBId]}`

        const teamMatch = await TeamMatchRepository.create({
          name,
          tournamentId: params.tournamentId,
          teamAId,
          teamBId,
          category: "ADULT",
          menDoublesCount: tournament.defaultMenDoubles ?? 0,
          womenDoublesCount: tournament.defaultWomenDoubles ?? 0,
          mixedDoublesCount: tournament.defaultMixedDoubles ?? 0,
          menSinglesCount: tournament.defaultMenSingles ?? 0,
          womenSinglesCount: tournament.defaultWomenSingles ?? 0,
          kidsSinglesCount: tournament.defaultKidsSingles ?? 0,
          kidsDoublesCount: tournament.defaultKidsDoubles ?? 0,
          setsCount: tournament.defaultSetsCount ?? 3,
          pointsToWin: tournament.defaultPointsToWin ?? 21,
          deuceCap: tournament.defaultDeuceCap ?? 30,
          groupId: group.id,
        })

        createdMatches.push(teamMatch)
      }
    }

    return successResponse({ teamMatches: createdMatches, count: createdMatches.length }, 201)
  } catch (error) {
    console.error("Generate league matches error:", error)
    return errorResponse("Internal server error", 500)
  }
}
