"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AuctionPlayerWithDetails } from "@/types/auction"

interface AuctionPlayerGridProps {
  players: AuctionPlayerWithDetails[]
  onReset?: (playerId: string) => void
}

type StatusFilter = "ALL" | "AVAILABLE" | "SOLD" | "UNSOLD"

export function AuctionPlayerGrid({ players, onReset }: AuctionPlayerGridProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [genderFilter, setGenderFilter] = useState<string>("ALL")

  const filtered = players.filter((ap) => {
    if (statusFilter !== "ALL" && ap.status !== statusFilter) return false
    if (genderFilter !== "ALL" && ap.player.gender !== genderFilter) return false
    if (search && !ap.player.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusColors = {
    AVAILABLE: "bg-blue-100 text-blue-800",
    SOLD: "bg-green-100 text-green-800",
    UNSOLD: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex gap-1">
          {(["ALL", "AVAILABLE", "SOLD", "UNSOLD"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {["ALL", "MALE", "FEMALE"].map((g) => (
            <Button
              key={g}
              variant={genderFilter === g ? "default" : "outline"}
              size="sm"
              onClick={() => setGenderFilter(g)}
            >
              {g === "ALL" ? "All" : g.charAt(0) + g.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Player Grid */}
      <div className="text-sm text-muted-foreground">{filtered.length} players</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((ap) => (
          <Link key={ap.id} href={`/players/${ap.player.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <PlayerAvatar name={ap.player.name} photoUrl={ap.player.profilePhoto} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ap.player.name}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[ap.status]}`}>
                        {ap.status}
                      </span>
                      {ap.player.gender && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/10 text-gray-300">
                          {ap.player.gender}
                        </span>
                      )}
                      {ap.player.skillRating && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-300">
                          {ap.player.skillRating}
                        </span>
                      )}
                    </div>
                    {ap.status === "SOLD" && ap.soldToTeam && (
                      <div className="mt-1.5 text-xs">
                        <span className="text-green-600 font-semibold">{ap.soldPrice?.toLocaleString()}</span>
                        <span className="text-muted-foreground"> → {ap.soldToTeam.name}</span>
                      </div>
                    )}
                    {ap.status !== "AVAILABLE" && onReset && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 text-xs px-2"
                        onClick={(e) => { e.preventDefault(); onReset(ap.id) }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
