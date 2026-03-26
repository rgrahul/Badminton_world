import { prisma } from "../client"
import type { User, UserRole } from "@prisma/client"
import bcrypt from "bcrypt"

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  role?: UserRole
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: UserRole
}

export class UserRepository {
  /**
   * Creates a new user with hashed password
   */
  static async create(input: CreateUserInput): Promise<Omit<User, "passwordHash">> {
    const passwordHash = await bcrypt.hash(input.password, 10)

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role || "PLAYER",
      },
    })

    // Exclude password hash from return value
    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Finds a user by ID (without password hash)
   */
  static async findById(id: string): Promise<Omit<User, "passwordHash"> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) return null

    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Finds a user by email (with password hash for authentication)
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Finds a user by email (without password hash)
   */
  static async findByEmailWithoutPassword(
    email: string
  ): Promise<Omit<User, "passwordHash"> | null> {
    const user = await this.findByEmail(email)
    if (!user) return null

    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Lists all users (without password hashes)
   */
  static async list(options: { skip?: number; take?: number } = {}): Promise<
    Omit<User, "passwordHash">[]
  > {
    const users = await prisma.user.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: { createdAt: "desc" },
    })

    return users.map(({ passwordHash: _, ...user }) => user)
  }

  /**
   * Updates a user
   */
  static async update(
    id: string,
    input: UpdateUserInput
  ): Promise<Omit<User, "passwordHash">> {
    const user = await prisma.user.update({
      where: { id },
      data: input,
    })

    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Updates a user's password
   */
  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    })
  }

  /**
   * Verifies a user's password
   */
  static async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)
    if (!user) return null

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return null

    return user
  }

  /**
   * Deletes a user
   */
  static async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    })
  }

  /**
   * Counts total users
   */
  static async count(): Promise<number> {
    return prisma.user.count()
  }

  /**
   * Counts users by role
   */
  static async countByRole(): Promise<{ umpires: number; admins: number }> {
    const [umpires, admins] = await Promise.all([
      prisma.user.count({ where: { role: "UMPIRE" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
    ])

    return { umpires, admins }
  }
}
