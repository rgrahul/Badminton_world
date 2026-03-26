import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

/**
 * Health Check Endpoint
 *
 * Returns application health status including:
 * - Application uptime
 * - Database connectivity
 * - Timestamp
 *
 * Used by monitoring scripts and load balancers
 */
export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      application: "ok",
      database: "unknown",
    },
  }

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`
    healthCheck.checks.database = "ok"
  } catch (error) {
    healthCheck.status = "unhealthy"
    healthCheck.checks.database = "error"
    console.error("Health check - Database error:", error)

    return NextResponse.json(healthCheck, { status: 503 })
  }

  return NextResponse.json(healthCheck, { status: 200 })
}
