"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"

interface Player {
  id: string
  name: string
  age: number | null
  gender: string | null
}

interface Fixture {
  id: string
  fixtureNumber: number
  fixtureType: string
  teamAPlayer1: Player | null
  teamAPlayer2: Player | null
  teamBPlayer1: Player | null
  teamBPlayer2: Player | null
  match: {
    id: string
    name: string
    status: string
    setsWonBySideA: number
    setsWonBySideB: number
    winningSide: string | null
  } | null
}

interface TeamMatch {
  id: string
  name: string
  category: string
  genderRestriction: boolean | null
  status: string
  menDoublesCount: number
  womenDoublesCount: number
  mixedDoublesCount: number
  menSinglesCount: number
  womenSinglesCount: number
  kidsSinglesCount: number
  kidsDoublesCount: number
  setsCount: number
  pointsToWin: number
  deuceCap: number
  fixturesWonByTeamA: number
  fixturesWonByTeamB: number
  totalPointsTeamA: number
  totalPointsTeamB: number
  winningTeamId: string | null
  winningTeam: { id: string; name: string } | null
  tournament: { id: string; name: string }
  teamA: {
    id: string
    name: string
    players: { playerId: string; category: string; player: Player }[]
  }
  teamB: {
    id: string
    name: string
    players: { playerId: string; category: string; player: Player }[]
  }
  fixtures: Fixture[]
}

const FIXTURE_TYPE_LABELS: Record<string, string> = {
  MEN_DOUBLES: "Men's Doubles",
  WOMEN_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
  MEN_SINGLES: "Men's Singles",
  WOMEN_SINGLES: "Women's Singles",
  KIDS_SINGLES: "Kids Singles",
  KIDS_DOUBLES: "Kids Doubles",
}

const FIXTURE_TYPE_COLORS: Record<string, string> = {
  MEN_DOUBLES: "bg-cyan-500/20 text-cyan-300",
  WOMEN_DOUBLES: "bg-pink-500/20 text-pink-300",
  MIXED_DOUBLES: "bg-purple-500/20 text-purple-300",
  MEN_SINGLES: "bg-sky-500/20 text-sky-300",
  WOMEN_SINGLES: "bg-rose-500/20 text-rose-300",
  KIDS_SINGLES: "bg-amber-500/20 text-amber-300",
  KIDS_DOUBLES: "bg-orange-500/20 text-orange-300",
}

export default function TeamMatchDetailPage({
  params,
}: {
  params: { tournamentId: string; teamMatchId: string }
}) {
  const router = useRouter()
  const { canManage } = useRole()
  const { alert, confirmDelete } = useAlertDialog()
  const [teamMatch, setTeamMatch] = useState<TeamMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamMatch()
  }, [params.teamMatchId])

  const fetchTeamMatch = async () => {
    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team match")
      }

      setTeamMatch(data.data.teamMatch)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete(
      "Are you sure you want to delete this team match? All fixtures will be removed."
    )
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        router.push(`/tournaments/${params.tournamentId}`)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team match", "Error")
      }
    } catch (err) {
      console.error("Delete error:", err)
      alert("An error occurred", "Error")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading team match...</div>
        </main>
      </div>
    )
  }

  if (error || !teamMatch) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-red-300">
            {error || "Team match not found"}
          </div>
        </main>
      </div>
    )
  }

  // Compute format summary
  const formatItems = [
    { label: "Men's Doubles", count: teamMatch.menDoublesCount },
    { label: "Women's Doubles", count: teamMatch.womenDoublesCount },
    { label: "Mixed Doubles", count: teamMatch.mixedDoublesCount },
    { label: "Men's Singles", count: teamMatch.menSinglesCount },
    { label: "Women's Singles", count: teamMatch.womenSinglesCount },
    { label: "Kids Singles", count: teamMatch.kidsSinglesCount },
    { label: "Kids Doubles", count: teamMatch.kidsDoublesCount },
  ].filter((item) => item.count > 0)

  const assignedCount = teamMatch.fixtures.filter(
    (f) => f.teamAPlayer1 !== null
  ).length

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
            &larr; Back to Tournament
          </Button>
          {canManage && (
            <Button size="sm" onClick={handleDelete} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20">
              Delete Team Match
            </Button>
          )}
        </div>

        {/* Header Card */}
        <Card className="mb-6 border-white/10 bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white">{teamMatch.name}</CardTitle>
                <CardDescription className="mt-2 text-base text-gray-400">
                  {teamMatch.teamA.name} vs {teamMatch.teamB.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    teamMatch.category === "ADULT"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {teamMatch.category}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    teamMatch.status === "DRAFT"
                      ? "bg-gray-500/20 text-gray-300"
                      : teamMatch.status === "READY"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : teamMatch.status === "IN_PROGRESS"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {teamMatch.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {formatItems.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300"
                >
                  {item.count}x {item.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-300">
                Best of {teamMatch.setsCount}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-300">
                {teamMatch.pointsToWin} pts
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-300">
                Deuce cap {teamMatch.deuceCap}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {assignedCount}/{teamMatch.fixtures.length} fixtures assigned
            </p>
          </CardContent>
        </Card>

        {/* Result Banner */}
        {teamMatch.status === "COMPLETED" && (
          <Card className="mb-6 border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-6">
              <div className="text-center">
                {teamMatch.winningTeam ? (
                  <div className="text-lg font-bold text-emerald-300 mb-3">
                    {teamMatch.winningTeam.name} Wins!
                  </div>
                ) : (
                  <div className="text-lg font-bold text-gray-300 mb-3">
                    Match Drawn
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className={`text-center ${teamMatch.winningTeamId === teamMatch.teamA.id ? "font-bold" : ""}`}>
                    <div className="text-sm text-gray-400">{teamMatch.teamA.name}</div>
                    <div className="text-3xl font-bold tabular-nums text-white">{teamMatch.fixturesWonByTeamA}</div>
                  </div>
                  <div className="text-xl text-gray-400">-</div>
                  <div className={`text-center ${teamMatch.winningTeamId === teamMatch.teamB.id ? "font-bold" : ""}`}>
                    <div className="text-sm text-gray-400">{teamMatch.teamB.name}</div>
                    <div className="text-3xl font-bold tabular-nums text-white">{teamMatch.fixturesWonByTeamB}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Total Points: {teamMatch.totalPointsTeamA} - {teamMatch.totalPointsTeamB}
                  {" "}
                  ({teamMatch.totalPointsTeamA - teamMatch.totalPointsTeamB > 0 ? "+" : ""}
                  {teamMatch.totalPointsTeamA - teamMatch.totalPointsTeamB})
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fixtures List */}
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">
              Fixtures ({teamMatch.fixtures.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Assign players to each fixture, then score matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMatch.fixtures.map((fixture) => {
                const isAssigned = fixture.teamAPlayer1 !== null
                const hasMatch = fixture.match !== null
                const isDoubles = [
                  "MEN_DOUBLES",
                  "WOMEN_DOUBLES",
                  "MIXED_DOUBLES",
                  "KIDS_DOUBLES",
                ].includes(fixture.fixtureType)

                return (
                  <Card key={fixture.id} className="border border-white/10 bg-white/[0.03]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm text-white">
                              #{fixture.fixtureNumber}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                FIXTURE_TYPE_COLORS[fixture.fixtureType] ||
                                "bg-gray-500/20 text-gray-300"
                              }`}
                            >
                              {FIXTURE_TYPE_LABELS[fixture.fixtureType] ||
                                fixture.fixtureType}
                            </span>
                            {hasMatch && fixture.match && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  fixture.match.status === "COMPLETED"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : fixture.match.status === "IN_PROGRESS"
                                    ? "bg-cyan-500/20 text-cyan-300"
                                    : "bg-gray-500/20 text-gray-300"
                                }`}
                              >
                                {fixture.match.status.replace("_", " ")}
                              </span>
                            )}
                          </div>

                          {isAssigned ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-xs font-medium text-gray-400 mb-1">
                                  {teamMatch.teamA.name}
                                </div>
                                <div className="text-gray-300">
                                  {fixture.teamAPlayer1?.name}
                                  {isDoubles &&
                                    fixture.teamAPlayer2 &&
                                    ` & ${fixture.teamAPlayer2.name}`}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-400 mb-1">
                                  {teamMatch.teamB.name}
                                </div>
                                <div className="text-gray-300">
                                  {fixture.teamBPlayer1?.name}
                                  {isDoubles &&
                                    fixture.teamBPlayer2 &&
                                    ` & ${fixture.teamBPlayer2.name}`}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Players not yet assigned
                            </p>
                          )}

                          {hasMatch && fixture.match && fixture.match.status !== "NOT_STARTED" && (
                            <div className="mt-2 text-sm font-semibold text-white">
                              Score: {fixture.match.setsWonBySideA} -{" "}
                              {fixture.match.setsWonBySideB}
                              {fixture.match.winningSide && (
                                <span className="text-emerald-400 ml-2">
                                  Side {fixture.match.winningSide} Won
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {canManage && !isAssigned && (
                            <Link
                              href={`/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}/fixtures/${fixture.id}/assign`}
                            >
                              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400">Assign Players</Button>
                            </Link>
                          )}
                          {hasMatch && fixture.match && (
                            <Link href={`/matches/${fixture.match.id}`}>
                              <Button variant="outline" size="sm" className="border border-white/10 hover:bg-white/5 text-gray-300">
                                {fixture.match.status === "COMPLETED"
                                  ? "View Result"
                                  : canManage ? "Score Match" : "View Match"}
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
