"use client"

import { Card, CardContent } from "@/components/ui/card"

interface ServerIndicatorProps {
  servingSide: string
  serverName: string
  scoreA?: number
  scoreB?: number
}

export function ServerIndicator({ servingSide, serverName, scoreA, scoreB }: ServerIndicatorProps) {
  const serverScore = servingSide === "A" ? (scoreA ?? 0) : (scoreB ?? 0)
  const courtSide = serverScore % 2 === 0 ? "Right" : "Left"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-black text-white shadow-lg">
            {serverName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <div className="text-sm text-muted-foreground">Current Server</div>
            <div className="text-lg font-bold">{serverName}</div>
            <div className="text-xs text-muted-foreground">
              Serving from <span className="font-semibold text-foreground">{courtSide} Court</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
