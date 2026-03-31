"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useState } from "react"
import { AuctionPlayerWithDetails } from "@/types/auction"

interface PlayerQueueProps {
  players: AuctionPlayerWithDetails[]
  currentPlayerId: string | null
  onSelectPlayer: (player: AuctionPlayerWithDetails) => void
}

export function PlayerQueue({ players, currentPlayerId, onSelectPlayer }: PlayerQueueProps) {
  const [search, setSearch] = useState("")

  const availablePlayers = players.filter((p) => p.status === "AVAILABLE")
  const filtered = search
    ? availablePlayers.filter((p) =>
        p.player.name.toLowerCase().includes(search.toLowerCase())
      )
    : availablePlayers

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Player Queue ({availablePlayers.length})</CardTitle>
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {availablePlayers.length === 0 ? "No available players" : "No matches found"}
          </p>
        ) : (
          filtered.map((ap) => {
            const isActive = currentPlayerId === ap.id
            return (
              <button
                key={ap.id}
                onClick={() => onSelectPlayer(ap)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/50"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={ap.player.name} photoUrl={ap.player.profilePhoto} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ap.player.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {ap.player.gender && <span>{ap.player.gender}</span>}
                      {ap.player.skillRating && <span>Skill: {ap.player.skillRating}</span>}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-right flex-shrink-0">
                    {ap.basePrice.toLocaleString()}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
