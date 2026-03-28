import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"

const bulkPlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).optional().nullable(),
  skillRating: z.number().int().min(1).max(100).optional().nullable(),
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

    // Validate the array of players
    const validatedPlayers = bulkUploadSchema.parse(body.players)

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
