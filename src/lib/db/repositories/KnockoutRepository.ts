import { prisma } from "../client"
import {
  generateBracketStructure,
  getRounds,
  bracketSize,
  type Seeding,
  type GroupStanding,
  crossGroupSeeding,
} from "@/lib/tournament/bracket"

type KnockoutRoundType =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL"

const knockoutMatchInclude = {
  teamA: { select: { id: true, name: true } },
  teamB: { select: { id: true, name: true } },
  winnerTeam: { select: { id: true, name: true } },
  teamMatch: {
    select: {
      id: true,
      name: true,
      status: true,
      fixturesWonByTeamA: true,
      fixturesWonByTeamB: true,
      winningTeamId: true,
    },
  },
}

export class KnockoutRepository {
  /**
   * Generate the bracket skeleton for a tournament.
   */
  static async generateBracket(tournamentId: string, teamCount: number) {
    const slots = generateBracketStructure(teamCount)
    const rounds = getRounds(teamCount)
    const firstRound = rounds[0]

    return prisma.$transaction(async (tx) => {
      // Delete existing knockout matches
      await tx.knockoutMatch.deleteMany({ where: { tournamentId } })

      // Create all bracket slots
      // First, create first-round matches (no source matches)
      const firstRoundSlots = slots.filter((s) => s.round === firstRound)
      const laterSlots = slots.filter((s) => s.round !== firstRound)

      // Create first round matches
      const firstRoundMatches = []
      for (const slot of firstRoundSlots) {
        const km = await tx.knockoutMatch.create({
          data: {
            tournamentId,
            round: slot.round,
            matchNumber: slot.matchNumber,
          },
        })
        firstRoundMatches.push(km)
      }

      // Create subsequent rounds, linking to source matches
      let prevRoundMatches = firstRoundMatches
      for (let r = 1; r < rounds.length; r++) {
        const round = rounds[r]
        const roundSlots = laterSlots.filter((s) => s.round === round)
        const currentRoundMatches = []

        for (const slot of roundSlots) {
          const sourceA = prevRoundMatches.find(
            (m) => m.matchNumber === slot.teamASourceMatchNumber
          )
          const sourceB = prevRoundMatches.find(
            (m) => m.matchNumber === slot.teamBSourceMatchNumber
          )

          const km = await tx.knockoutMatch.create({
            data: {
              tournamentId,
              round: slot.round,
              matchNumber: slot.matchNumber,
              teamASourceMatchId: sourceA?.id,
              teamBSourceMatchId: sourceB?.id,
              teamASourceLabel: slot.teamASourceLabel,
              teamBSourceLabel: slot.teamBSourceLabel,
            },
          })
          currentRoundMatches.push(km)
        }

        prevRoundMatches = currentRoundMatches
      }

      return tx.knockoutMatch.findMany({
        where: { tournamentId },
        include: knockoutMatchInclude,
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      })
    })
  }

  /**
   * Seed teams into first-round bracket slots.
   */
  static async seedTeams(tournamentId: string, seedings: Seeding[]) {
    return prisma.$transaction(async (tx) => {
      const rounds = await tx.knockoutMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      })

      if (rounds.length === 0) return []

      const firstRound = rounds[0].round

      for (const seed of seedings) {
        const match = rounds.find(
          (m) => m.round === firstRound && m.matchNumber === seed.matchNumber
        )
        if (!match) continue

        const updateData: Record<string, string | null> = {}
        if (seed.slot === "A") {
          updateData.teamAId = seed.teamId
          if (seed.label) updateData.teamASourceLabel = seed.label
        } else {
          updateData.teamBId = seed.teamId
          if (seed.label) updateData.teamBSourceLabel = seed.label
        }

        await tx.knockoutMatch.update({
          where: { id: match.id },
          data: updateData,
        })
      }

      return tx.knockoutMatch.findMany({
        where: { tournamentId },
        include: knockoutMatchInclude,
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      })
    })
  }

  /**
   * Auto-seed from group standings using cross-group pattern.
   */
  static async seedFromGroups(
    tournamentId: string,
    groupStandings: GroupStanding[][],
    qualifyPerGroup: number
  ) {
    const seedings = crossGroupSeeding(groupStandings, qualifyPerGroup)
    return this.seedTeams(tournamentId, seedings)
  }

  /**
   * Fetch the full bracket for a tournament.
   */
  static async findByTournamentId(tournamentId: string) {
    return prisma.knockoutMatch.findMany({
      where: { tournamentId },
      include: knockoutMatchInclude,
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    })
  }

  /**
   * Create a TeamMatch for a knockout match slot, using tournament defaults.
   */
  static async createTeamMatchForKnockout(
    knockoutMatchId: string,
    tournament: {
      id: string
      defaultMenDoubles?: number | null
      defaultWomenDoubles?: number | null
      defaultMixedDoubles?: number | null
      defaultMenSingles?: number | null
      defaultWomenSingles?: number | null
      defaultKidsSingles?: number | null
      defaultKidsDoubles?: number | null
      defaultSetsCount?: number | null
      defaultPointsToWin?: number | null
      defaultDeuceCap?: number | null
    }
  ) {
    const km = await prisma.knockoutMatch.findUnique({
      where: { id: knockoutMatchId },
      include: {
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
      },
    })

    if (!km || !km.teamAId || !km.teamBId) return null

    const roundLabel = formatRoundLabel(km.round)
    const name = `${roundLabel} M${km.matchNumber}: ${km.teamA?.name} vs ${km.teamB?.name}`

    return prisma.$transaction(async (tx) => {
      // Create the team match with fixtures
      const teamMatch = await tx.teamMatch.create({
        data: {
          name,
          tournamentId: tournament.id,
          teamAId: km.teamAId!,
          teamBId: km.teamBId!,
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
        },
      })

      // Auto-generate fixtures
      const FORMAT_TO_FIXTURE_TYPE: Record<string, string> = {
        menDoublesCount: "MEN_DOUBLES",
        womenDoublesCount: "WOMEN_DOUBLES",
        mixedDoublesCount: "MIXED_DOUBLES",
        menSinglesCount: "MEN_SINGLES",
        womenSinglesCount: "WOMEN_SINGLES",
        kidsSinglesCount: "KIDS_SINGLES",
        kidsDoublesCount: "KIDS_DOUBLES",
      }

      let fixtureNumber = 1
      const fixtureCreates: { teamMatchId: string; fixtureNumber: number; fixtureType: any }[] = []

      for (const [field, fixtureType] of Object.entries(FORMAT_TO_FIXTURE_TYPE)) {
        const key = `default${field.charAt(0).toUpperCase()}${field.slice(1).replace("Count", "")}`
        // Map field names to tournament default fields
        const countMap: Record<string, number> = {
          menDoublesCount: tournament.defaultMenDoubles ?? 0,
          womenDoublesCount: tournament.defaultWomenDoubles ?? 0,
          mixedDoublesCount: tournament.defaultMixedDoubles ?? 0,
          menSinglesCount: tournament.defaultMenSingles ?? 0,
          womenSinglesCount: tournament.defaultWomenSingles ?? 0,
          kidsSinglesCount: tournament.defaultKidsSingles ?? 0,
          kidsDoublesCount: tournament.defaultKidsDoubles ?? 0,
        }
        const count = countMap[field] ?? 0
        for (let i = 0; i < count; i++) {
          fixtureCreates.push({
            teamMatchId: teamMatch.id,
            fixtureNumber: fixtureNumber++,
            fixtureType,
          })
        }
      }

      if (fixtureCreates.length > 0) {
        await tx.fixture.createMany({ data: fixtureCreates })
      }

      // Link knockout match to team match
      await tx.knockoutMatch.update({
        where: { id: knockoutMatchId },
        data: { teamMatchId: teamMatch.id },
      })

      return teamMatch
    })
  }

  /**
   * Advance winner of a knockout match to next round.
   * Sets winner, fills next-round slot, auto-creates TeamMatch if both teams ready.
   */
  static async advanceWinner(
    knockoutMatchId: string,
    winnerTeamId: string,
    tournament?: {
      id: string
      defaultMenDoubles?: number | null
      defaultWomenDoubles?: number | null
      defaultMixedDoubles?: number | null
      defaultMenSingles?: number | null
      defaultWomenSingles?: number | null
      defaultKidsSingles?: number | null
      defaultKidsDoubles?: number | null
      defaultSetsCount?: number | null
      defaultPointsToWin?: number | null
      defaultDeuceCap?: number | null
    }
  ) {
    const km = await prisma.knockoutMatch.findUnique({
      where: { id: knockoutMatchId },
    })
    if (!km) return null

    // Set winner
    await prisma.knockoutMatch.update({
      where: { id: knockoutMatchId },
      data: { winnerTeamId },
    })

    // Find next round match(es) that this feeds into
    const nextMatches = await prisma.knockoutMatch.findMany({
      where: {
        tournamentId: km.tournamentId,
        OR: [
          { teamASourceMatchId: knockoutMatchId },
          { teamBSourceMatchId: knockoutMatchId },
        ],
      },
    })

    for (const nextMatch of nextMatches) {
      const updateData: Record<string, string> = {}

      if (nextMatch.teamASourceMatchId === knockoutMatchId) {
        updateData.teamAId = winnerTeamId
      }
      if (nextMatch.teamBSourceMatchId === knockoutMatchId) {
        updateData.teamBId = winnerTeamId
      }

      const updated = await prisma.knockoutMatch.update({
        where: { id: nextMatch.id },
        data: updateData,
      })

      // If both teams are now known and no TeamMatch yet, auto-create one
      if (updated.teamAId && updated.teamBId && !updated.teamMatchId && tournament) {
        await this.createTeamMatchForKnockout(nextMatch.id, tournament)
      }
    }

    return km
  }

  /**
   * Delete all knockout matches for a tournament.
   */
  static async deleteAllForTournament(tournamentId: string) {
    // Need to unlink self-references first
    await prisma.knockoutMatch.updateMany({
      where: { tournamentId },
      data: {
        teamASourceMatchId: null,
        teamBSourceMatchId: null,
      },
    })
    await prisma.knockoutMatch.deleteMany({
      where: { tournamentId },
    })
  }
}

function formatRoundLabel(round: string): string {
  switch (round) {
    case "ROUND_OF_32": return "Round of 32"
    case "ROUND_OF_16": return "Round of 16"
    case "QUARTER_FINAL": return "Quarter Final"
    case "SEMI_FINAL": return "Semi Final"
    case "FINAL": return "Final"
    default: return round
  }
}
