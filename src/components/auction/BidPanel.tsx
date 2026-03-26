"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuctionTeam, AuctionPlayerWithDetails, BidHistoryEntry } from "@/types/auction"

interface BidPanelProps {
  teams: AuctionTeam[]
  currentPlayer: AuctionPlayerWithDetails | null
  currentBid: number
  selectedTeamId: string | null
  bidHistory: BidHistoryEntry[]
  onBidChange: (amount: number) => void
  onTeamSelect: (teamId: string) => void
  onSold: () => void
  onUnsold: () => void
  selling: boolean
}

const QUICK_ADD = [
  { label: "+1K", value: 1000 },
  { label: "+2K", value: 2000 },
  { label: "+5K", value: 5000 },
  { label: "+10K", value: 10000 },
]

export function BidPanel({
  teams,
  currentPlayer,
  currentBid,
  selectedTeamId,
  bidHistory,
  onBidChange,
  onTeamSelect,
  onSold,
  onUnsold,
  selling,
}: BidPanelProps) {
  const [customBid, setCustomBid] = useState("")

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const canSell = currentPlayer && selectedTeamId && currentBid > 0 &&
    selectedTeam && (selectedTeam.budget - selectedTeam.spent) >= currentBid

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Bid Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Team Selector */}
        <div>
          <div className="text-sm font-medium mb-2">Select Team</div>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((team) => {
              const remaining = team.budget - team.spent
              const isSelected = selectedTeamId === team.id
              const canAfford = remaining >= currentBid
              return (
                <button
                  key={team.id}
                  onClick={() => onTeamSelect(team.id)}
                  disabled={!currentPlayer}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-gray-200 hover:border-gray-300"
                  } ${!currentPlayer ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
                    !canAfford && currentPlayer ? "opacity-60" : ""
                  }`}
                >
                  <div className="font-medium text-sm truncate">{team.name}</div>
                  <div className={`text-xs ${remaining < currentBid ? "text-red-500" : "text-muted-foreground"}`}>
                    {remaining.toLocaleString()} left
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bid Controls */}
        <div>
          <div className="text-sm font-medium mb-2">Bid Amount</div>
          <div className="flex gap-2 mb-2">
            {QUICK_ADD.map((q) => (
              <Button
                key={q.label}
                variant="outline"
                size="sm"
                disabled={!currentPlayer}
                onClick={() => onBidChange(currentBid + q.value)}
                className="flex-1"
              >
                {q.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom bid"
              value={customBid}
              onChange={(e) => setCustomBid(e.target.value)}
              disabled={!currentPlayer}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!currentPlayer || !customBid}
              onClick={() => {
                const val = parseInt(customBid)
                if (val > 0) {
                  onBidChange(val)
                  setCustomBid("")
                }
              }}
            >
              Set
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!canSell || selling}
            onClick={onSold}
          >
            {selling ? "Selling..." : "Sold!"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={!currentPlayer || selling}
            onClick={onUnsold}
          >
            Unsold
          </Button>
        </div>

        {/* Bid History */}
        <div className="flex-1 min-h-0">
          <div className="text-sm font-medium mb-2">Recent Activity</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {bidHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet</p>
            ) : (
              bidHistory.slice(0, 20).map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs p-2 bg-gray-50 rounded flex justify-between items-center"
                >
                  <span>
                    <span className="font-medium">{entry.playerName}</span>
                    {" → "}
                    <span className="text-primary">{entry.teamName}</span>
                  </span>
                  <span className="font-bold">{entry.amount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
