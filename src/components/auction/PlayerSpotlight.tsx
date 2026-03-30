"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AuctionPlayerWithDetails } from "@/types/auction"
import { SkillCategoryBadge } from "@/components/player/SkillCategoryBadge"

interface PlayerSpotlightProps {
  player: AuctionPlayerWithDetails | null
  currentBid: number
}

function categoryValue(gender: string): string {
  if (gender === "MALE") return "Mens"
  if (gender === "FEMALE") return "Womens"
  if (gender === "OTHER") return "Other"
  return gender
}

function InfoRow({
  label,
  children,
  alignValue = "start",
}: {
  label: string
  children: ReactNode
  alignValue?: "start" | "center"
}) {
  return (
    <div
      className={`flex gap-4 sm:gap-6 ${alignValue === "center" ? "items-center" : "items-start"}`}
    >
      <dt className="text-sm text-muted-foreground w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm font-medium text-foreground min-w-0 flex-1">{children}</dd>
    </div>
  )
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
          <PlayerAvatar
            name={p.name}
            photoUrl={p.profilePhoto}
            size="3xl"
            preferDriveFullImage
            frame="rounded"
          />
        </div>

        {/* Player Name */}
        <h2 className="text-2xl font-bold mb-2">{p.name}</h2>

        <dl className="w-full max-w-sm mx-auto space-y-3 mb-4 text-left">
          {p.gender && (
            <InfoRow label="Category">
              {categoryValue(p.gender)}
            </InfoRow>
          )}
          {p.age != null && <InfoRow label="Age">{p.age}</InfoRow>}
          <InfoRow label="Skill category" alignValue="center">
            {p.skillCategory ?
              <SkillCategoryBadge category={p.skillCategory} size="md" />
            : <span className="text-muted-foreground font-normal">—</span>}
          </InfoRow>
          {p.experience?.trim() && (
            <InfoRow label="Experience">
              <span className="font-normal whitespace-pre-wrap">{p.experience.trim()}</span>
            </InfoRow>
          )}
          {p.lastPlayed?.trim() && (
            <InfoRow label="Last played">
              <span className="font-normal whitespace-pre-wrap">{p.lastPlayed.trim()}</span>
            </InfoRow>
          )}
          {p.keyStrength?.trim() && (
            <InfoRow label="Key strength">
              <span className="font-normal whitespace-pre-wrap">{p.keyStrength.trim()}</span>
            </InfoRow>
          )}
        </dl>

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
