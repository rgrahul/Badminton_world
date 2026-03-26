"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AuctionTeam } from "@/types/auction"

interface AuctionTeamCardProps {
  team: AuctionTeam
}

export function AuctionTeamCard({ team }: AuctionTeamCardProps) {
  const remaining = team.budget - team.spent
  const usedPercent = team.budget > 0 ? (team.spent / team.budget) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {team.soldPlayers.length} players
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Budget Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{remaining.toLocaleString()} / {team.budget.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                usedPercent > 90 ? "bg-red-500" : usedPercent > 70 ? "bg-amber-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Spent: {team.spent.toLocaleString()}</span>
            <span>{usedPercent.toFixed(0)}% used</span>
          </div>
        </div>

        {/* Player List */}
        {team.soldPlayers.length > 0 && (
          <div className="space-y-1.5">
            {team.soldPlayers.map((ap) => (
              <div
                key={ap.id}
                className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <PlayerAvatar name={ap.player.name} photoUrl={ap.player.profilePhoto} size="sm" />
                  <span className="truncate">{ap.player.name}</span>
                </div>
                <span className="font-semibold text-green-600 flex-shrink-0">
                  {ap.soldPrice?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
