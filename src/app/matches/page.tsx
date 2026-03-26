"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlayerLink } from "@/components/player/PlayerLink"
import { useRole } from "@/hooks/useRole"

function MatchAvatar({ name, src, color }: { name: string; src?: string | null; color: "green" | "blue" }) {
  const [error, setError] = useState(false)
  const gradient = color === "green" ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600"
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-black text-white shadow-md flex-shrink-0 overflow-hidden`}>
      {src && !error ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

interface Match {
  id: string
  name: string
  type: string
  status: string
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  sideAPlayer1Photo?: string | null
  sideAPlayer2Photo?: string | null
  sideBPlayer1Photo?: string | null
  sideBPlayer2Photo?: string | null
  setsWonBySideA: number
  setsWonBySideB: number
  winningSide?: string | null
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
}

export default function MatchesPage() {
  const { canManage } = useRole()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchMatches()
  }, [search, statusFilter])

  useEffect(() => {
    const fetchPlayerMap = async () => {
      try {
        const response = await fetch("/api/players?limit=500")
        const data = await response.json()
        if (response.ok) {
          const map: Record<string, string> = {}
          for (const player of data.data.players) {
            map[player.name] = player.id
          }
          setPlayerMap(map)
        }
      } catch (error) {
        console.error("Error fetching players:", error)
      }
    }
    fetchPlayerMap()
  }, [])

  const fetchMatches = async () => {
    try {
      const params = new URLSearchParams()

      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/matches?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setMatches(data.data.matches)
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      NOT_STARTED: { bg: "bg-gradient-to-r from-gray-100 to-gray-200", text: "text-gray-800", icon: "⏸️" },
      IN_PROGRESS: { bg: "bg-gradient-to-r from-blue-500 to-blue-600", text: "text-white", icon: "▶️" },
      COMPLETED: { bg: "bg-gradient-to-r from-green-500 to-green-600", text: "text-white", icon: "✅" },
    }
    const config = configs[status as keyof typeof configs]
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-md ${config.bg} ${config.text}`}
      >
        <span>{config.icon}</span>
        {status.replace("_", " ")}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <span className="text-4xl sm:text-5xl">🏸</span>
              Matches
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">Manage and score your badminton matches</p>
          </div>
          {canManage && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/matches/new" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all">
                  ➕ <span className="hidden sm:inline">Create New Match</span><span className="sm:hidden">New Match</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Filters and View Toggle */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-1 max-w-2xl">
            <Input
              placeholder="Search by match name or player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>

        {/* Matches List */}
        {loading ? (
          <div className="text-center py-12">Loading matches...</div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No matches found</p>
              <Link href="/matches/new">
                <Button>Create Your First Match</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-2xl transition-all hover:scale-105 bg-white border-2 border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-800">{match.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <span className="text-lg">🏸</span>
                        <span className="font-semibold">{match.type}</span>
                      </CardDescription>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Players */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MatchAvatar name={match.sideAPlayer1} src={match.sideAPlayer1Photo} color="green" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                              {match.winningSide === "A" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideAPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideAPlayer2} src={match.sideAPlayer2Photo} color="green" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MatchAvatar name={match.sideBPlayer1} src={match.sideBPlayer1Photo} color="blue" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                              {match.winningSide === "B" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideBPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideBPlayer2} src={match.sideBPlayer2Photo} color="blue" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    {match.status !== "NOT_STARTED" && (
                      <div className="flex items-center justify-center gap-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 shadow-inner">
                        <div className="text-center">
                          <div className="text-3xl font-black tabular-nums text-green-600">
                            {match.setsWonBySideA}
                          </div>
                                                  </div>
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                        <div className="text-center">
                          <div className="text-3xl font-black tabular-nums text-blue-600">
                            {match.setsWonBySideB}
                          </div>
                                                  </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link href={`/matches/${match.id}`} className="w-full">
                        <Button variant="outline" className="w-full border-2 hover:bg-gray-50" size="sm">
                          📋 View Details
                        </Button>
                      </Link>
                      {canManage && match.status === "IN_PROGRESS" && (
                        <Link href={`/matches/${match.id}/score`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md" size="sm">
                            ▶️ Continue Scoring
                          </Button>
                        </Link>
                      )}
                      {canManage && match.status === "NOT_STARTED" && (
                        <Link href={`/matches/${match.id}`} className="w-full">
                          <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md" size="sm">
                            🚀 Start Match
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-xl transition-all bg-white border-2 border-green-100">
                <CardContent className="p-4">
                  {/* Mobile Layout - Stack vertically */}
                  <div className="block lg:hidden space-y-3">
                    {/* Match Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-800">{match.name}</h3>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        <span>🏸</span>
                        {match.type}
                      </div>
                    </div>

                    {/* Players and Score */}
                    <div className="flex items-center gap-2">
                      {/* Team A */}
                      <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <MatchAvatar name={match.sideAPlayer1} src={match.sideAPlayer1Photo} color="green" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                              {match.winningSide === "A" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideAPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideAPlayer2} src={match.sideAPlayer2Photo} color="green" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      {match.status !== "NOT_STARTED" && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-gray-100 to-gray-200 px-2 py-2 rounded-lg border-2 border-gray-300">
                          <div className="text-lg font-black tabular-nums text-green-600">{match.setsWonBySideA}</div>
                          <div className="text-gray-400 font-bold text-xs">VS</div>
                          <div className="text-lg font-black tabular-nums text-blue-600">{match.setsWonBySideB}</div>
                        </div>
                      )}

                      {/* Team B */}
                      <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <MatchAvatar name={match.sideBPlayer1} src={match.sideBPlayer1Photo} color="blue" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                              {match.winningSide === "B" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideBPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideBPlayer2} src={match.sideBPlayer2Photo} color="blue" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/matches/${match.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50 text-xs">
                          📋 View
                        </Button>
                      </Link>
                      {match.status === "IN_PROGRESS" && (
                        <Link href={`/matches/${match.id}/score`} className="flex-1">
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md text-xs">
                            ▶️ Score
                          </Button>
                        </Link>
                      )}
                      {match.status === "NOT_STARTED" && (
                        <Link href={`/matches/${match.id}`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md text-xs" size="sm">
                            🚀 Start
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout - Grid */}
                  <div className="hidden lg:grid grid-cols-10 gap-4 items-center">
                    {/* Column 1-5: Match Info */}
                    <div className="col-span-5">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 truncate">{match.name}</h3>
                        {getStatusBadge(match.status)}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                        <span>🏸</span>
                        {match.type}
                      </div>
                    </div>

                    {/* Column 6-9: Players and Score */}
                    <div className="col-span-4 flex items-center gap-3">
                      {/* Team A Players */}
                      <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <MatchAvatar name={match.sideAPlayer1} src={match.sideAPlayer1Photo} color="green" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                              {match.winningSide === "A" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideAPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideAPlayer2} src={match.sideAPlayer2Photo} color="green" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      {match.status !== "NOT_STARTED" && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2 rounded-lg border-2 border-gray-300">
                          <div className="text-xl font-black tabular-nums text-green-600">
                            {match.setsWonBySideA}
                          </div>
                          <div className="text-gray-400 font-bold text-sm">VS</div>
                          <div className="text-xl font-black tabular-nums text-blue-600">
                            {match.setsWonBySideB}
                          </div>
                        </div>
                      )}

                      {/* Team B Players */}
                      <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <MatchAvatar name={match.sideBPlayer1} src={match.sideBPlayer1Photo} color="blue" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-1">
                              <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                              {match.winningSide === "B" && <span>🏆</span>}
                            </div>
                          </div>
                        </div>
                        {match.sideBPlayer2 && (
                          <div className="flex items-center gap-2">
                            <MatchAvatar name={match.sideBPlayer2} src={match.sideBPlayer2Photo} color="blue" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-800 truncate"><PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 10: Actions */}
                    <div className="col-span-1 flex flex-col gap-2">
                      <Link href={`/matches/${match.id}`}>
                        <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50 text-xs whitespace-nowrap">
                          📋 View
                        </Button>
                      </Link>
                      {match.status === "IN_PROGRESS" && (
                        <Link href={`/matches/${match.id}/score`}>
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md text-xs whitespace-nowrap">
                            ▶️ Score
                          </Button>
                        </Link>
                      )}
                      {match.status === "NOT_STARTED" && (
                        <Link href={`/matches/${match.id}`}>
                          <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md text-xs whitespace-nowrap" size="sm">
                            🚀 Start
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
