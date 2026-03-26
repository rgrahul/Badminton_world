import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { MatchRepository } from "@/lib/db/repositories/MatchRepository"
import { SetRepository } from "@/lib/db/repositories/SetRepository"
import { MatchValidator } from "@/lib/scoring-engine/MatchValidator"
import { ScoringRules } from "@/lib/scoring-engine/ScoringRules"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"
import type { MatchType } from "@prisma/client"

const createMatchSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["SINGLES", "DOUBLES"]),
  sideAPlayer1: z.string().min(1).max(100),
  sideAPlayer2: z.string().max(100).optional(),
  sideBPlayer1: z.string().min(1).max(100),
  sideBPlayer2: z.string().max(100).optional(),
  setsCount: z.number().int().positive().default(3),
  pointsToWin: z.number().int().positive().default(21),
  deuceCap: z.number().int().positive().default(30),
  tournamentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createMatchSchema.parse(body)

    // Validate players
    const players = {
      sideA: {
        player1: validatedData.sideAPlayer1,
        player2: validatedData.sideAPlayer2,
      },
      sideB: {
        player1: validatedData.sideBPlayer1,
        player2: validatedData.sideBPlayer2,
      },
    }

    const playersValidation = MatchValidator.validatePlayers(players, validatedData.type)
    if (!playersValidation.valid) {
      return errorResponse(playersValidation.error!)
    }

    // Validate config
    const config = {
      setsCount: validatedData.setsCount,
      pointsToWin: validatedData.pointsToWin,
      deuceCap: validatedData.deuceCap,
    }
    const configValidation = ScoringRules.validateConfig(config)
    if (!configValidation.valid) {
      return errorResponse(configValidation.error!)
    }

    // Create match
    const match = await MatchRepository.create({
      name: validatedData.name,
      type: validatedData.type,
      setsCount: validatedData.setsCount,
      pointsToWin: validatedData.pointsToWin,
      deuceCap: validatedData.deuceCap,
      sideAPlayer1: validatedData.sideAPlayer1,
      sideAPlayer2: validatedData.sideAPlayer2,
      sideBPlayer1: validatedData.sideBPlayer1,
      sideBPlayer2: validatedData.sideBPlayer2,
      umpireId: session.user.id,
      tournamentId: validatedData.tournamentId,
    })

    // Create initial set
    await SetRepository.create({
      matchId: match.id,
      setNumber: 1,
    })

    return successResponse({ match }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }

    console.error("Create match error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | null
    const type = searchParams.get("type") as MatchType | null
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters: any = {}
    if (status) filters.status = status
    if (type) filters.type = type
    if (search) filters.search = search

    const { matches, total } = await MatchRepository.list(filters, {
      skip: (page - 1) * limit,
      take: limit,
    })

    return successResponse({
      matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("List matches error:", error)
    return errorResponse("Internal server error", 500)
  }
}
