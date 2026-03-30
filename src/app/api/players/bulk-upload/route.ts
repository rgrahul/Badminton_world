import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"
import { optionalImportedSkillCategorySchema } from "@/lib/skillCategory"
import { optionalExperienceSchema } from "@/lib/playerExperience"

const bulkPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  experience: optionalExperienceSchema,
  skillCategory: optionalImportedSkillCategorySchema,
  profilePhoto: z.string().optional().nullable(),
})

const bulkUploadSchema = z.array(bulkPlayerSchema)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    if (session.user.role !== "ADMIN") {
      return errorResponse("Only admins can perform bulk uploads", 403)
    }

    const body = await request.json()

    const rows = (body.players as Record<string, unknown>[]).map((row) => ({
      ...row,
      skillCategory: row.skillCategory ?? row.skillRating,
      experience:
        row.experience ??
        row.Experience ??
        row.yearsOfExperience ??
        row.YearsOfExperience,
    }))

    const validatedPlayers = bulkUploadSchema.parse(rows)

    // Bulk create players
    const result = await PlayerRepository.bulkCreate(validatedPlayers)

    return successResponse(
      {
        message: `Successfully created ${result.count} players`,
        count: result.count,
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(`Validation error: ${error.errors[0].message}`)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Bulk upload error:", error)
    return errorResponse("Internal server error", 500)
  }
}
