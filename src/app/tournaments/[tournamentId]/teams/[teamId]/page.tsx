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
import { toGoogleDriveDisplayUrl } from "@/lib/googleDriveImageUrl"

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
  captainId: string | null
  captain: { id: string; name: string; profilePhoto: string | null } | null
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
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      KID: "bg-amber-100 text-amber-800",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[category] || "bg-gray-100 text-gray-800"
        }`}
      >
        {category}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading team...</div>
        </main>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Team not found"}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tournaments/${params.tournamentId}`)}
          >
            ← Back to Tournament
          </Button>
          {canManage && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Link href={`/tournaments/${params.tournamentId}/teams/${team.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Team
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Team"}
              </Button>
            </div>
          )}
        </div>

        {/* Team Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              {team.logoUrl ? (
                <img
                  src={toGoogleDriveDisplayUrl(team.logoUrl)}
                  alt={`${team.name} logo`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <CardDescription>
                  Tournament: {team.tournament.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Composition Rules */}
            <div>
              <h3 className="font-semibold mb-3">Composition Rules</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{team.teamSize}</div>
                  <div className="text-sm text-muted-foreground">Team Size</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{team.requiredMale}</div>
                  <div className="text-sm text-blue-600">Male</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-pink-700">{team.requiredFemale}</div>
                  <div className="text-sm text-pink-600">Female</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{team.requiredKid}</div>
                  <div className="text-sm text-amber-600">Kid</div>
                </div>
              </div>
            </div>

            {/* Players */}
            <div>
              <h3 className="font-semibold mb-3">Players ({team._count.players})</h3>
              {team.captain && (
                <p className="text-sm text-muted-foreground mb-3">
                  Captain:{" "}
                  <span className="font-medium text-foreground">
                    <PlayerLink name={team.captain.name} playerId={team.captain.id} />
                  </span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-medium">
                    Not in auction pool
                  </span>
                </p>
              )}
              <div className="space-y-2">
                {team.players.map((tp) => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <PlayerAvatar name={tp.player.name} profilePhoto={tp.player.profilePhoto} size="lg" />
                      <div>
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          <PlayerLink name={tp.player.name} playerId={tp.player.id} />
                          {team.captainId === tp.playerId && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs font-medium">
                              Captain
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Team Matches ({team.teamMatches.length})</CardTitle>
              <CardDescription>
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
                            ? "border-green-200 bg-green-50/50"
                            : isLoser
                            ? "border-red-200 bg-red-50/50"
                            : "border-gray-200 bg-gray-50/50"
                          : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{tm.name}</span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  tm.status === "COMPLETED"
                                    ? "bg-green-100 text-green-800"
                                    : tm.status === "IN_PROGRESS"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {tm.status.replace("_", " ")}
                              </span>
                              {isCompleted && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                                    isWinner
                                      ? "bg-green-100 text-green-800"
                                      : isLoser
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {isWinner ? "WON" : isLoser ? "LOST" : "DRAW"}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              vs {opponent.name}
                            </div>
                            {isCompleted && (
                              <div className="mt-1.5 text-sm">
                                <span className="font-semibold">
                                  {fixturesWon} - {fixturesLost}
                                </span>
                                <span className="text-muted-foreground ml-3">
                                  Points: {pointsFor} - {pointsAgainst}
                                  {" ("}
                                  <span className={pointsFor - pointsAgainst > 0 ? "text-green-600" : pointsFor - pointsAgainst < 0 ? "text-red-600" : ""}>
                                    {pointsFor - pointsAgainst > 0 ? "+" : ""}
                                    {pointsFor - pointsAgainst}
                                  </span>
                                  {")"}
                                </span>
                              </div>
                            )}
                          </div>
                          <Link href={`/tournaments/${params.tournamentId}/team-matches/${tm.id}`}>
                            <Button variant="outline" size="sm">
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
