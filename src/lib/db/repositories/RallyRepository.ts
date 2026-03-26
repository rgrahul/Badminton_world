import { Prisma } from "@prisma/client"
import { prisma } from "../client"
import type { Rally } from "@prisma/client"

export interface CreateRallyInput {
  matchId: string
  setId: string
  rallyNumber: number
  setRallyNum: number
  scoringSide: string
  scoreA: number
  scoreB: number
  servingSide: string
  serverName: string
  serverPositions?: Record<string, unknown> | null
}

export class RallyRepository {
  /**
   * Creates a new rally
   */
  static async create(input: CreateRallyInput): Promise<Rally> {
    const { serverPositions, ...rest } = input
    return prisma.rally.create({
      data: {
        ...rest,
        serverPositions: serverPositions
          ? (serverPositions as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    })
  }

  /**
   * Finds all active rallies for a match
   */
  static async findByMatchId(matchId: string): Promise<Rally[]> {
    return prisma.rally.findMany({
      where: {
        matchId,
        isDeleted: false,
      },
      orderBy: { rallyNumber: "asc" },
    })
  }

  /**
   * Finds all active rallies for a set
   */
  static async findBySetId(setId: string): Promise<Rally[]> {
    return prisma.rally.findMany({
      where: {
        setId,
        isDeleted: false,
      },
      orderBy: { setRallyNum: "asc" },
    })
  }

  /**
   * Finds the last active rally for a match
   */
  static async findLastByMatchId(matchId: string): Promise<Rally | null> {
    return prisma.rally.findFirst({
      where: {
        matchId,
        isDeleted: false,
      },
      orderBy: { rallyNumber: "desc" },
    })
  }

  /**
   * Soft deletes a rally (for undo functionality)
   */
  static async softDelete(id: string): Promise<Rally> {
    return prisma.rally.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })
  }

  /**
   * Restores a soft-deleted rally
   */
  static async restore(id: string): Promise<Rally> {
    return prisma.rally.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    })
  }

  /**
   * Permanently deletes all rallies for a match
   */
  static async deleteByMatchId(matchId: string): Promise<{ count: number }> {
    return prisma.rally.deleteMany({
      where: { matchId },
    })
  }

  /**
   * Counts active rallies for a match
   */
  static async countByMatchId(matchId: string): Promise<number> {
    return prisma.rally.count({
      where: {
        matchId,
        isDeleted: false,
      },
    })
  }

  /**
   * Gets rally history with pagination
   */
  static async getHistory(
    matchId: string,
    options: { skip?: number; take?: number } = {}
  ): Promise<Rally[]> {
    return prisma.rally.findMany({
      where: {
        matchId,
        isDeleted: false,
      },
      orderBy: { rallyNumber: "asc" },
      skip: options.skip,
      take: options.take,
    })
  }
}
