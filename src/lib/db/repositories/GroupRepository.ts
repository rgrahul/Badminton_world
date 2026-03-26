import { prisma } from "../client"

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

export class GroupRepository {
  /**
   * Create groups for a tournament and randomly assign teams.
   */
  static async createGroups(tournamentId: string, groupCount: number) {
    // Fetch all teams in the tournament
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      orderBy: { createdAt: "asc" },
    })

    // Shuffle teams using cryptographically secure randomness
    const shuffled = [...teams]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomBytes = new Uint32Array(1)
      crypto.getRandomValues(randomBytes)
      const j = randomBytes[0] % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return prisma.$transaction(async (tx) => {
      // Delete existing groups for this tournament
      await tx.groupTeam.deleteMany({
        where: { group: { tournamentId } },
      })
      await tx.tournamentGroup.deleteMany({
        where: { tournamentId },
      })

      // Create groups
      const groups: { id: string; name: string; sortOrder: number }[] = []
      for (let i = 0; i < groupCount; i++) {
        const group = await tx.tournamentGroup.create({
          data: {
            tournamentId,
            name: `Group ${GROUP_LETTERS[i]}`,
            sortOrder: i,
          },
        })
        groups.push(group)
      }

      // Assign teams to groups in round-robin fashion
      const groupTeamCreates = shuffled.map((team, index) => ({
        groupId: groups[index % groupCount].id,
        teamId: team.id,
        seedOrder: Math.floor(index / groupCount) + 1,
      }))

      await tx.groupTeam.createMany({ data: groupTeamCreates })

      // Return groups with teams
      return tx.tournamentGroup.findMany({
        where: { tournamentId },
        include: {
          groupTeams: {
            include: { team: true },
            orderBy: { seedOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      })
    })
  }

  /**
   * Fetch all groups for a tournament with their teams.
   */
  static async findByTournamentId(tournamentId: string) {
    return prisma.tournamentGroup.findMany({
      where: { tournamentId },
      include: {
        groupTeams: {
          include: { team: true },
          orderBy: { seedOrder: "asc" },
        },
        teamMatches: {
          include: {
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
            winningTeam: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })
  }

  /**
   * Reassign teams to groups. Expects an array of { teamId, groupId } pairs.
   */
  static async assignTeamsToGroups(
    tournamentId: string,
    assignments: { teamId: string; groupId: string }[]
  ) {
    return prisma.$transaction(async (tx) => {
      // Delete existing group team assignments
      await tx.groupTeam.deleteMany({
        where: { group: { tournamentId } },
      })

      // Group assignments by groupId to compute seedOrder
      const byGroup: Record<string, string[]> = {}
      for (const a of assignments) {
        if (!byGroup[a.groupId]) byGroup[a.groupId] = []
        byGroup[a.groupId].push(a.teamId)
      }

      const creates = []
      for (const [groupId, teamIds] of Object.entries(byGroup)) {
        for (let i = 0; i < teamIds.length; i++) {
          creates.push({
            groupId,
            teamId: teamIds[i],
            seedOrder: i + 1,
          })
        }
      }

      await tx.groupTeam.createMany({ data: creates })

      return tx.tournamentGroup.findMany({
        where: { tournamentId },
        include: {
          groupTeams: {
            include: { team: true },
            orderBy: { seedOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      })
    })
  }

  /**
   * Compute standings for a single group based on completed team matches.
   */
  static async computeGroupStandings(groupId: string) {
    const group = await prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        groupTeams: {
          include: { team: true },
          orderBy: { seedOrder: "asc" },
        },
        teamMatches: {
          where: { status: "COMPLETED" },
          select: {
            teamAId: true,
            teamBId: true,
            fixturesWonByTeamA: true,
            fixturesWonByTeamB: true,
            totalPointsTeamA: true,
            totalPointsTeamB: true,
            winningTeamId: true,
          },
        },
      },
    })

    if (!group) return null

    const stats: Record<string, {
      teamId: string
      teamName: string
      played: number
      won: number
      lost: number
      drawn: number
      fixturesWon: number
      fixturesLost: number
      pointsFor: number
      pointsAgainst: number
    }> = {}

    for (const gt of group.groupTeams) {
      stats[gt.teamId] = {
        teamId: gt.teamId,
        teamName: gt.team.name,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        fixturesWon: 0,
        fixturesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }
    }

    for (const tm of group.teamMatches) {
      const a = stats[tm.teamAId]
      const b = stats[tm.teamBId]
      if (!a || !b) continue

      a.played++
      b.played++
      a.fixturesWon += tm.fixturesWonByTeamA
      a.fixturesLost += tm.fixturesWonByTeamB
      b.fixturesWon += tm.fixturesWonByTeamB
      b.fixturesLost += tm.fixturesWonByTeamA
      a.pointsFor += tm.totalPointsTeamA
      a.pointsAgainst += tm.totalPointsTeamB
      b.pointsFor += tm.totalPointsTeamB
      b.pointsAgainst += tm.totalPointsTeamA

      if (tm.winningTeamId === tm.teamAId) {
        a.won++
        b.lost++
      } else if (tm.winningTeamId === tm.teamBId) {
        b.won++
        a.lost++
      } else {
        a.drawn++
        b.drawn++
      }
    }

    return Object.values(stats).sort((a, b) => {
      const ptsA = a.won * 2 + a.drawn
      const ptsB = b.won * 2 + b.drawn
      if (ptsB !== ptsA) return ptsB - ptsA
      const diffA = a.pointsFor - a.pointsAgainst
      const diffB = b.pointsFor - b.pointsAgainst
      if (diffB !== diffA) return diffB - diffA
      return b.pointsFor - a.pointsFor
    })
  }

  /**
   * Compute standings for all groups in a tournament.
   */
  static async computeAllGroupStandings(tournamentId: string) {
    const groups = await prisma.tournamentGroup.findMany({
      where: { tournamentId },
      select: { id: true, name: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    })

    const result = []
    for (const group of groups) {
      const standings = await this.computeGroupStandings(group.id)
      result.push({
        groupId: group.id,
        groupName: group.name,
        sortOrder: group.sortOrder,
        standings: standings || [],
      })
    }

    return result
  }

  /**
   * Delete all groups for a tournament.
   */
  static async deleteAllForTournament(tournamentId: string) {
    await prisma.groupTeam.deleteMany({
      where: { group: { tournamentId } },
    })
    await prisma.tournamentGroup.deleteMany({
      where: { tournamentId },
    })
  }
}
