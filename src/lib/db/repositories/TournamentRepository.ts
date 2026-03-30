import { prisma } from "../client"

export class TournamentRepository {
  static async create(data: {
    name: string
    description?: string
    dateFrom: Date
    dateTo: Date
    organizerName: string
    organizerEmail?: string
    organizerPhone?: string
    venue?: string
    city?: string
    titlePhoto?: string
    category?: string
    requiresTeams?: boolean
    format?: "CUSTOM" | "LEAGUE_KNOCKOUT" | "KNOCKOUT_ONLY"
    numberOfGroups?: number
    qualifyPerGroup?: number
    defaultMenDoubles?: number
    defaultWomenDoubles?: number
    defaultMixedDoubles?: number
    defaultMenSingles?: number
    defaultWomenSingles?: number
    defaultKidsSingles?: number
    defaultKidsDoubles?: number
    defaultSetsCount?: number
    defaultPointsToWin?: number
    defaultDeuceCap?: number
    teamRequiredMale?: number
    teamRequiredFemale?: number
    teamRequiredKid?: number
    createdById?: string
  }) {
    return prisma.tournament.create({
      data,
      include: {
        _count: {
          select: { matches: true },
        },
      },
    })
  }

  static async findAll(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    if (filters?.status) {
      where.status = filters.status
    }

    return prisma.tournament.findMany({
      where,
      include: {
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { dateFrom: "desc" },
      take: filters?.limit,
      skip: filters?.offset,
    })
  }

  static async findById(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    })
  }

  static async findByIdWithMatches(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            sets: {
              orderBy: { setNumber: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { matches: true },
        },
      },
    })
  }

  static async findByIdWithMatchesAndTeams(id: string) {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            sets: {
              orderBy: { setNumber: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        teams: {
          include: {
            players: {
              include: {
                player: true,
              },
              orderBy: { createdAt: "asc" },
            },
            captain: {
              select: { id: true, name: true, profilePhoto: true },
            },
            _count: {
              select: { players: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        teamMatches: {
          include: {
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
            winningTeam: { select: { id: true, name: true } },
            _count: { select: { fixtures: true } },
            fixtures: {
              select: {
                id: true,
                teamAPlayer1Id: true,
                matchId: true,
              },
            },
          },
          orderBy: { createdAt: "desc" as const },
        },
        groups: {
          include: {
            groupTeams: {
              include: {
                team: { select: { id: true, name: true } },
              },
              orderBy: { seedOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        knockoutMatches: {
          include: {
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
          },
          orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        },
        _count: {
          select: { matches: true, teams: true, teamMatches: true },
        },
      },
    })
  }

  static async update(id: string, data: any) {
    return prisma.tournament.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { matches: true },
        },
      },
    })
  }

  static async delete(id: string) {
    return prisma.tournament.delete({
      where: { id },
    })
  }

  static async count(filters?: { status?: string }) {
    const where: any = {}
    if (filters?.status) {
      where.status = filters.status
    }
    return prisma.tournament.count({ where })
  }
}
