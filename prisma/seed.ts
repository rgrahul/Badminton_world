import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting database seed...")

  // Create demo users
  const hashedPassword = await bcrypt.hash("password123", 10)

  const umpire1 = await prisma.user.upsert({
    where: { email: "umpire@example.com" },
    update: {},
    create: {
      email: "umpire@example.com",
      passwordHash: hashedPassword,
      name: "John Umpire",
      role: "UMPIRE",
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  })

  console.log("Created users:", { umpire1, admin })

  // Create a sample completed singles match
  const match1 = await prisma.match.create({
    data: {
      name: "Friendly Singles Match",
      type: "SINGLES",
      status: "COMPLETED",
      setsCount: 3,
      pointsToWin: 21,
      deuceCap: 30,
      sideAPlayer1: "Alice Johnson",
      sideBPlayer1: "Bob Smith",
      currentSetNumber: 2,
      setsWonBySideA: 2,
      setsWonBySideB: 0,
      winningSide: "A",
      umpireId: umpire1.id,
      startedAt: new Date("2024-01-15T10:00:00Z"),
      completedAt: new Date("2024-01-15T10:45:00Z"),
      sets: {
        create: [
          {
            setNumber: 1,
            scoreA: 21,
            scoreB: 18,
            winningSide: "A",
            completedAt: new Date("2024-01-15T10:20:00Z"),
          },
          {
            setNumber: 2,
            scoreA: 21,
            scoreB: 19,
            winningSide: "A",
            completedAt: new Date("2024-01-15T10:45:00Z"),
          },
        ],
      },
    },
  })

  console.log("Created match:", match1)

  // Create an in-progress doubles match
  const match2 = await prisma.match.create({
    data: {
      name: "Doubles Tournament - Round 1",
      type: "DOUBLES",
      status: "IN_PROGRESS",
      setsCount: 3,
      pointsToWin: 21,
      deuceCap: 30,
      sideAPlayer1: "Emma Wilson",
      sideAPlayer2: "Frank Brown",
      sideBPlayer1: "Grace Lee",
      sideBPlayer2: "Henry Davis",
      currentSetNumber: 1,
      setsWonBySideA: 0,
      setsWonBySideB: 0,
      umpireId: umpire1.id,
      startedAt: new Date(),
      sets: {
        create: [
          {
            setNumber: 1,
            scoreA: 15,
            scoreB: 12,
          },
        ],
      },
    },
  })

  console.log("Created in-progress match:", match2)

  console.log("Database seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("Error during seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
