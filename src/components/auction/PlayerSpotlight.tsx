"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AuctionPlayerWithDetails } from "@/types/auction"
import { SkillCategoryBadge } from "@/components/player/SkillCategoryBadge"

interface PlayerSpotlightProps {
  player: AuctionPlayerWithDetails | null
  currentBid: number
}

export function PlayerSpotlight({ player, currentBid }: PlayerSpotlightProps) {
  if (!player) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="text-4xl mb-4">🏸</div>
          <h3 className="text-lg font-semibold text-muted-foreground">No Player Selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Select a player from the queue to start the auction
          </p>
        </CardContent>
      </Card>
    )
  }

  const { player: p } = player

  return (
    <Card className="h-full border-2 border-primary">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* Player Photo */}
        <div className="mb-4">
          <PlayerAvatar name={p.name} photoUrl={p.profilePhoto} size="2xl" />
        </div>

        {/* Player Name */}
        <h2 className="text-2xl font-bold mb-2">{p.name}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {p.gender && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              p.gender === "MALE" ? "bg-blue-100 text-blue-800" :
              p.gender === "FEMALE" ? "bg-pink-100 text-pink-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {p.gender}
            </span>
          )}
          {p.age && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
              Age: {p.age}
            </span>
          )}
          <SkillCategoryBadge category={p.skillCategory} size="md" />
          {p.yearsOfExperience && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
              {p.yearsOfExperience}yr exp
            </span>
          )}
        </div>

        {/* Base Price */}
        <div className="text-sm text-muted-foreground mb-1">Base Price</div>
        <div className="text-lg font-semibold text-muted-foreground mb-3">
          {player.basePrice.toLocaleString()}
        </div>

        {/* Current Bid */}
        <div className="text-sm text-primary font-medium mb-1">Current Bid</div>
        <div className="text-4xl font-black text-primary">
          {currentBid.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
