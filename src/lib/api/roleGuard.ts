import { auth } from "@/lib/auth"
import { errorResponse } from "@/lib/api/responses"

/**
 * Check if the current user has write (manage) permissions.
 * Returns null if authorized, or an error Response if not.
 * ADMIN and UMPIRE can write; PLAYER is read-only.
 */
export async function requireManageRole() {
  const session = await auth()
  if (!session?.user) {
    return errorResponse("Unauthorized", 401)
  }
  if (session.user.role === "PLAYER") {
    return errorResponse("You do not have permission to perform this action", 403)
  }
  return null // authorized
}
