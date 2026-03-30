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
import type { SkillCategory } from "@prisma/client"
import { skillCategoryLabel } from "@/lib/skillCategory"

function PlayerPhoto({ name, src, size }: { name: string; src?: string | null; size: "sm" | "md" }) {
  const [error, setError] = useState(false)
  const cls = size === "md" ? "w-14 h-14 text-2xl" : "w-12 h-12 text-xl"
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-black text-white shadow-lg overflow-hidden flex-shrink-0`}>
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
  experience?: string | null
  skillCategory?: SkillCategory | null
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
      MALE: { bg: "bg-gradient-to-r from-blue-500 to-blue-600", icon: "👨" },
      FEMALE: { bg: "bg-gradient-to-r from-pink-500 to-pink-600", icon: "👩" },
      OTHER: { bg: "bg-gradient-to-r from-purple-500 to-purple-600", icon: "🧑" },
    }
    const config = configs[gender as keyof typeof configs]
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md ${config.bg}`}
      >
        <span>{config.icon}</span>
        {gender}
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
              <span className="text-4xl sm:text-5xl">👥</span>
              Players
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">Manage your badminton players</p>
          </div>
          {canManage && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href="/players/bulk-upload" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full border-2 border-blue-600 text-blue-700 hover:bg-blue-50 shadow-md" size="lg">
                  📊 <span className="hidden sm:inline">Bulk Upload</span><span className="sm:hidden">Upload</span>
                </Button>
              </Link>
              <Link href="/players/new" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all">
                  ➕ <span className="hidden sm:inline">Add New Player</span><span className="sm:hidden">New Player</span>
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
              className="flex-1"
            />
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-[140px]">
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
              <Card key={player.id} className="hover:shadow-2xl transition-all hover:scale-105 bg-white border-2 border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <PlayerPhoto name={player.name} src={player.profilePhoto} size="md" />
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">{player.name}</CardTitle>
                        {player.gender && <div className="mt-1">{getGenderBadge(player.gender)}</div>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Contact Info */}
                    <div className="text-sm space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                      {isAdmin && player.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📧</span>
                          <span className="truncate text-gray-700 font-medium">{player.email}</span>
                        </div>
                      )}
                      {isAdmin && player.mobileNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📱</span>
                          <span className="text-gray-700 font-medium">{player.mobileNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      {player.age && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg border border-blue-200">
                          <div className="text-blue-700 text-xs font-bold">Age</div>
                          <div className="font-black text-gray-800">{player.age}</div>
                        </div>
                      )}
                      {player.experience?.trim() && (
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg border border-green-200 min-w-0">
                            <div className="text-green-700 text-xs font-bold">Experience</div>
                            <div
                              className="font-black text-gray-800 text-xs line-clamp-2 break-words"
                              title={player.experience}
                            >
                              {player.experience}
                            </div>
                          </div>
                        )}
                      {player.skillCategory && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2 rounded-lg border border-purple-200">
                          <div className="text-purple-700 text-xs font-bold">Level</div>
                          <div className="font-black text-gray-800">{skillCategoryLabel(player.skillCategory)}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <Link href={`/players/${player.id}`} className="block">
                      <Button variant="outline" className="w-full border-2 hover:bg-gray-50 font-semibold">
                        👁️ View Details
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
              <Card key={player.id} className="hover:shadow-xl transition-all hover:scale-[1.02] bg-white border-2 border-green-100">
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="block md:hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <PlayerPhoto name={player.name} src={player.profilePhoto} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-800">{player.name}</h3>
                          {player.gender && getGenderBadge(player.gender)}
                        </div>
                        <div className="text-sm space-y-1">
                          {isAdmin && player.email && (
                            <div className="truncate text-gray-600 flex items-center gap-1">
                              <span>📧</span>
                              {player.email}
                            </div>
                          )}
                          {isAdmin && player.mobileNumber && (
                            <div className="text-gray-600 flex items-center gap-1">
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
                        <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 px-3 py-2 rounded-lg border border-blue-200">
                          <div className="text-blue-700 text-xs font-bold">Age</div>
                          <div className="font-black text-gray-800">{player.age}</div>
                        </div>
                      )}
                      {player.experience?.trim() && (
                        <div className="text-center bg-gradient-to-br from-green-50 to-green-100 px-3 py-2 rounded-lg border border-green-200 max-w-[140px]">
                          <div className="text-green-700 text-xs font-bold">Experience</div>
                          <div
                            className="font-black text-gray-800 text-xs line-clamp-2 break-words"
                            title={player.experience}
                          >
                            {player.experience}
                          </div>
                        </div>
                      )}
                      {player.skillCategory && (
                        <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 px-3 py-2 rounded-lg border border-purple-200">
                          <div className="text-purple-700 text-xs font-bold">Level</div>
                          <div className="font-black text-gray-800">{skillCategoryLabel(player.skillCategory)}</div>
                        </div>
                      )}
                    </div>
                    <Link href={`/players/${player.id}`}>
                      <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50 font-semibold">
                        👁️ View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    {/* Player Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0 overflow-hidden">
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
                          <h3 className="font-bold truncate text-gray-800">{player.name}</h3>
                          {player.gender && getGenderBadge(player.gender)}
                        </div>
                        <div className="text-sm flex items-center gap-4">
                          {isAdmin && player.email && (
                            <span className="truncate text-gray-600 flex items-center gap-1">
                              <span>📧</span>
                              {player.email}
                            </span>
                          )}
                          {isAdmin && player.mobileNumber && (
                            <span className="text-gray-600 flex items-center gap-1">
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
                        <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 px-3 py-2 rounded-lg border border-blue-200">
                          <div className="text-blue-700 text-xs font-bold">Age</div>
                          <div className="font-black text-gray-800">{player.age}</div>
                        </div>
                      )}
                      {player.experience?.trim() && (
                          <div className="text-center bg-gradient-to-br from-green-50 to-green-100 px-3 py-2 rounded-lg border border-green-200 max-w-[160px]">
                            <div className="text-green-700 text-xs font-bold">Experience</div>
                            <div
                              className="font-black text-gray-800 text-xs line-clamp-2 break-words"
                              title={player.experience}
                            >
                              {player.experience}
                            </div>
                          </div>
                        )}
                      {player.skillCategory && (
                        <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 px-3 py-2 rounded-lg border border-purple-200">
                          <div className="text-purple-700 text-xs font-bold">Level</div>
                          <div className="font-black text-gray-800">{skillCategoryLabel(player.skillCategory)}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/players/${player.id}`}>
                        <Button variant="outline" size="sm" className="border-2 hover:bg-gray-50 font-semibold">
                          👁️ View
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
