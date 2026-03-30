"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useState } from "react"
import { AuctionPlayerWithDetails } from "@/types/auction"
import { SkillCategoryBadge } from "@/components/player/SkillCategoryBadge"
import {
  type SkillCategoryFilter,
  matchesSkillCategoryFilter,
  SKILL_CATEGORY_FILTER_OPTIONS,
  skillCategoryFilterLabel,
} from "@/lib/skillCategory"

interface PlayerQueueProps {
  players: AuctionPlayerWithDetails[]
  currentPlayerId: string | null
  onSelectPlayer: (player: AuctionPlayerWithDetails) => void
}

export function PlayerQueue({ players, currentPlayerId, onSelectPlayer }: PlayerQueueProps) {
  const [search, setSearch] = useState("")
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<SkillCategoryFilter>("ALL")

  const availablePlayers = players.filter((p) => p.status === "AVAILABLE")
  const filtered = availablePlayers.filter((p) => {
    if (!matchesSkillCategoryFilter(skillCategoryFilter, p.player.skillCategory)) return false
    if (search && !p.player.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Player Queue</CardTitle>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filtered.length} of {availablePlayers.length} available
        </p>
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />
        <div className="flex gap-1 flex-wrap mt-2">
          {SKILL_CATEGORY_FILTER_OPTIONS.map((f) => (
            <Button
              key={f}
              variant={skillCategoryFilter === f ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setSkillCategoryFilter(f)}
            >
              {skillCategoryFilterLabel(f)}
            </Button>
          ))}
        </div>
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
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={ap.player.name} photoUrl={ap.player.profilePhoto} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ap.player.name}</div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      {ap.player.gender && <span>{ap.player.gender}</span>}
                      <SkillCategoryBadge category={ap.player.skillCategory} size="sm" />
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
