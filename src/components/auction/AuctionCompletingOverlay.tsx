"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const MESSAGES = [
  "Sealing the final results…",
  "Registering sold players with the tournament…",
  "Forming tournament teams and rosters…",
  "Syncing winning bids to team budgets…",
  "Almost there…",
]

export function AuctionCompletingOverlay({ open }: { open: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setMessageIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 2600)
    return () => window.clearInterval(id)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/88 backdrop-blur-md"
      role="alertdialog"
      aria-busy="true"
      aria-live="polite"
      aria-label="Completing auction"
    >
      <div className="mx-4 flex max-w-md flex-col items-center gap-6 rounded-2xl border bg-card/95 px-8 py-10 text-center shadow-2xl ring-1 ring-violet-500/20">
        <div className="rounded-full bg-violet-500/10 p-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">Completing auction</h2>
          <p
            key={messageIndex}
            className="min-h-[3rem] text-sm leading-relaxed text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
          >
            {MESSAGES[messageIndex]}
          </p>
        </div>
        <div className="w-full max-w-[280px]">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full w-[38%] rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 shadow-sm motion-safe:animate-auction-bar"
              aria-hidden
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Please keep this tab open</p>
        </div>
      </div>
    </div>
  )
}
