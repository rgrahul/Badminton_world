import { NextResponse } from "next/server"
import { UserRepository } from "@/lib/db/repositories/UserRepository"

export async function GET() {
  try {
    console.log("Testing auth...")

    // Test database connection
    const user = await UserRepository.findByEmail("umpire@example.com")
    console.log("User found:", user ? "Yes" : "No")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Test password verification
    console.log("Testing password verification...")
    const verified = await UserRepository.verifyPassword("umpire@example.com", "password123")
    console.log("Password verified:", verified ? "Yes" : "No")

    return NextResponse.json({
      success: true,
      userExists: !!user,
      passwordValid: !!verified,
    })
  } catch (error) {
    console.error("Test auth error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
