"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AuctionPlayerWithDetails } from "@/types/auction"

interface PlayerSpotlightProps {
  player: AuctionPlayerWithDetails | null
  currentBid: number
}

export function PlayerSpotlight({ player, currentBid }: PlayerSpotlightProps) {
  if (!player) {
    return (
      <Card className="h-full border-white/10 bg-white/[0.03]">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <h3 className="text-lg font-semibold text-gray-500">No Player Selected</h3>
          <p className="text-sm text-gray-500 mt-2">
            Select a player from the queue to start the auction
          </p>
        </CardContent>
      </Card>
    )
  }

  const { player: p } = player

  return (
    <Card className="h-full border-2 border-emerald-500/50 bg-white/[0.03]">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* Player Photo */}
        <div className="mb-4">
          <PlayerAvatar name={p.name} photoUrl={p.profilePhoto} size="2xl" />
        </div>

        {/* Player Name */}
        <h2 className="text-2xl font-bold mb-2 text-white">{p.name}</h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {p.gender && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              p.gender === "MALE" ? "bg-cyan-500/20 text-cyan-300" :
              p.gender === "FEMALE" ? "bg-pink-500/20 text-pink-300" :
              "bg-white/10 text-gray-300"
            }`}>
              {p.gender}
            </span>
          )}
          {p.age && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/10 text-gray-300">
              Age: {p.age}
            </span>
          )}
          {p.skillRating && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300">
              Skill: {p.skillRating}
            </span>
          )}
          {p.yearsOfExperience && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300">
              {p.yearsOfExperience}yr exp
            </span>
          )}
        </div>

        {/* Base Price */}
        <div className="text-sm text-gray-500 mb-1">Base Price</div>
        <div className="text-lg font-semibold text-gray-400 mb-3">
          {player.basePrice.toLocaleString()}
        </div>

        {/* Current Bid */}
        <div className="text-sm text-emerald-400 font-medium mb-1">Current Bid</div>
        <div className="text-4xl font-black text-emerald-400">
          {currentBid.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
