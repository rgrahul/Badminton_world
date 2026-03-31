"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerLink, PlayerAvatar } from "@/components/player/PlayerLink"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"

interface Player {
  id: string
  name: string
  age: number | null
  gender: string | null
  profilePhoto: string | null
}

interface TeamPlayer {
  id: string
  playerId: string
  category: string
  player: Player
}

interface FixtureSummary {
  id: string
  fixtureNumber: number
  fixtureType: string
  match: {
    id: string
    status: string
    winningSide: string | null
    setsWonBySideA: number
    setsWonBySideB: number
  } | null
}

interface TeamMatchInfo {
  id: string
  name: string
  status: string
  category: string
  fixturesWonByTeamA: number
  fixturesWonByTeamB: number
  totalPointsTeamA: number
  totalPointsTeamB: number
  winningTeamId: string | null
  winningTeam: { id: string; name: string } | null
  teamA: { id: string; name: string }
  teamB: { id: string; name: string }
  fixtures: FixtureSummary[]
}

interface Team {
  id: string
  name: string
  teamSize: number
  requiredMale: number
  requiredFemale: number
  requiredKid: number
  logoUrl: string | null
  createdAt: string
  updatedAt: string
  tournament: {
    id: string
    name: string
  }
  players: TeamPlayer[]
  _count: {
    players: number
  }
  teamMatches: TeamMatchInfo[]
}

export default function TeamDetailPage({
  params,
}: {
  params: { tournamentId: string; teamId: string }
}) {
  const router = useRouter()
  const { canManage } = useRole()
  const { alert, confirmDelete } = useAlertDialog()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTeam()
  }, [params.teamId])

  const fetchTeam = async () => {
    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/teams/${params.teamId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team")
      }

      setTeam(data.data.team)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete(
      "Are you sure you want to delete this team? This action cannot be undone."
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/teams/${params.teamId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        router.push(`/tournaments/${params.tournamentId}`)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team", "Error")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsDeleting(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      MALE: "bg-cyan-500/20 text-cyan-300",
      FEMALE: "bg-pink-500/20 text-pink-300",
      KID: "bg-amber-500/20 text-amber-300",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[category] || "bg-gray-500/20 text-gray-300"
        }`}
      >
        {category}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading team...</div>
        </main>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-red-300">{error || "Team not found"}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tournaments/${params.tournamentId}`)}
            className="border border-white/10 hover:bg-white/5 text-gray-300"
          >
            Back to Tournament
          </Button>
          {canManage && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link href={`/tournaments/${params.tournamentId}/teams/${team.id}/edit`}>
                <Button variant="outline" size="sm" className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20">
                  Edit Team
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20"
              >
                {isDeleting ? "Deleting..." : "Delete Team"}
              </Button>
            </div>
          )}
        </div>

        {/* Team Info Card */}
        <Card className="mb-6 border-white/10 bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-center gap-4">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={`${team.name} logo`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-black font-bold text-2xl flex-shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-2xl text-white">{team.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  Tournament: {team.tournament.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Composition Rules */}
            <div>
              <h3 className="font-semibold mb-3 text-white">Composition Rules</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{team.teamSize}</div>
                  <div className="text-sm text-gray-400">Team Size</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{team.requiredMale}</div>
                  <div className="text-sm text-cyan-300">Male</div>
                </div>
                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-pink-400">{team.requiredFemale}</div>
                  <div className="text-sm text-pink-300">Female</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{team.requiredKid}</div>
                  <div className="text-sm text-amber-300">Kid</div>
                </div>
              </div>
            </div>

            {/* Players */}
            <div>
              <h3 className="font-semibold mb-3 text-white">Players ({team._count.players})</h3>
              <div className="space-y-2">
                {team.players.map((tp) => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <PlayerAvatar name={tp.player.name} profilePhoto={tp.player.profilePhoto} size="lg" />
                      <div>
                        <div className="font-medium text-white">
                          <PlayerLink name={tp.player.name} playerId={tp.player.id} />
                        </div>
                        <div className="text-sm text-gray-400">
                          {tp.player.gender || "N/A"}
                          {tp.player.age ? ` | Age ${tp.player.age}` : ""}
                        </div>
                      </div>
                    </div>
                    {getCategoryBadge(tp.category)}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Matches */}
        {team.teamMatches && team.teamMatches.length > 0 && (
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-white">Team Matches ({team.teamMatches.length})</CardTitle>
              <CardDescription className="text-gray-400">
                All matches this team has played or is scheduled to play
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.teamMatches.map((tm) => {
                  const isTeamA = tm.teamA.id === team.id
                  const opponent = isTeamA ? tm.teamB : tm.teamA
                  const fixturesWon = isTeamA ? tm.fixturesWonByTeamA : tm.fixturesWonByTeamB
                  const fixturesLost = isTeamA ? tm.fixturesWonByTeamB : tm.fixturesWonByTeamA
                  const pointsFor = isTeamA ? tm.totalPointsTeamA : tm.totalPointsTeamB
                  const pointsAgainst = isTeamA ? tm.totalPointsTeamB : tm.totalPointsTeamA
                  const isWinner = tm.winningTeamId === team.id
                  const isLoser = tm.winningTeamId && tm.winningTeamId !== team.id
                  const isCompleted = tm.status === "COMPLETED"

                  return (
                    <Card
                      key={tm.id}
                      className={`border ${
                        isCompleted
                          ? isWinner
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : isLoser
                            ? "border-red-500/20 bg-red-500/5"
                            : "border-white/10 bg-white/[0.03]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{tm.name}</span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  tm.status === "COMPLETED"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : tm.status === "IN_PROGRESS"
                                    ? "bg-cyan-500/20 text-cyan-300"
                                    : "bg-gray-500/20 text-gray-300"
                                }`}
                              >
                                {tm.status.replace("_", " ")}
                              </span>
                              {isCompleted && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                    isWinner
                                      ? "bg-emerald-500/20 text-emerald-300"
                                      : isLoser
                                      ? "bg-red-500/20 text-red-300"
                                      : "bg-gray-500/20 text-gray-300"
                                  }`}
                                >
                                  {isWinner ? "WON" : isLoser ? "LOST" : "DRAW"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              vs {opponent.name}
                            </div>
                            {isCompleted && (
                              <div className="mt-1.5 text-sm">
                                <span className="font-semibold text-white">
                                  {fixturesWon} - {fixturesLost}
                                </span>
                                <span className="text-gray-400 ml-3">
                                  Points: {pointsFor} - {pointsAgainst}
                                  {" ("}
                                  <span className={pointsFor - pointsAgainst > 0 ? "text-emerald-400" : pointsFor - pointsAgainst < 0 ? "text-red-400" : ""}>
                                    {pointsFor - pointsAgainst > 0 ? "+" : ""}
                                    {pointsFor - pointsAgainst}
                                  </span>
                                  {")"}
                                </span>
                              </div>
                            )}
                          </div>
                          <Link href={`/tournaments/${params.tournamentId}/team-matches/${tm.id}`}>
                            <Button variant="outline" size="sm" className="border border-white/10 hover:bg-white/5 text-gray-300">
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
