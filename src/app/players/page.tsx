"use client"

import { useEffect, useState, useCallback } from "react"
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
import { useRole } from "@/hooks/useRole"

function PlayerPhoto({ name, src, size }: { name: string; src?: string | null; size: "sm" | "md" }) {
  const [error, setError] = useState(false)
  const cls = size === "md" ? "w-14 h-14 text-2xl" : "w-12 h-12 text-xl"
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-white shadow-lg overflow-hidden flex-shrink-0`}>
      {src && !error ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

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
}

export default function PlayersPage() {
  const { canManage, isAdmin } = useRole()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("all")

  useEffect(() => {
    fetchPlayers()
  }, [search, genderFilter])

  const fetchPlayers = async () => {
    try {
      const params = new URLSearchParams()

      if (search) params.append("search", search)
      if (genderFilter !== "all") params.append("gender", genderFilter)

      const response = await fetch(`/api/players?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setPlayers(data.data.players)
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGenderBadge = (gender?: string | null) => {
    if (!gender) return null
    const configs = {
      MALE: { bg: "bg-cyan-500/20 text-cyan-300" },
      FEMALE: { bg: "bg-pink-500/20 text-pink-300" },
      OTHER: { bg: "bg-purple-500/20 text-purple-300" },
    }
    const config = configs[gender as keyof typeof configs]
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-md ${config.bg}`}
      >
        {gender}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2 sm:gap-3">
              Players
            </h1>
            <p className="text-gray-400 mt-2 text-base sm:text-lg">Manage your badminton players</p>
          </div>
          {canManage && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/players/bulk-upload" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:bg-white/5 shadow-md" size="lg">
                  <span className="hidden sm:inline">Bulk Upload</span><span className="sm:hidden">Upload</span>
                </Button>
              </Link>
              <Link href="/players/new" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all">
                  <span className="hidden sm:inline">Add New Player</span><span className="sm:hidden">New Player</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Filters and View Toggle */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 flex-1 max-w-2xl">
            <Input
              placeholder="Search by name, email, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white/5 rounded-lg p-1 border border-white/10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}
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
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}
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

        {/* Players List */}
        {loading ? (
          <div className="text-center py-12">Loading players...</div>
        ) : players.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No players found</p>
              <Link href="/players/new">
                <Button>Add Your First Player</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Card key={player.id} className="hover:border-white/20 transition-all hover:scale-105 border-white/10 bg-white/[0.03]">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <PlayerPhoto name={player.name} src={player.profilePhoto} size="md" />
                      <div>
                        <CardTitle className="text-lg font-bold text-white">{player.name}</CardTitle>
                        {player.gender && <div className="mt-1">{getGenderBadge(player.gender)}</div>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Contact Info */}
                    <div className="text-sm space-y-2 bg-white/5 p-3 rounded-lg border border-white/10">
                      {isAdmin && player.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📧</span>
                          <span className="truncate text-gray-400 font-medium">{player.email}</span>
                        </div>
                      )}
                      {isAdmin && player.mobileNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📱</span>
                          <span className="text-gray-400 font-medium">{player.mobileNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      {player.age && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded-lg">
                          <div className="text-cyan-400 text-xs font-bold">Age</div>
                          <div className="font-black text-white">{player.age}</div>
                        </div>
                      )}
                      {player.yearsOfExperience !== null &&
                        player.yearsOfExperience !== undefined && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                            <div className="text-emerald-400 text-xs font-bold">Exp</div>
                            <div className="font-black text-white">{player.yearsOfExperience}y</div>
                          </div>
                        )}
                      {player.skillRating && (
                        <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg">
                          <div className="text-purple-400 text-xs font-bold">Rating</div>
                          <div className="font-black text-white">{player.skillRating}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Link href={`/players/${player.id}`} className="block">
                      <Button variant="outline" className="w-full border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <Card key={player.id} className="hover:border-white/20 transition-all hover:scale-[1.02] border-white/10 bg-white/[0.03]">
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="block md:hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <PlayerPhoto name={player.name} src={player.profilePhoto} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-white">{player.name}</h3>
                          {player.gender && getGenderBadge(player.gender)}
                        </div>
                        <div className="text-sm space-y-1">
                          {isAdmin && player.email && (
                            <div className="truncate text-gray-400 flex items-center gap-1">
                              <span>📧</span>
                              {player.email}
                            </div>
                          )}
                          {isAdmin && player.mobileNumber && (
                            <div className="text-gray-400 flex items-center gap-1">
                              <span>📱</span>
                              {player.mobileNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      {player.age && (
                        <div className="text-center bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-lg">
                          <div className="text-cyan-400 text-xs font-bold">Age</div>
                          <div className="font-black text-white">{player.age}</div>
                        </div>
                      )}
                      {player.yearsOfExperience !== null && player.yearsOfExperience !== undefined && (
                        <div className="text-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                          <div className="text-emerald-400 text-xs font-bold">Experience</div>
                          <div className="font-black text-white">{player.yearsOfExperience}y</div>
                        </div>
                      )}
                      {player.skillRating && (
                        <div className="text-center bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">
                          <div className="text-purple-400 text-xs font-bold">Rating</div>
                          <div className="font-black text-white">{player.skillRating}</div>
                        </div>
                      )}
                    </div>
                    <Link href={`/players/${player.id}`}>
                      <Button variant="outline" size="sm" className="w-full border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    {/* Player Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0 overflow-hidden">
                        {player.profilePhoto ? (
                          <img
                            src={player.profilePhoto}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          player.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate text-white">{player.name}</h3>
                          {player.gender && getGenderBadge(player.gender)}
                        </div>
                        <div className="text-sm flex items-center gap-4">
                          {isAdmin && player.email && (
                            <span className="truncate text-gray-400 flex items-center gap-1">
                              <span>📧</span>
                              {player.email}
                            </span>
                          )}
                          {isAdmin && player.mobileNumber && (
                            <span className="text-gray-400 flex items-center gap-1">
                              <span>📱</span>
                              {player.mobileNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm flex-shrink-0">
                      {player.age && (
                        <div className="text-center bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-lg">
                          <div className="text-cyan-400 text-xs font-bold">Age</div>
                          <div className="font-black text-white">{player.age}</div>
                        </div>
                      )}
                      {player.yearsOfExperience !== null &&
                        player.yearsOfExperience !== undefined && (
                          <div className="text-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                            <div className="text-emerald-400 text-xs font-bold">Experience</div>
                            <div className="font-black text-white">{player.yearsOfExperience}y</div>
                          </div>
                        )}
                      {player.skillRating && (
                        <div className="text-center bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">
                          <div className="text-purple-400 text-xs font-bold">Rating</div>
                          <div className="font-black text-white">{player.skillRating}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/players/${player.id}`}>
                        <Button variant="outline" size="sm" className="border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                          View
                        </Button>
                      </Link>
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
