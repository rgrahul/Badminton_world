"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  yearsOfExperience?: number | null
  skillRating?: number | null
  profilePhoto?: string | null
  createdAt: string
  updatedAt: string
}

interface MatchEntry {
  id: string
  name: string
  type: string
  status: string
  winningSide?: string | null
  setsWonBySideA: number
  setsWonBySideB: number
  playerSide: string
  result: string
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

interface TypeStats {
  played: number
  wins: number
  losses: number
  winPercentage: number
}

interface ServiceStats {
  totalServes: number
  pointsWon: number
  pointsLost: number
  winPercentage: number
}

interface BreakStats {
  totalOpponentServes: number
  breaksWon: number
  breaksLost: number
  breakPercentage: number
}

interface Stats {
  summary: {
    totalMatches: number
    totalWins: number
    totalLosses: number
    winPercentage: number
    serviceStats: ServiceStats
    breakStats: BreakStats
    byType: {
      SINGLES: TypeStats
      DOUBLES: TypeStats
    }
  }
  matches: MatchEntry[]
  recentForm: string[]
}

export default function PlayerDetailPage({ params }: { params: { playerId: string } }) {
  const router = useRouter()
  const { isAdmin } = useRole()
  const { alert, confirmDelete } = useAlertDialog()
  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [resultFilter, setResultFilter] = useState<string>("all")
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchPlayer()
    fetchStats()
  }, [params.playerId])

  useEffect(() => {
    fetchStats()
  }, [typeFilter, resultFilter, showAll])

  const fetchPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${params.playerId}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to fetch player")
      setPlayer(data.data.player)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const p = new URLSearchParams()
      p.set("limit", showAll ? "200" : "10")
      if (typeFilter !== "all") p.set("type", typeFilter)
      if (resultFilter !== "all") p.set("result", resultFilter)

      const response = await fetch(`/api/players/${params.playerId}/stats?${p.toString()}`)
      const data = await response.json()
      if (response.ok) setStats(data.data)
    } catch (err) {
      console.error("Stats fetch error:", err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete("Are you sure you want to delete this player?")
    if (!confirmed) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/players/${params.playerId}`, { method: "DELETE" })
      if (response.ok) router.push("/players")
      else alert("Failed to delete player", "Error")
    } catch { alert("An error occurred", "Error") }
    finally { setIsDeleting(false) }
  }

  const getGenderBadge = (gender?: string | null) => {
    if (!gender) return null
    const colors: Record<string, string> = {
      MALE: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
      FEMALE: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
      OTHER: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[gender] ?? "bg-white/10 text-gray-300"}`}>
        {gender}
      </span>
    )
  }

  const getResultBadge = (result: string) => {
    const map: Record<string, string> = {
      WIN: "bg-emerald-500/20 text-emerald-300",
      LOSS: "bg-red-500/20 text-red-300",
      IN_PROGRESS: "bg-cyan-500/20 text-cyan-300",
      NOT_STARTED: "bg-gray-500/20 text-gray-300",
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[result] ?? "bg-white/10 text-gray-300"}`}>
        {result.replace("_", " ")}
      </span>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8"><div className="text-center text-gray-400">Loading player...</div></main>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8"><div className="text-center text-red-400">{error || "Player not found"}</div></main>
      </div>
    )
  }

  const s = stats?.summary

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-5xl">
        {/* Top bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/players")} className="text-gray-400 hover:text-white hover:bg-white/10">
            &larr; Back to Players
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Link href={`/players/${player.id}/edit`}>
                <Button variant="ghost" className="border border-white/10 hover:bg-white/5 text-gray-300" size="sm">Edit</Button>
              </Link>
              <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 border border-red-500/20" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        {/* Player Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <PlayerAvatar name={player.name} photoUrl={player.profilePhoto} size="2xl" />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{player.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
              {player.gender && getGenderBadge(player.gender)}
              {player.age && <span className="text-sm text-gray-400">Age: {player.age}</span>}
              {player.yearsOfExperience != null && <span className="text-sm text-gray-400">{player.yearsOfExperience}y exp</span>}
              {player.skillRating && <span className="text-sm text-amber-400">Skill: {player.skillRating}</span>}
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400 justify-center sm:justify-start">
                {player.email && <span>{player.email}</span>}
                {player.mobileNumber && <span>{player.mobileNumber}</span>}
              </div>
            )}
            {/* Recent Form */}
            {stats && stats.recentForm.length > 0 && (
              <div className="flex items-center gap-1.5 mt-4 justify-center sm:justify-start">
                <span className="text-xs text-gray-500 mr-1">Form:</span>
                {stats.recentForm.map((r, i) => (
                  <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r === "W" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary Cards */}
        {s && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-white">{s.totalMatches}</div>
                <div className="text-xs text-gray-400 mt-1">Total Matches</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">{s.totalWins}</div>
                <div className="text-xs text-gray-400 mt-1">Wins</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{s.totalLosses}</div>
                <div className="text-xs text-gray-400 mt-1">Losses</div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">{s.winPercentage}%</div>
                <div className="text-xs text-gray-400 mt-1">Win Rate</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Win Rate Bar + Type Breakdown + Service Stats */}
        {s && s.totalMatches > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Win/Loss Bar */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-300">Win / Loss Ratio</CardTitle></CardHeader>
              <CardContent>
                <div className="w-full h-4 rounded-full bg-white/10 overflow-hidden flex">
                  {s.totalWins > 0 && (
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(s.totalWins / (s.totalWins + s.totalLosses || 1)) * 100}%` }} />
                  )}
                  {s.totalLosses > 0 && (
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${(s.totalLosses / (s.totalWins + s.totalLosses || 1)) * 100}%` }} />
                  )}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span className="text-emerald-400">{s.totalWins}W</span>
                  <span className="text-red-400">{s.totalLosses}L</span>
                </div>
              </CardContent>
            </Card>

            {/* Singles Stats */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-300">Singles</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{s.byType.SINGLES.played}</div>
                <div className="text-xs text-gray-400 mb-2">matches played</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400">{s.byType.SINGLES.wins}W</span>
                  <span className="text-red-400">{s.byType.SINGLES.losses}L</span>
                  <span className="text-cyan-400 ml-auto">{s.byType.SINGLES.winPercentage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Doubles Stats */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-300">Doubles</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{s.byType.DOUBLES.played}</div>
                <div className="text-xs text-gray-400 mb-2">matches played</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-emerald-400">{s.byType.DOUBLES.wins}W</span>
                  <span className="text-red-400">{s.byType.DOUBLES.losses}L</span>
                  <span className="text-cyan-400 ml-auto">{s.byType.DOUBLES.winPercentage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Service Stats */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-300">Service Points</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{s.serviceStats.totalServes}</div>
                <div className="text-xs text-gray-400 mb-3">total serves</div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex mb-2">
                  {s.serviceStats.pointsWon > 0 && (
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${s.serviceStats.winPercentage}%` }} />
                  )}
                  {s.serviceStats.pointsLost > 0 && (
                    <div className="h-full bg-red-500 transition-all" style={{ width: `${100 - s.serviceStats.winPercentage}%` }} />
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">{s.serviceStats.pointsWon} won</span>
                  <span className="text-xs text-gray-500">{s.serviceStats.winPercentage}%</span>
                  <span className="text-red-400">{s.serviceStats.pointsLost} lost</span>
                </div>
              </CardContent>
            </Card>

            {/* Service Break Stats */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-300">Service Breaks</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{s.breakStats.totalOpponentServes}</div>
                <div className="text-xs text-gray-400 mb-3">opponent serves faced</div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex mb-2">
                  {s.breakStats.breaksWon > 0 && (
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${s.breakStats.breakPercentage}%` }} />
                  )}
                  {s.breakStats.breaksLost > 0 && (
                    <div className="h-full bg-gray-500 transition-all" style={{ width: `${100 - s.breakStats.breakPercentage}%` }} />
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-400">{s.breakStats.breaksWon} broken</span>
                  <span className="text-xs text-gray-500">{s.breakStats.breakPercentage}%</span>
                  <span className="text-gray-400">{s.breakStats.breaksLost} held</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Match History */}
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg text-white">Match History</CardTitle>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="SINGLES">Singles</SelectItem>
                    <SelectItem value="DOUBLES">Doubles</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={resultFilter} onValueChange={setResultFilter}>
                  <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="WIN">Wins</SelectItem>
                    <SelectItem value="LOSS">Losses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading match history...</div>
            ) : !stats || stats.matches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No matches found</div>
            ) : (
              <>
                <div className="space-y-2">
                  {stats.matches.map((match) => (
                    <Link key={match.id} href={`/matches/${match.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer">
                        {/* Result indicator */}
                        <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
                          match.result === "WIN" ? "bg-emerald-500" :
                          match.result === "LOSS" ? "bg-red-500" :
                          match.result === "IN_PROGRESS" ? "bg-cyan-500" : "bg-gray-500"
                        }`} />

                        {/* Match info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm truncate">{match.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">{match.type}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatDate(match.completedAt || match.startedAt || match.createdAt)}
                            <span className="mx-1.5">·</span>
                            Side {match.playerSide}
                          </div>
                        </div>

                        {/* Score */}
                        {match.status !== "NOT_STARTED" && (
                          <div className="flex items-center gap-1.5 text-sm font-mono flex-shrink-0">
                            <span className={match.playerSide === "A" ? "text-white font-bold" : "text-gray-400"}>{match.setsWonBySideA}</span>
                            <span className="text-gray-600">-</span>
                            <span className={match.playerSide === "B" ? "text-white font-bold" : "text-gray-400"}>{match.setsWonBySideB}</span>
                          </div>
                        )}

                        {/* Result badge */}
                        {getResultBadge(match.result)}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View All / Show Less toggle */}
                {!showAll && stats.summary.totalMatches > 10 && (
                  <div className="text-center mt-4">
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" onClick={() => setShowAll(true)}>
                      View All ({stats.summary.totalMatches} matches)
                    </Button>
                  </div>
                )}
                {showAll && (
                  <div className="text-center mt-4">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10" onClick={() => setShowAll(false)}>
                      Show Less
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <div className="mt-6 text-xs text-gray-600 flex gap-4 justify-center">
          <span>Joined: {formatDate(player.createdAt)}</span>
          <span>Updated: {formatDate(player.updatedAt)}</span>
        </div>
      </main>
    </div>
  )
}
