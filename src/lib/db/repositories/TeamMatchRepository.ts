import { prisma } from "../client"

type FixtureTypeEnum =
  | "MEN_DOUBLES"
  | "WOMEN_DOUBLES"
  | "MIXED_DOUBLES"
  | "MEN_SINGLES"
  | "WOMEN_SINGLES"
  | "KIDS_SINGLES"
  | "KIDS_DOUBLES"

export interface CreateTeamMatchInput {
  name: string
  tournamentId: string
  teamAId: string
  teamBId: string
  category: "ADULT" | "KIDS"
  genderRestriction?: boolean
  menDoublesCount: number
  womenDoublesCount: number
  mixedDoublesCount: number
  menSinglesCount: number
  womenSinglesCount: number
  kidsSinglesCount: number
  kidsDoublesCount: number
  setsCount?: number
  pointsToWin?: number
  deuceCap?: number
  groupId?: string
  allowPlayerReuse?: boolean
}

const teamMatchInclude = {
  tournament: {
    select: { id: true, name: true },
  },
  winningTeam: {
    select: { id: true, name: true },
  },
  teamA: {
    include: {
      players: {
        include: { player: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
  teamB: {
    include: {
      players: {
        include: { player: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
  fixtures: {
    include: {
      teamAPlayer1: true,
      teamAPlayer2: true,
      teamBPlayer1: true,
      teamBPlayer2: true,
      match: {
        select: {
          id: true,
          name: true,
          status: true,
          setsWonBySideA: true,
          setsWonBySideB: true,
          winningSide: true,
          sets: {
            select: { scoreA: true, scoreB: true },
          },
        },
      },
    },
    orderBy: { fixtureNumber: "asc" as const },
  },
}

const FORMAT_TO_FIXTURE_TYPE: Record<string, FixtureTypeEnum> = {
  menDoublesCount: "MEN_DOUBLES",
  womenDoublesCount: "WOMEN_DOUBLES",
  mixedDoublesCount: "MIXED_DOUBLES",
  menSinglesCount: "MEN_SINGLES",
  womenSinglesCount: "WOMEN_SINGLES",
  kidsSinglesCount: "KIDS_SINGLES",
  kidsDoublesCount: "KIDS_DOUBLES",
}

export class TeamMatchRepository {
  static async create(data: CreateTeamMatchInput) {
    return prisma.$transaction(async (tx) => {
      const teamMatch = await tx.teamMatch.create({
        data: {
          name: data.name,
          tournamentId: data.tournamentId,
          teamAId: data.teamAId,
          teamBId: data.teamBId,
          category: data.category,
          genderRestriction: data.genderRestriction,
          allowPlayerReuse: data.allowPlayerReuse ?? false,
          menDoublesCount: data.menDoublesCount,
          womenDoublesCount: data.womenDoublesCount,
          mixedDoublesCount: data.mixedDoublesCount,
          menSinglesCount: data.menSinglesCount,
          womenSinglesCount: data.womenSinglesCount,
          kidsSinglesCount: data.kidsSinglesCount,
          kidsDoublesCount: data.kidsDoublesCount,
          setsCount: data.setsCount ?? 3,
          pointsToWin: data.pointsToWin ?? 21,
          deuceCap: data.deuceCap ?? 30,
          groupId: data.groupId,
        },
      })

      // Auto-generate fixture records based on format counts
      let fixtureNumber = 1
      const fixtureCreates: {
        teamMatchId: string
        fixtureNumber: number
        fixtureType: FixtureTypeEnum
      }[] = []

      for (const [field, fixtureType] of Object.entries(FORMAT_TO_FIXTURE_TYPE)) {
        const count = data[field as keyof CreateTeamMatchInput] as number
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

      // Return full team match with fixtures
      return tx.teamMatch.findUnique({
        where: { id: teamMatch.id },
        include: teamMatchInclude,
      })
    })
  }

  static async findById(id: string) {
    return prisma.teamMatch.findUnique({
      where: { id },
      include: teamMatchInclude,
    })
  }

  static async findByTournamentId(tournamentId: string) {
    return prisma.teamMatch.findMany({
      where: { tournamentId },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
        _count: { select: { fixtures: true } },
        fixtures: {
          select: {
            id: true,
            teamAPlayer1Id: true,
            teamAPlayer2Id: true,
            teamBPlayer1Id: true,
            teamBPlayer2Id: true,
            matchId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  static async update(id: string, data: { name?: string; status?: "DRAFT" | "READY" | "IN_PROGRESS" | "COMPLETED" }) {
    return prisma.teamMatch.update({
      where: { id },
      data,
      include: teamMatchInclude,
    })
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      // Find all fixtures with linked matches
      const fixtures = await tx.fixture.findMany({
        where: { teamMatchId: id },
        select: { matchId: true },
      })

      const matchIds = fixtures
        .map((f) => f.matchId)
        .filter(Boolean) as string[]

      // Unlink fixtures from matches first (to avoid FK issues)
      await tx.fixture.updateMany({
        where: { teamMatchId: id, matchId: { not: null } },
        data: { matchId: null },
      })

      // Delete all linked matches (cascades to sets and rallies)
      if (matchIds.length > 0) {
        await tx.match.deleteMany({
          where: { id: { in: matchIds } },
        })
      }

      // Delete the team match (cascades to fixtures)
      return tx.teamMatch.delete({
        where: { id },
      })
    })
  }

  static async assignFixturePlayers(
    fixtureId: string,
    players: {
      teamAPlayer1Id: string | null
      teamAPlayer2Id: string | null
      teamBPlayer1Id: string | null
      teamBPlayer2Id: string | null
    }
  ) {
    return prisma.fixture.update({
      where: { id: fixtureId },
      data: players,
      include: {
        teamAPlayer1: true,
        teamAPlayer2: true,
        teamBPlayer1: true,
        teamBPlayer2: true,
        match: true,
        teamMatch: true,
      },
    })
  }

  static async createFixtureMatch(
    fixtureId: string,
    matchData: {
      name: string
      type: "SINGLES" | "DOUBLES"
      sideAPlayer1: string
      sideAPlayer2?: string
      sideBPlayer1: string
      sideBPlayer2?: string
      tournamentId?: string
      setsCount?: number
      pointsToWin?: number
      deuceCap?: number
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.create({
        data: {
          name: matchData.name,
          type: matchData.type,
          sideAPlayer1: matchData.sideAPlayer1,
          sideAPlayer2: matchData.sideAPlayer2,
          sideBPlayer1: matchData.sideBPlayer1,
          sideBPlayer2: matchData.sideBPlayer2,
          tournamentId: matchData.tournamentId,
          status: "NOT_STARTED",
          setsCount: matchData.setsCount ?? 3,
          pointsToWin: matchData.pointsToWin ?? 21,
          deuceCap: matchData.deuceCap ?? 30,
        },
      })

      // Create initial set
      await tx.set.create({
        data: {
          matchId: match.id,
          setNumber: 1,
        },
      })

      // Link fixture to match
      await tx.fixture.update({
        where: { id: fixtureId },
        data: { matchId: match.id },
      })

      return match
    })
  }

  static async recalculateResult(teamMatchId: string) {
    const teamMatch = await prisma.teamMatch.findUnique({
      where: { id: teamMatchId },
      include: {
        fixtures: {
          include: {
            match: {
              include: {
                sets: { select: { scoreA: true, scoreB: true } },
              },
            },
          },
        },
      },
    })

    if (!teamMatch) return null

    // Check if all fixtures have completed matches
    const allCompleted =
      teamMatch.fixtures.length > 0 &&
      teamMatch.fixtures.every(
        (f) => f.match && f.match.status === "COMPLETED"
      )

    if (!allCompleted) return null

    // Count fixtures won by each team
    let fixturesWonByTeamA = 0
    let fixturesWonByTeamB = 0
    let totalPointsTeamA = 0
    let totalPointsTeamB = 0

    for (const fixture of teamMatch.fixtures) {
      const match = fixture.match!
      if (match.winningSide === "A") fixturesWonByTeamA++
      if (match.winningSide === "B") fixturesWonByTeamB++

      for (const set of match.sets) {
        totalPointsTeamA += set.scoreA
        totalPointsTeamB += set.scoreB
      }
    }

    // Determine winner: most fixtures won, tiebreak by point differential
    let winningTeamId: string | null = null
    if (fixturesWonByTeamA > fixturesWonByTeamB) {
      winningTeamId = teamMatch.teamAId
    } else if (fixturesWonByTeamB > fixturesWonByTeamA) {
      winningTeamId = teamMatch.teamBId
    } else {
      // Tied on fixtures, use point differential
      if (totalPointsTeamA > totalPointsTeamB) {
        winningTeamId = teamMatch.teamAId
      } else if (totalPointsTeamB > totalPointsTeamA) {
        winningTeamId = teamMatch.teamBId
      }
      // If still tied, winningTeamId stays null (draw)
    }

    const updated = await prisma.teamMatch.update({
      where: { id: teamMatchId },
      data: {
        fixturesWonByTeamA,
        fixturesWonByTeamB,
        totalPointsTeamA,
        totalPointsTeamB,
        winningTeamId,
        status: "COMPLETED",
      },
      include: {
        ...teamMatchInclude,
        knockoutMatch: true,
      },
    })

    // If this team match is linked to a knockout match, advance the winner
    if (winningTeamId && (updated as any).knockoutMatch) {
      try {
        const { KnockoutRepository } = await import("./KnockoutRepository")
        const tournament = await prisma.tournament.findUnique({
          where: { id: teamMatch.tournamentId },
        })
        if (tournament) {
          await KnockoutRepository.advanceWinner(
            (updated as any).knockoutMatch.id,
            winningTeamId!,
            tournament
          )
        }
      } catch (e) {
        console.error("Failed to advance knockout winner:", e)
      }
    }

    return updated
  }

  static async getFixture(fixtureId: string) {
    return prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: {
        teamAPlayer1: true,
        teamAPlayer2: true,
        teamBPlayer1: true,
        teamBPlayer2: true,
        match: true,
        teamMatch: {
          include: {
            teamA: {
              include: {
                players: {
                  include: { player: true },
                  orderBy: { createdAt: "asc" as const },
                },
              },
            },
            teamB: {
              include: {
                players: {
                  include: { player: true },
                  orderBy: { createdAt: "asc" as const },
                },
              },
            },
            fixtures: {
              select: {
                id: true,
                teamAPlayer1Id: true,
                teamAPlayer2Id: true,
                teamBPlayer1Id: true,
                teamBPlayer2Id: true,
              },
            },
          },
        },
      },
    })
  }
}
