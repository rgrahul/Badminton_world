"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ScoreButtonProps {
  side: "A" | "B"
  playerName: string
  player2Name?: string
  onScore: (side: "A" | "B") => void
  disabled?: boolean
}

export function ScoreButton({ side, playerName, player2Name, onScore, disabled }: ScoreButtonProps) {
  const colorClass = side === "A" ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <Button
          size="lg"
          className="w-full h-auto py-6 text-xl"
          onClick={() => onScore(side)}
          disabled={disabled}
          variant={side === "A" ? "default" : "secondary"}
        >
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0`}>
                {playerName.charAt(0).toUpperCase()}
              </div>
              <div className="text-lg font-bold text-left">{playerName}</div>
            </div>
            {player2Name && (
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0`}>
                  {player2Name.charAt(0).toUpperCase()}
                </div>
                <div className="text-lg font-bold text-left">{player2Name}</div>
              </div>
            )}
          </div>
        </Button>
      </CardContent>
    </Card>
  )
}
