import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"
import { skillCategoryEnumSchema } from "@/lib/skillCategory"
import { optionalExperienceSchema } from "@/lib/playerExperience"

const createPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  experience: optionalExperienceSchema,
  skillCategory: skillCategoryEnumSchema.optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = createPlayerSchema.parse(body)

    const player = await PlayerRepository.create(validatedData)

    return successResponse({ player }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Create player error:", error)
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

    const filters = {
      search: searchParams.get("search") || undefined,
      gender: searchParams.get("gender") as "MALE" | "FEMALE" | "OTHER" | undefined,
      minAge: searchParams.get("minAge") ? parseInt(searchParams.get("minAge")!) : undefined,
      maxAge: searchParams.get("maxAge") ? parseInt(searchParams.get("maxAge")!) : undefined,
      skillCategory: (() => {
        const raw = searchParams.get("skillCategory")
        if (!raw) return undefined
        const r = skillCategoryEnumSchema.safeParse(raw)
        return r.success ? r.data : undefined
      })(),
    }

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50

    const result = await PlayerRepository.findAll(filters, page, limit)

    return successResponse({
      players: result.players,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error("Get players error:", error)
    return errorResponse("Internal server error", 500)
  }
}
