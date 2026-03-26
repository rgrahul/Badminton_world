import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { TournamentRepository } from "@/lib/db/repositories/TournamentRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"

const createTournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  description: z.string().optional(),
  dateFrom: z.string(),
  dateTo: z.string(),
  organizerName: z.string().min(1, "Organizer name is required"),
  organizerEmail: z.string().email().optional().or(z.literal("")),
  organizerPhone: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  titlePhoto: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  requiresTeams: z.boolean().optional(),
  format: z.enum(["CUSTOM", "LEAGUE_KNOCKOUT", "KNOCKOUT_ONLY"]).optional(),
  numberOfGroups: z.number().int().min(2).max(26).optional(),
  qualifyPerGroup: z.number().int().min(1).max(8).optional(),
  defaultMenDoubles: z.number().int().min(0).optional(),
  defaultWomenDoubles: z.number().int().min(0).optional(),
  defaultMixedDoubles: z.number().int().min(0).optional(),
  defaultMenSingles: z.number().int().min(0).optional(),
  defaultWomenSingles: z.number().int().min(0).optional(),
  defaultKidsSingles: z.number().int().min(0).optional(),
  defaultKidsDoubles: z.number().int().min(0).optional(),
  defaultSetsCount: z.number().int().min(1).max(5).optional(),
  defaultPointsToWin: z.number().int().min(1).optional(),
  defaultDeuceCap: z.number().int().min(1).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createTournamentSchema.parse(body)

    const tournament = await TournamentRepository.create({
      ...validatedData,
      dateFrom: new Date(validatedData.dateFrom),
      dateTo: new Date(validatedData.dateTo),
      createdById: session.user.id,
    })

    return successResponse({ tournament }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Create tournament error:", error)
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
    const status = searchParams.get("status") || undefined
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined

    const tournaments = await TournamentRepository.findAll({
      status,
      limit,
      offset,
    })

    const total = await TournamentRepository.count({ status })

    return successResponse({ tournaments, total })
  } catch (error) {
    console.error("Get tournaments error:", error)
    return errorResponse("Internal server error", 500)
  }
}
