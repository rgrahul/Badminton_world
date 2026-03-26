import { prisma } from "../client"

export class AuctionPlayerRepository {
  static async create(data: {
    auctionId: string
    playerId: string
    basePrice?: number
    sortOrder?: number
  }) {
    return prisma.auctionPlayer.create({
      data,
      include: {
        player: true,
        soldToTeam: { select: { id: true, name: true } },
      },
    })
  }

  static async createMany(
    auctionId: string,
    players: { playerId: string; basePrice?: number }[]
  ) {
    await prisma.auctionPlayer.createMany({
      data: players.map((p, i) => ({
        auctionId,
        playerId: p.playerId,
        basePrice: p.basePrice ?? 0,
        sortOrder: i,
      })),
      skipDuplicates: true,
    })

    return prisma.auctionPlayer.findMany({
      where: { auctionId },
      include: {
        player: true,
        soldToTeam: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  }

  static async findByAuctionId(
    auctionId: string,
    filters?: { status?: string; search?: string }
  ) {
    const where: Record<string, unknown> = { auctionId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.player = {
        name: { contains: filters.search, mode: "insensitive" },
      }
    }

    return prisma.auctionPlayer.findMany({
      where,
      include: {
        player: true,
        soldToTeam: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  }

  static async markSold(
    id: string,
    data: { soldPrice: number; soldToTeamId: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const auctionPlayer = await tx.auctionPlayer.update({
        where: { id },
        data: {
          status: "SOLD",
          soldPrice: data.soldPrice,
          soldToTeamId: data.soldToTeamId,
          soldAt: new Date(),
        },
        include: {
          player: true,
          soldToTeam: { select: { id: true, name: true } },
        },
      })

      await tx.auctionTeam.update({
        where: { id: data.soldToTeamId },
        data: {
          spent: { increment: data.soldPrice },
        },
      })

      return auctionPlayer
    })
  }

  static async markUnsold(id: string) {
    return prisma.auctionPlayer.update({
      where: { id },
      data: {
        status: "UNSOLD",
        soldPrice: null,
        soldToTeamId: null,
        soldAt: null,
      },
      include: {
        player: true,
        soldToTeam: { select: { id: true, name: true } },
      },
    })
  }

  static async resetToAvailable(id: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.auctionPlayer.findUnique({
        where: { id },
      })

      if (!current) throw new Error("Auction player not found")

      // If was sold, decrement team's spent
      if (current.status === "SOLD" && current.soldToTeamId && current.soldPrice) {
        await tx.auctionTeam.update({
          where: { id: current.soldToTeamId },
          data: {
            spent: { decrement: current.soldPrice },
          },
        })
      }

      return tx.auctionPlayer.update({
        where: { id },
        data: {
          status: "AVAILABLE",
          soldPrice: null,
          soldToTeamId: null,
          soldAt: null,
        },
        include: {
          player: true,
          soldToTeam: { select: { id: true, name: true } },
        },
      })
    })
  }

  static async getStats(auctionId: string) {
    const [total, available, sold, unsold, spentResult] = await Promise.all([
      prisma.auctionPlayer.count({ where: { auctionId } }),
      prisma.auctionPlayer.count({ where: { auctionId, status: "AVAILABLE" } }),
      prisma.auctionPlayer.count({ where: { auctionId, status: "SOLD" } }),
      prisma.auctionPlayer.count({ where: { auctionId, status: "UNSOLD" } }),
      prisma.auctionPlayer.aggregate({
        where: { auctionId, status: "SOLD" },
        _sum: { soldPrice: true },
      }),
    ])

    return {
      total,
      available,
      sold,
      unsold,
      totalSpent: spentResult._sum.soldPrice ?? 0,
    }
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.auctionPlayer.findUnique({ where: { id } })

      if (current?.status === "SOLD" && current.soldToTeamId && current.soldPrice) {
        await tx.auctionTeam.update({
          where: { id: current.soldToTeamId },
          data: { spent: { decrement: current.soldPrice } },
        })
      }

      return tx.auctionPlayer.delete({ where: { id } })
    })
  }
}
