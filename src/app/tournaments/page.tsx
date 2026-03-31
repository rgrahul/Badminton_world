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
      UPCOMING: { bg: "bg-cyan-500/20 text-cyan-300" },
      ONGOING: { bg: "bg-emerald-500/20 text-emerald-300" },
      COMPLETED: { bg: "bg-gray-500/20 text-gray-300" },
      CANCELLED: { bg: "bg-red-500/20 text-red-300" },
    }
    const config = configs[status as keyof typeof configs]
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${config.bg}`}
      >
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              Tournaments
            </h1>
            <p className="text-gray-400 mt-2 text-base sm:text-lg">Manage your badminton tournaments</p>
          </div>
          {canManage && (
            <Link href="/tournaments/new" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all">
                <span className="hidden sm:inline">Create New Tournament</span><span className="sm:hidden">New Tournament</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Filter Tabs and View Toggle */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All" },
              { value: "UPCOMING", label: "Upcoming" },
              { value: "ONGOING", label: "Ongoing" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" }
            ].map((status) => (
              <Button
                key={status.value}
                variant={filter === status.value ? "default" : "outline"}
                onClick={() => setFilter(status.value)}
                size="sm"
                className={filter === status.value ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20" : "bg-transparent border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"}
              >
                <span className="hidden sm:inline">{status.label}</span>
              </Button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white/5 rounded-lg p-1 border border-white/10 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <Card key={tournament.id} className="hover:shadow-2xl transition-all hover:scale-105 border-white/10 bg-white/[0.03] hover:border-white/20">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-bold text-white">{tournament.name}</CardTitle>
                    {getStatusBadge(tournament.status)}
                  </div>
                  <CardDescription className="flex items-center gap-1 text-gray-400 font-semibold">
                    {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Details */}
                    <div className="space-y-2 text-sm bg-white/5 p-3 rounded-lg border border-white/10">
                      {tournament.venue && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1">
                            Venue:
                          </span>
                          <span className="font-bold text-white">{tournament.venue}</span>
                        </div>
                      )}
                      {tournament.city && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1">
                            City:
                          </span>
                          <span className="font-bold text-white">{tournament.city}</span>
                        </div>
                      )}
                      {tournament.category && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 flex items-center gap-1">
                            Category:
                          </span>
                          <span className="font-bold text-white">{tournament.category}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1">
                          Matches:
                        </span>
                        <span className="font-black text-emerald-400 text-lg">{tournament._count.matches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-1">
                          Organizer:
                        </span>
                        <span className="font-bold text-white">{tournament.organizerName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                      <Link href={`/tournaments/${tournament.id}`} className="block">
                        <Button variant="outline" className="w-full border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                          View Details
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
              <Card key={tournament.id} className="hover:shadow-xl transition-all hover:scale-[1.02] border-white/10 bg-white/[0.03] hover:border-white/20">
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="block md:hidden space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold text-white text-lg flex-1">{tournament.name}</h3>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <div className="text-sm font-semibold text-gray-400 flex items-center gap-1">
                      {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {tournament.venue && (
                        <span className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                          <span className="font-semibold text-cyan-300">{tournament.venue}</span>
                        </span>
                      )}
                      {tournament.city && (
                        <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          <span className="font-semibold text-emerald-300">{tournament.city}</span>
                        </span>
                      )}
                      {tournament.category && (
                        <span className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                          <span className="font-semibold text-purple-300">{tournament.category}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                        <span className="font-black text-amber-300">{tournament._count.matches} matches</span>
                      </span>
                    </div>
                    <div className="text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                      <div className="text-gray-400 text-xs font-bold flex items-center gap-1">
                        Organizer:
                      </div>
                      <div className="font-bold text-white">{tournament.organizerName}</div>
                    </div>
                    <Link href={`/tournaments/${tournament.id}`}>
                      <Button variant="outline" size="sm" className="w-full border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    {/* Tournament Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold truncate text-white text-lg">{tournament.name}</h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      <div className="text-sm font-semibold text-gray-400 flex items-center gap-1 mb-2">
                        {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                      </div>
                      <div className="flex gap-4 text-sm">
                        {tournament.venue && (
                          <span className="flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                            <span className="font-semibold text-cyan-300">{tournament.venue}</span>
                          </span>
                        )}
                        {tournament.city && (
                          <span className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            <span className="font-semibold text-emerald-300">{tournament.city}</span>
                          </span>
                        )}
                        {tournament.category && (
                          <span className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                            <span className="font-semibold text-purple-300">{tournament.category}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          <span className="font-black text-amber-300">{tournament._count.matches} matches</span>
                        </span>
                      </div>
                    </div>

                    {/* Organizer and Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                        <div className="text-gray-400 text-xs font-bold flex items-center gap-1 justify-end">
                          Organizer
                        </div>
                        <div className="font-bold text-white">{tournament.organizerName}</div>
                      </div>
                      <Link href={`/tournaments/${tournament.id}`}>
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
