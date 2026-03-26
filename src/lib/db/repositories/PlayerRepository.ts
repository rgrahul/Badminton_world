import { prisma } from "../client"
import type { Prisma } from "@prisma/client"

export interface CreatePlayerInput {
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: "MALE" | "FEMALE" | "OTHER" | null
  yearsOfExperience?: number | null
  skillRating?: number | null
  profilePhoto?: string | null
}

export interface UpdatePlayerInput {
  name?: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: "MALE" | "FEMALE" | "OTHER" | null
  yearsOfExperience?: number | null
  skillRating?: number | null
  profilePhoto?: string | null
}

export interface PlayerFilters {
  search?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  minAge?: number
  maxAge?: number
  minSkillRating?: number
  maxSkillRating?: number
}

export class PlayerRepository {
  static async create(data: CreatePlayerInput) {
    return prisma.player.create({
      data,
    })
  }

  static async findAll(filters?: PlayerFilters, page = 1, limit = 50) {
    const where: Prisma.PlayerWhereInput = {}

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters?.gender) {
      where.gender = filters.gender
    }

    if (filters?.minAge !== undefined || filters?.maxAge !== undefined) {
      where.age = {}
      if (filters.minAge !== undefined) {
        where.age.gte = filters.minAge
      }
      if (filters.maxAge !== undefined) {
        where.age.lte = filters.maxAge
      }
    }

    if (filters?.minSkillRating !== undefined || filters?.maxSkillRating !== undefined) {
      where.skillRating = {}
      if (filters.minSkillRating !== undefined) {
        where.skillRating.gte = filters.minSkillRating
      }
      if (filters.maxSkillRating !== undefined) {
        where.skillRating.lte = filters.maxSkillRating
      }
    }

    const skip = (page - 1) * limit

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.player.count({ where }),
    ])

    return {
      players,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async findById(id: string) {
    return prisma.player.findUnique({
      where: { id },
    })
  }

  static async update(id: string, data: UpdatePlayerInput) {
    return prisma.player.update({
      where: { id },
      data,
    })
  }

  static async delete(id: string) {
    return prisma.player.delete({
      where: { id },
    })
  }

  static async bulkCreate(players: CreatePlayerInput[]) {
    return prisma.player.createMany({
      data: players,
      skipDuplicates: true,
    })
  }

  static async count(filters?: PlayerFilters) {
    const where: Prisma.PlayerWhereInput = {}

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { mobileNumber: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters?.gender) {
      where.gender = filters.gender
    }

    return prisma.player.count({ where })
  }
}
