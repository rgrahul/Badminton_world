import { prisma } from "../client"

export interface CreateTeamInput {
  name: string
  tournamentId: string
  teamSize: number
  requiredMale: number
  requiredFemale: number
  requiredKid: number
  logoUrl?: string
  players: {
    playerId: string
    category: "MALE" | "FEMALE" | "KID"
  }[]
}

export interface UpdateTeamInput {
  name?: string
  teamSize?: number
  requiredMale?: number
  requiredFemale?: number
  requiredKid?: number
  logoUrl?: string | null
}

export interface TeamFilters {
  tournamentId?: string
  search?: string
}

const teamInclude = {
  players: {
    include: {
      player: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  tournament: {
    select: { id: true, name: true },
  },
  _count: {
    select: { players: true },
  },
}

export class TeamRepository {
  static async create(data: CreateTeamInput) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          tournamentId: data.tournamentId,
          teamSize: data.teamSize,
          requiredMale: data.requiredMale,
          requiredFemale: data.requiredFemale,
          requiredKid: data.requiredKid,
          logoUrl: data.logoUrl,
          players: {
            create: data.players.map((p) => ({
              playerId: p.playerId,
              category: p.category,
            })),
          },
        },
        include: teamInclude,
      })
      return team
    })
  }

  static async findAll(filters?: TeamFilters) {
    const where: any = {}

    if (filters?.tournamentId) {
      where.tournamentId = filters.tournamentId
    }

    if (filters?.search) {
      where.name = { contains: filters.search, mode: "insensitive" }
    }

    return prisma.team.findMany({
      where,
      include: teamInclude,
      orderBy: { createdAt: "desc" },
    })
  }

  static async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: teamInclude,
    })
  }

  static async findByIdWithMatches(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        ...teamInclude,
        teamMatchesAsA: {
          include: {
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
            winningTeam: { select: { id: true, name: true } },
            fixtures: {
              include: {
                match: {
                  select: {
                    id: true,
                    status: true,
                    winningSide: true,
                    setsWonBySideA: true,
                    setsWonBySideB: true,
                  },
                },
              },
              orderBy: { fixtureNumber: "asc" as const },
            },
          },
          orderBy: { createdAt: "desc" as const },
        },
        teamMatchesAsB: {
          include: {
            teamA: { select: { id: true, name: true } },
            teamB: { select: { id: true, name: true } },
            winningTeam: { select: { id: true, name: true } },
            fixtures: {
              include: {
                match: {
                  select: {
                    id: true,
                    status: true,
                    winningSide: true,
                    setsWonBySideA: true,
                    setsWonBySideB: true,
                  },
                },
              },
              orderBy: { fixtureNumber: "asc" as const },
            },
          },
          orderBy: { createdAt: "desc" as const },
        },
      },
    })
  }

  static async findByTournamentId(tournamentId: string) {
    return prisma.team.findMany({
      where: { tournamentId },
      include: teamInclude,
      orderBy: { createdAt: "desc" },
    })
  }

  static async update(id: string, data: UpdateTeamInput) {
    return prisma.team.update({
      where: { id },
      data,
      include: teamInclude,
    })
  }

  static async updateWithPlayers(
    id: string,
    data: UpdateTeamInput & {
      players: { playerId: string; category: "MALE" | "FEMALE" | "KID" }[]
    }
  ) {
    const { players, ...teamData } = data
    return prisma.$transaction(async (tx) => {
      await tx.teamPlayer.deleteMany({ where: { teamId: id } })
      const team = await tx.team.update({
        where: { id },
        data: {
          ...teamData,
          players: {
            create: players.map((p) => ({
              playerId: p.playerId,
              category: p.category,
            })),
          },
        },
        include: teamInclude,
      })
      return team
    })
  }

  static async delete(id: string) {
    return prisma.team.delete({
      where: { id },
    })
  }

  static async count(filters?: TeamFilters) {
    const where: any = {}
    if (filters?.tournamentId) {
      where.tournamentId = filters.tournamentId
    }
    if (filters?.search) {
      where.name = { contains: filters.search, mode: "insensitive" }
    }
    return prisma.team.count({ where })
  }
}
