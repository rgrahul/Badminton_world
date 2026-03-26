"use client"

import { SessionProvider } from "next-auth/react"
import { GlobalAlertDialog } from "@/components/ui/GlobalAlertDialog"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <GlobalAlertDialog />
    </SessionProvider>
  )
}
