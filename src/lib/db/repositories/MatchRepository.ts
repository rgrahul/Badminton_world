import { prisma } from "../client"
import type { Match, MatchStatus, MatchType, Prisma } from "@prisma/client"

export interface CreateMatchInput {
  name: string
  type: MatchType
  setsCount: number
  pointsToWin: number
  deuceCap: number
  sideAPlayer1: string
  sideAPlayer2?: string
  sideBPlayer1: string
  sideBPlayer2?: string
  umpireId?: string
  tournamentId?: string
}

export interface UpdateMatchInput {
  name?: string
  status?: MatchStatus
  currentSetNumber?: number
  setsWonBySideA?: number
  setsWonBySideB?: number
  winningSide?: string | null
  startedAt?: Date | string | null
  completedAt?: Date | string | null
  tournamentId?: string | null
  initialServingSide?: string | null
  initialServerName?: string | null
  initialReceiverName?: string | null
  tossWonBy?: string | null
  tossChoice?: string | null
  courtSwapped?: boolean
}

export interface MatchFilters {
  status?: MatchStatus
  type?: MatchType
  umpireId?: string
  search?: string
}

export class MatchRepository {
  /**
   * Creates a new match
   */
  static async create(input: CreateMatchInput): Promise<Match> {
    return prisma.match.create({
      data: {
        name: input.name,
        type: input.type,
        setsCount: input.setsCount,
        pointsToWin: input.pointsToWin,
        deuceCap: input.deuceCap,
        sideAPlayer1: input.sideAPlayer1,
        sideAPlayer2: input.sideAPlayer2,
        sideBPlayer1: input.sideBPlayer1,
        sideBPlayer2: input.sideBPlayer2,
        umpireId: input.umpireId,
        tournamentId: input.tournamentId,
        status: "NOT_STARTED",
      },
    })
  }

  /**
   * Finds a match by ID
   */
  static async findById(id: string): Promise<Match | null> {
    return prisma.match.findUnique({
      where: { id },
    })
  }

  /**
   * Finds a match by ID with sets and rallies
   */
  static async findByIdWithDetails(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        sets: {
          orderBy: { setNumber: "asc" },
        },
        rallies: {
          where: { isDeleted: false },
          orderBy: { rallyNumber: "asc" },
        },
        umpire: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            dateFrom: true,
            dateTo: true,
          },
        },
      },
    })

    if (!match) return null

    // Fetch player profile photos
    const playerNames = [
      match.sideAPlayer1,
      match.sideAPlayer2,
      match.sideBPlayer1,
      match.sideBPlayer2,
    ].filter(Boolean) as string[]

    const players = await prisma.player.findMany({
      where: {
        name: {
          in: playerNames,
        },
      },
      select: {
        name: true,
        profilePhoto: true,
      },
    })

    // Create a map of player names to profile photos
    const playerPhotos: Record<string, string | null> = {}
    players.forEach((player) => {
      playerPhotos[player.name] = player.profilePhoto
    })

    // Add player photos to match data
    return {
      ...match,
      sideAPlayer1Photo: playerPhotos[match.sideAPlayer1] || null,
      sideAPlayer2Photo: match.sideAPlayer2 ? playerPhotos[match.sideAPlayer2] || null : null,
      sideBPlayer1Photo: playerPhotos[match.sideBPlayer1] || null,
      sideBPlayer2Photo: match.sideBPlayer2 ? playerPhotos[match.sideBPlayer2] || null : null,
    }
  }

  /**
   * Lists matches with optional filters and pagination
   */
  static async list(
    filters: MatchFilters = {},
    options: { skip?: number; take?: number; orderBy?: Prisma.MatchOrderByWithRelationInput } = {}
  ) {
    const where: Prisma.MatchWhereInput = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.umpireId) {
      where.umpireId = filters.umpireId
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sideAPlayer1: { contains: filters.search, mode: "insensitive" } },
        { sideAPlayer2: { contains: filters.search, mode: "insensitive" } },
        { sideBPlayer1: { contains: filters.search, mode: "insensitive" } },
        { sideBPlayer2: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy || { createdAt: "desc" },
        include: {
          umpire: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.match.count({ where }),
    ])

    // Fetch player profile photos for all matches
    const allPlayerNames = new Set<string>()
    matches.forEach((match) => {
      if (match.sideAPlayer1) allPlayerNames.add(match.sideAPlayer1)
      if (match.sideAPlayer2) allPlayerNames.add(match.sideAPlayer2)
      if (match.sideBPlayer1) allPlayerNames.add(match.sideBPlayer1)
      if (match.sideBPlayer2) allPlayerNames.add(match.sideBPlayer2)
    })

    const players = await prisma.player.findMany({
      where: {
        name: {
          in: Array.from(allPlayerNames),
        },
      },
      select: {
        name: true,
        profilePhoto: true,
      },
    })

    const playerPhotos: Record<string, string | null> = {}
    players.forEach((player) => {
      playerPhotos[player.name] = player.profilePhoto
    })

    // Add player photos to each match
    const matchesWithPhotos = matches.map((match) => ({
      ...match,
      sideAPlayer1Photo: playerPhotos[match.sideAPlayer1] || null,
      sideAPlayer2Photo: match.sideAPlayer2 ? playerPhotos[match.sideAPlayer2] || null : null,
      sideBPlayer1Photo: playerPhotos[match.sideBPlayer1] || null,
      sideBPlayer2Photo: match.sideBPlayer2 ? playerPhotos[match.sideBPlayer2] || null : null,
    }))

    return { matches: matchesWithPhotos, total }
  }

  /**
   * Updates a match
   */
  static async update(id: string, input: UpdateMatchInput): Promise<Match> {
    return prisma.match.update({
      where: { id },
      data: input,
    })
  }

  /**
   * Deletes a match (cascades to sets and rallies)
   */
  static async delete(id: string): Promise<Match> {
    return prisma.match.delete({
      where: { id },
    })
  }

  /**
   * Gets match statistics
   */
  static async getStatistics(matchId: string) {
    const match = await this.findByIdWithDetails(matchId)
    if (!match) return null

    const activeRallies = match.rallies.filter((r) => !r.isDeleted)
    const totalRallies = activeRallies.length

    const rallyDurations: number[] = []
    for (let i = 1; i < activeRallies.length; i++) {
      const duration =
        activeRallies[i].timestamp.getTime() - activeRallies[i - 1].timestamp.getTime()
      rallyDurations.push(duration)
    }

    const avgRallyDuration =
      rallyDurations.length > 0
        ? rallyDurations.reduce((a, b) => a + b, 0) / rallyDurations.length
        : 0

    const sideAPoints = activeRallies.filter((r) => r.scoringSide === "A").length
    const sideBPoints = activeRallies.filter((r) => r.scoringSide === "B").length

    const matchDuration = match.startedAt && match.completedAt
      ? match.completedAt.getTime() - match.startedAt.getTime()
      : null

    return {
      totalRallies,
      avgRallyDuration,
      sideAPoints,
      sideBPoints,
      matchDuration,
      sets: match.sets.map((set) => ({
        setNumber: set.setNumber,
        scoreA: set.scoreA,
        scoreB: set.scoreB,
        winningSide: set.winningSide,
      })),
    }
  }

  /**
   * Counts matches by status
   */
  static async countByStatus() {
    const [notStarted, inProgress, completed, abandoned] = await Promise.all([
      prisma.match.count({ where: { status: "NOT_STARTED" } }),
      prisma.match.count({ where: { status: "IN_PROGRESS" } }),
      prisma.match.count({ where: { status: "COMPLETED" } }),
      prisma.match.count({ where: { status: "ABANDONED" } }),
    ])

    return { notStarted, inProgress, completed, abandoned }
  }
}
