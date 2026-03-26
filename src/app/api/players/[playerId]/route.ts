import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { PlayerRepository } from "@/lib/db/repositories/PlayerRepository"
import { errorResponse, successResponse } from "@/lib/api/responses"
import { z } from "zod"

const updatePlayerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  mobileNumber: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  yearsOfExperience: z.number().int().min(0).optional().nullable(),
  skillRating: z.number().int().min(1).max(100).optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { playerId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const player = await PlayerRepository.findById(params.playerId)

    if (!player) {
      return errorResponse("Player not found", 404)
    }

    return successResponse({ player })
  } catch (error) {
    console.error("Get player error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { playerId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    const body = await request.json()
    const validatedData = updatePlayerSchema.parse(body)

    const player = await PlayerRepository.update(params.playerId, validatedData)

    return successResponse({ player })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message)
    }

    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Update player error:", error)
    return errorResponse("Internal server error", 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { playerId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    await PlayerRepository.delete(params.playerId)

    return successResponse({ message: "Player deleted successfully" })
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Delete player error:", error)
    return errorResponse("Internal server error", 500)
  }
}
