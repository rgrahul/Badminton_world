import { AuctionStatus } from "@prisma/client"
import { prisma } from "../client"

export class AuctionRepository {
  static async create(data: {
    name: string
    tournamentId?: string
    createdById?: string
  }) {
    return prisma.auction.create({
      data,
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, players: true } },
      },
    })
  }

  static async findAll(filters?: { status?: string; tournamentId?: string }) {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.tournamentId) where.tournamentId = filters.tournamentId

    return prisma.auction.findMany({
      where,
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, players: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  static async findById(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, players: true } },
      },
    })
  }

  static async findByIdFull(id: string) {
    return prisma.auction.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, name: true } },
        teams: {
          include: {
            soldPlayers: {
              include: {
                player: true,
              },
              orderBy: { soldAt: "desc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        players: {
          include: {
            player: true,
            soldToTeam: { select: { id: true, name: true } },
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        _count: { select: { teams: true, players: true } },
      },
    })
  }

  static async findByTournamentId(tournamentId: string) {
    return prisma.auction.findUnique({
      where: { tournamentId },
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, players: true } },
      },
    })
  }

  static async update(id: string, data: { name?: string; status?: AuctionStatus }) {
    return prisma.auction.update({
      where: { id },
      data,
      include: {
        tournament: { select: { id: true, name: true } },
        _count: { select: { teams: true, players: true } },
      },
    })
  }

  static async delete(id: string) {
    return prisma.auction.delete({
      where: { id },
    })
  }
}
