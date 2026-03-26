"use client"

import { useSession } from "next-auth/react"

export function useRole() {
  const { data: session } = useSession()
  const role = session?.user?.role

  return {
    role,
    isAdmin: role === "ADMIN",
    isUmpire: role === "UMPIRE",
    isPlayer: role === "PLAYER",
    canManage: role === "ADMIN" || role === "UMPIRE", // can create/edit/delete
    isReadOnly: role === "PLAYER",
  }
}
