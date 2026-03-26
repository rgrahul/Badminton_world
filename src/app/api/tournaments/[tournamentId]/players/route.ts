import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/client"
import { errorResponse, successResponse } from "@/lib/api/responses"

const addPlayersSchema = z.object({
  playerIds: z.array(z.string().min(1)).min(1),
})

const createPlayerSchema = z.object({
  newPlayer: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().nullable(),
    mobileNumber: z.string().optional().nullable(),
    age: z.number().int().positive().optional().nullable(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  }),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined

    const where: any = { tournamentId: params.tournamentId }

    if (search) {
      where.player = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { mobileNumber: { contains: search } },
        ],
      }
    }

    const tournamentPlayers = await prisma.tournamentPlayer.findMany({
      where,
      include: {
        player: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const players = tournamentPlayers.map((tp) => tp.player)

    return successResponse({ players })
  } catch (error) {
    console.error("Get tournament players error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.tournamentId },
    })
    if (!tournament) {
      return errorResponse("Tournament not found", 404)
    }

    const body = await request.json()

    // Try parsing as addPlayers (existing player IDs)
    const addPlayersResult = addPlayersSchema.safeParse(body)
    if (addPlayersResult.success) {
      const { playerIds } = addPlayersResult.data

      // Skip duplicates with skipDuplicates
      await prisma.tournamentPlayer.createMany({
        data: playerIds.map((playerId) => ({
          tournamentId: params.tournamentId,
          playerId,
        })),
        skipDuplicates: true,
      })

      return successResponse({ added: playerIds.length }, 201)
    }

    // Try parsing as createPlayer (new player)
    const createResult = createPlayerSchema.safeParse(body)
    if (createResult.success) {
      const { newPlayer } = createResult.data

      // Check for existing player: match by (name + email), (name + mobile), or name-only
      let existingPlayer = null

      if (newPlayer.email) {
        existingPlayer = await prisma.player.findFirst({
          where: {
            name: { equals: newPlayer.name, mode: "insensitive" },
            email: newPlayer.email,
          },
        })
      }

      if (!existingPlayer && newPlayer.mobileNumber) {
        existingPlayer = await prisma.player.findFirst({
          where: {
            name: { equals: newPlayer.name, mode: "insensitive" },
            mobileNumber: newPlayer.mobileNumber,
          },
        })
      }

      if (!existingPlayer) {
        existingPlayer = await prisma.player.findFirst({
          where: { name: { equals: newPlayer.name, mode: "insensitive" } },
        })
      }

      const player = existingPlayer || await prisma.player.create({
        data: {
          name: newPlayer.name,
          email: newPlayer.email || null,
          mobileNumber: newPlayer.mobileNumber || null,
          age: newPlayer.age || null,
          gender: newPlayer.gender || null,
        },
      })

      // Add to tournament (skip if already registered)
      await prisma.tournamentPlayer.create({
        data: {
          tournamentId: params.tournamentId,
          playerId: player.id,
        },
      }).catch((e: any) => {
        // Unique constraint violation - player already in tournament
        if (e.code !== "P2002") throw e
      })

      return successResponse({ player }, 201)
    }

    return errorResponse(
      "Invalid request body. Provide either { playerIds: string[] } or { newPlayer: { name, ... } }",
      400
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400)
    }
    console.error("Add tournament player error:", error)
    return errorResponse("Internal server error", 500)
  }
}
