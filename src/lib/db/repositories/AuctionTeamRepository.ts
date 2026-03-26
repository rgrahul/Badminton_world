import { prisma } from "../client"

export class AuctionTeamRepository {
  static async create(data: {
    auctionId: string
    name: string
    budget: number
    logoUrl?: string
  }) {
    return prisma.auctionTeam.create({
      data,
      include: {
        soldPlayers: {
          include: { player: true },
        },
      },
    })
  }

  static async createMany(
    auctionId: string,
    teams: { name: string; budget: number; logoUrl?: string }[]
  ) {
    const created = await prisma.$transaction(
      teams.map((t) =>
        prisma.auctionTeam.create({
          data: {
            auctionId,
            name: t.name,
            budget: t.budget,
            logoUrl: t.logoUrl,
          },
        })
      )
    )
    return created
  }

  static async findByAuctionId(auctionId: string) {
    return prisma.auctionTeam.findMany({
      where: { auctionId },
      include: {
        soldPlayers: {
          include: { player: true },
          orderBy: { soldAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  static async update(
    id: string,
    data: { name?: string; budget?: number; logoUrl?: string | null }
  ) {
    return prisma.auctionTeam.update({
      where: { id },
      data,
      include: {
        soldPlayers: {
          include: { player: true },
        },
      },
    })
  }

  static async delete(id: string) {
    return prisma.auctionTeam.delete({
      where: { id },
    })
  }
}
