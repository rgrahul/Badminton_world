import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Allow auth routes always
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // For API write methods (POST, PATCH, PUT, DELETE), check role
  if (pathname.startsWith("/api") && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      console.warn(
        "[Middleware] No token found for:",
        pathname,
        "- NEXTAUTH_SECRET:",
        process.env.NEXTAUTH_SECRET ? "SET" : "MISSING"
      )
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Middleware] Token found with role:", token.role)

    if (token.role === "PLAYER") {
      return NextResponse.json(
        { success: false, error: "You do not have permission to perform this action" },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
