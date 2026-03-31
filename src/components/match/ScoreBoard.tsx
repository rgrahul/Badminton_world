"use client"

import { Card, CardContent } from "@/components/ui/card"

interface ScoreBoardProps {
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  currentSetScoreA: number
  currentSetScoreB: number
  setsWonBySideA: number
  setsWonBySideB: number
  currentSetNumber: number
  sets: Array<{
    setNumber: number
    scoreA: number
    scoreB: number
    winningSide?: string | null
  }>
}

export function ScoreBoard({
  sideAPlayer1,
  sideAPlayer2,
  sideBPlayer1,
  sideBPlayer2,
  currentSetScoreA,
  currentSetScoreB,
  setsWonBySideA,
  setsWonBySideB,
  currentSetNumber,
  sets,
}: ScoreBoardProps) {
  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="p-8">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Team A */}
            <div className="flex justify-end">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-400">Sets Won: {setsWonBySideA}</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg font-black text-white shadow-lg flex-shrink-0">
                    {sideAPlayer1.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-white">{sideAPlayer1}</div>
                </div>
                {sideAPlayer2 && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg font-black text-white shadow-lg flex-shrink-0">
                      {sideAPlayer2.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-lg font-bold text-white">{sideAPlayer2}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Score */}
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Set {currentSetNumber}</div>
              <div className="text-7xl font-bold tabular-nums text-white">
                {currentSetScoreA} - {currentSetScoreB}
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-start gap-2">
              <div className="text-sm text-gray-400">Sets Won: {setsWonBySideB}</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-lg font-black text-white shadow-lg flex-shrink-0">
                  {sideBPlayer1.charAt(0).toUpperCase()}
                </div>
                <div className="text-lg font-bold text-white">{sideBPlayer1}</div>
              </div>
              {sideBPlayer2 && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-lg font-black text-white shadow-lg flex-shrink-0">
                    {sideBPlayer2.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-lg font-bold text-white">{sideBPlayer2}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Set History */}
      {sets.length > 0 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-4">
            <div className="text-sm font-medium mb-3 text-gray-300">Set History</div>
            <div className="space-y-2">
              {sets.map((set) => (
                <div key={set.setNumber} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Set {set.setNumber}</span>
                  <div className="flex items-center gap-4">
                    <span className={set.winningSide === "A" ? "font-bold text-emerald-400" : "text-gray-300"}>
                      {set.scoreA}
                    </span>
                    <span className="text-gray-500">-</span>
                    <span className={set.winningSide === "B" ? "font-bold text-cyan-400" : "text-gray-300"}>
                      {set.scoreB}
                    </span>
                    {set.winningSide && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({set.winningSide === "A" ? sideAPlayer1 : sideBPlayer1}{" "}
                        {set.winningSide === "A" && sideAPlayer2 ? `& ${sideAPlayer2}` : ""}
                        {set.winningSide === "B" && sideBPlayer2 ? `& ${sideBPlayer2}` : ""} won)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
