"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { useRole } from "@/hooks/useRole"

interface Tournament {
  id: string
  name: string
  description?: string
  dateFrom: string
  dateTo: string
  organizerName: string
  venue?: string
  city?: string
  category?: string
  status: string
  createdAt: string
  _count: {
    matches: number
  }
}

export default function TournamentsPage() {
  const { canManage } = useRole()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    fetchTournaments()
  }, [filter])

  const fetchTournaments = async () => {
    try {
      const url = filter === "all" ? "/api/tournaments" : `/api/tournaments?status=${filter}`
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setTournaments(data.data.tournaments)
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      UPCOMING: { bg: "bg-gradient-to-r from-blue-500 to-blue-600", icon: "📅" },
      ONGOING: { bg: "bg-gradient-to-r from-green-500 to-green-600", icon: "▶️" },
      COMPLETED: { bg: "bg-gradient-to-r from-gray-500 to-gray-600", icon: "✅" },
      CANCELLED: { bg: "bg-gradient-to-r from-red-500 to-red-600", icon: "❌" },
    }
    const config = configs[status as keyof typeof configs]
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md ${config.bg}`}
      >
        <span>{config.icon}</span>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <span className="text-4xl sm:text-5xl">🏆</span>
              Tournaments
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">Manage your badminton tournaments</p>
          </div>
          {canManage && (
            <Link href="/tournaments/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all">
                ➕ <span className="hidden sm:inline">Create New Tournament</span><span className="sm:hidden">New Tournament</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Filter Tabs and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All", icon: "📋" },
              { value: "UPCOMING", label: "Upcoming", icon: "📅" },
              { value: "ONGOING", label: "Ongoing", icon: "▶️" },
              { value: "COMPLETED", label: "Completed", icon: "✅" },
              { value: "CANCELLED", label: "Cancelled", icon: "❌" }
            ].map((status) => (
              <Button
                key={status.value}
                variant={filter === status.value ? "default" : "outline"}
                onClick={() => setFilter(status.value)}
                size="sm"
                className={filter === status.value ? "bg-gradient-to-r from-green-600 to-green-700 shadow-md" : "border-2 hover:bg-gray-50"}
              >
                <span className="mr-1">{status.icon}</span>
                <span className="hidden sm:inline">{status.label}</span>
              </Button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Tournaments List */}
        {loading ? (
          <div className="text-center py-12">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No tournaments found</p>
              <Link href="/tournaments/new">
                <Button>Create Your First Tournament</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-2xl transition-all hover:scale-105 bg-white border-2 border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800">{tournament.name}</CardTitle>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <CardDescription className="flex items-center gap-1 text-gray-600 font-semibold">
                    <span>📅</span>
                    {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Details */}
                    <div className="space-y-2 text-sm bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                      {tournament.venue && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span>📍</span> Venue:
                          </span>
                          <span className="font-bold text-gray-800">{tournament.venue}</span>
                        </div>
                      )}
                      {tournament.city && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span>🌆</span> City:
                          </span>
                          <span className="font-bold text-gray-800">{tournament.city}</span>
                        </div>
                      )}
                      {tournament.category && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center gap-1">
                            <span>🏅</span> Category:
                          </span>
                          <span className="font-bold text-gray-800">{tournament.category}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span>🎯</span> Matches:
                        </span>
                        <span className="font-black text-green-600 text-lg">{tournament._count.matches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span>👤</span> Organizer:
                        </span>
                        <span className="font-bold text-gray-800">{tournament.organizerName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                      <Link href={`/tournaments/${tournament.id}`} className="block">
                        <Button variant="outline" className="w-full border-2 hover:bg-gray-50 font-semibold">
                          👁️ View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-xl transition-all hover:scale-[1.02] bg-white border-2 border-green-100">
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="block md:hidden space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-lg flex-1">{tournament.name}</h3>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <div className="text-sm font-semibold text-gray-600 flex items-center gap-1">
                      <span>📅</span>
                      {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {tournament.venue && (
                        <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          <span>📍</span>
                          <span className="font-semibold text-blue-700">{tournament.venue}</span>
                        </span>
                      )}
                      {tournament.city && (
                        <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                          <span>🌆</span>
                          <span className="font-semibold text-green-700">{tournament.city}</span>
                        </span>
                      )}
                      {tournament.category && (
                        <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                          <span>🏅</span>
                          <span className="font-semibold text-purple-700">{tournament.category}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                        <span>🎯</span>
                        <span className="font-black text-orange-700">{tournament._count.matches} matches</span>
                      </span>
                    </div>
                    <div className="text-sm bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                      <div className="text-gray-600 text-xs font-bold flex items-center gap-1">
                        <span>👤</span>
                        Organizer:
                      </div>
                      <div className="font-bold text-gray-800">{tournament.organizerName}</div>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="w-full border-2 hover:bg-gray-50 font-semibold">
                        👁️ View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    {/* Tournament Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold truncate text-gray-800 text-lg">{tournament.name}</h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      <div className="text-sm font-semibold text-gray-600 flex items-center gap-1 mb-2">
                        <span>📅</span>
                        {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                      </div>
                      <div className="flex gap-4 text-sm">
                        {tournament.venue && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            <span>📍</span>
                            <span className="font-semibold text-blue-700">{tournament.venue}</span>
                          </span>
                        )}
                        {tournament.city && (
                          <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                            <span>🌆</span>
                            <span className="font-semibold text-green-700">{tournament.city}</span>
                          </span>
                        )}
                        {tournament.category && (
                          <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            <span>🏅</span>
                            <span className="font-semibold text-purple-700">{tournament.category}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                          <span>🎯</span>
                          <span className="font-black text-orange-700">{tournament._count.matches} matches</span>
                        </span>
                      </div>
                    </div>

                    {/* Organizer and Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                        <div className="text-gray-600 text-xs font-bold flex items-center gap-1 justify-end">
                          <span>👤</span>
                          Organizer
                        </div>
                        <div className="font-bold text-gray-800">{tournament.organizerName}</div>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`}>
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
