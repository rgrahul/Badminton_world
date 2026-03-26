import { prisma } from "../client"
import type { Set } from "@prisma/client"

export interface CreateSetInput {
  matchId: string
  setNumber: number
  scoreA?: number
  scoreB?: number
}

export interface UpdateSetInput {
  scoreA?: number
  scoreB?: number
  winningSide?: string | null
  completedAt?: Date | null
}

export class SetRepository {
  /**
   * Creates a new set
   */
  static async create(input: CreateSetInput): Promise<Set> {
    return prisma.set.create({
      data: {
        matchId: input.matchId,
        setNumber: input.setNumber,
        scoreA: input.scoreA || 0,
        scoreB: input.scoreB || 0,
      },
    })
  }

  /**
   * Finds a set by ID
   */
  static async findById(id: string): Promise<Set | null> {
    return prisma.set.findUnique({
      where: { id },
    })
  }

  /**
   * Finds a set by match ID and set number
   */
  static async findByMatchAndSetNumber(
    matchId: string,
    setNumber: number
  ): Promise<Set | null> {
    return prisma.set.findUnique({
      where: {
        matchId_setNumber: {
          matchId,
          setNumber,
        },
      },
    })
  }

  /**
   * Finds all sets for a match
   */
  static async findByMatchId(matchId: string): Promise<Set[]> {
    return prisma.set.findMany({
      where: { matchId },
      orderBy: { setNumber: "asc" },
    })
  }

  /**
   * Finds all sets for a match with rallies
   */
  static async findByMatchIdWithRallies(matchId: string) {
    return prisma.set.findMany({
      where: { matchId },
      orderBy: { setNumber: "asc" },
      include: {
        rallies: {
          where: { isDeleted: false },
          orderBy: { setRallyNum: "asc" },
        },
      },
    })
  }

  /**
   * Updates a set
   */
  static async update(id: string, input: UpdateSetInput): Promise<Set> {
    return prisma.set.update({
      where: { id },
      data: input,
    })
  }

  /**
   * Deletes a set
   */
  static async delete(id: string): Promise<Set> {
    return prisma.set.delete({
      where: { id },
    })
  }

  /**
   * Gets the current (latest) set for a match
   */
  static async getCurrentSet(matchId: string): Promise<Set | null> {
    return prisma.set.findFirst({
      where: { matchId },
      orderBy: { setNumber: "desc" },
    })
  }

  /**
   * Counts completed sets for a match
   */
  static async countCompleted(matchId: string): Promise<number> {
    return prisma.set.count({
      where: {
        matchId,
        winningSide: { not: null },
      },
    })
  }
}
