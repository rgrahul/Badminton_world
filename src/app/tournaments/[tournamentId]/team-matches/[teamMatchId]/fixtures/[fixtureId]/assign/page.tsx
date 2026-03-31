"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { useAlertDialog } from "@/hooks/useAlertDialog"

interface Player {
  id: string
  name: string
  age: number | null
  gender: string | null
}

interface TeamPlayer {
  playerId: string
  category: string
  player: Player
}

interface Fixture {
  id: string
  fixtureNumber: number
  fixtureType: string
  teamAPlayer1: Player | null
  teamAPlayer2: Player | null
  teamBPlayer1: Player | null
  teamBPlayer2: Player | null
  match: { id: string } | null
  teamMatch: {
    id: string
    name: string
    category: string
    genderRestriction: boolean | null
    allowPlayerReuse: boolean
    teamA: {
      id: string
      name: string
      players: TeamPlayer[]
    }
    teamB: {
      id: string
      name: string
      players: TeamPlayer[]
    }
    fixtures: {
      id: string
      teamAPlayer1Id: string | null
      teamAPlayer2Id: string | null
      teamBPlayer1Id: string | null
      teamBPlayer2Id: string | null
    }[]
  }
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

const DOUBLES_TYPES = ["MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "KIDS_DOUBLES"]

export default function AssignFixturePage({
  params,
}: {
  params: {
    tournamentId: string
    teamMatchId: string
    fixtureId: string
  }
}) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [teamAPlayer1Id, setTeamAPlayer1Id] = useState("")
  const [teamAPlayer2Id, setTeamAPlayer2Id] = useState("")
  const [teamBPlayer1Id, setTeamBPlayer1Id] = useState("")
  const [teamBPlayer2Id, setTeamBPlayer2Id] = useState("")

  useEffect(() => {
    fetchFixture()
  }, [params.fixtureId])

  const fetchFixture = async () => {
    try {
      // Fetch the team match which includes fixture data
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data")
      }

      const teamMatch = data.data.teamMatch
      const fix = teamMatch.fixtures.find(
        (f: { id: string }) => f.id === params.fixtureId
      )
      if (!fix) {
        throw new Error("Fixture not found")
      }

      // Build fixture object with team match context
      setFixture({
        ...fix,
        teamMatch: {
          id: teamMatch.id,
          name: teamMatch.name,
          category: teamMatch.category,
          genderRestriction: teamMatch.genderRestriction,
          allowPlayerReuse: teamMatch.allowPlayerReuse ?? false,
          teamA: teamMatch.teamA,
          teamB: teamMatch.teamB,
          fixtures: teamMatch.fixtures.map((f: { id: string; teamAPlayer1: Player | null; teamAPlayer2: Player | null; teamBPlayer1: Player | null; teamBPlayer2: Player | null }) => ({
            id: f.id,
            teamAPlayer1Id: f.teamAPlayer1?.id || null,
            teamAPlayer2Id: f.teamAPlayer2?.id || null,
            teamBPlayer1Id: f.teamBPlayer1?.id || null,
            teamBPlayer2Id: f.teamBPlayer2?.id || null,
          })),
        },
      })

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fixture) return

    const isDoubles = DOUBLES_TYPES.includes(fixture.fixtureType)

    if (!teamAPlayer1Id || !teamBPlayer1Id) {
      alert("Please select Player 1 for both teams", "Validation Error")
      return
    }
    if (isDoubles && (!teamAPlayer2Id || !teamBPlayer2Id)) {
      alert("Please select Player 2 for both teams (doubles)", "Validation Error")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}/fixtures/${params.fixtureId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamAPlayer1Id,
            teamAPlayer2Id: isDoubles ? teamAPlayer2Id : null,
            teamBPlayer1Id,
            teamBPlayer2Id: isDoubles ? teamBPlayer2Id : null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign players")
      }

      router.push(
        `/tournaments/${params.tournamentId}/team-matches/${params.teamMatchId}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading fixture...</div>
        </main>
      </div>
    )
  }

  if (error && !fixture) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-red-300">{error}</div>
        </main>
      </div>
    )
  }

  if (!fixture) return null

  const isDoubles = DOUBLES_TYPES.includes(fixture.fixtureType)
  const { category, genderRestriction } = fixture.teamMatch

  // Determine if gender filtering applies for this fixture
  // ADULT: always enforce gender based on fixture type
  // KIDS + genderRestriction=true: enforce gender based on fixture type
  // KIDS + genderRestriction=false: no gender filtering (kids-only types)
  const enforceGender =
    category === "ADULT" || (category === "KIDS" && genderRestriction === true)

  // Get required gender for each player slot based on fixture type
  // For MIXED_DOUBLES: player1 = MALE, player2 = FEMALE
  const getGenderFilter = (
    fixtureType: string,
    playerSlot: "player1" | "player2"
  ): string | null => {
    if (!enforceGender) return null

    switch (fixtureType) {
      case "MEN_DOUBLES":
      case "MEN_SINGLES":
        return "MALE"
      case "WOMEN_DOUBLES":
      case "WOMEN_SINGLES":
        return "FEMALE"
      case "MIXED_DOUBLES":
        return playerSlot === "player1" ? "MALE" : "FEMALE"
      default:
        return null
    }
  }

  // Filter players by gender requirement
  const filterByGender = (players: TeamPlayer[], genderReq: string | null): TeamPlayer[] => {
    if (!genderReq) return players
    return players.filter((tp) => tp.player.gender === genderReq)
  }

  // Get already-assigned player IDs from other fixtures (to mark as unavailable)
  // Skip when allowPlayerReuse is enabled
  const assignedPlayerIds = new Set<string>()
  if (!fixture.teamMatch.allowPlayerReuse) {
    for (const f of fixture.teamMatch.fixtures) {
      if (f.id === fixture.id) continue
      if (f.teamAPlayer1Id) assignedPlayerIds.add(f.teamAPlayer1Id)
      if (f.teamAPlayer2Id) assignedPlayerIds.add(f.teamAPlayer2Id)
      if (f.teamBPlayer1Id) assignedPlayerIds.add(f.teamBPlayer1Id)
      if (f.teamBPlayer2Id) assignedPlayerIds.add(f.teamBPlayer2Id)
    }
  }

  const teamAPlayers = fixture.teamMatch.teamA.players
  const teamBPlayers = fixture.teamMatch.teamB.players

  // Pre-filter players per slot
  const genderP1 = getGenderFilter(fixture.fixtureType, "player1")
  const genderP2 = getGenderFilter(fixture.fixtureType, "player2")

  const eligibleTeamAP1 = filterByGender(teamAPlayers, genderP1)
  const eligibleTeamAP2 = filterByGender(teamAPlayers, genderP2)
  const eligibleTeamBP1 = filterByGender(teamBPlayers, genderP1)
  const eligibleTeamBP2 = filterByGender(teamBPlayers, genderP2)

  const genderHint = genderP1 || genderP2
    ? ` (${genderP1 === genderP2 ? genderP1 : genderP1 && genderP2 ? `P1: ${genderP1}, P2: ${genderP2}` : genderP1 || genderP2})`
    : ""

  const renderPlayerSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    players: TeamPlayer[],
    excludeId?: string
  ) => (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
        disabled={submitting}
      >
        <option value="">Select player...</option>
        {players.map((tp) => {
          const isAssignedElsewhere = assignedPlayerIds.has(tp.playerId)
          const isExcluded = tp.playerId === excludeId
          return (
            <option
              key={tp.playerId}
              value={tp.playerId}
              disabled={isAssignedElsewhere || isExcluded}
            >
              {tp.player.name}
              {tp.player.gender ? ` (${tp.player.gender})` : ""}
              {tp.player.age ? `, age ${tp.player.age}` : ""}
              {isAssignedElsewhere ? " - Already assigned" : ""}
            </option>
          )
        })}
      </select>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.03] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-white">
              Assign Players
            </CardTitle>
            <CardDescription className="text-sm text-gray-400 font-medium">
              Fixture #{fixture.fixtureNumber} &mdash;{" "}
              {FIXTURE_TYPE_LABELS[fixture.fixtureType] || fixture.fixtureType}
              {isDoubles
                ? " (requires 2 players per team)"
                : " (requires 1 player per team)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/20 p-4 text-sm text-red-300 font-semibold">
                  {error}
                </div>
              )}

              {/* Gender restriction info */}
              {genderHint && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-300 font-medium">
                  Gender requirement for {FIXTURE_TYPE_LABELS[fixture.fixtureType]}: {genderHint}
                </div>
              )}

              {/* Team A Players */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">
                  {fixture.teamMatch.teamA.name}
                </h3>
                {renderPlayerSelect(
                  `Player 1${genderP1 ? ` (${genderP1})` : ""}`,
                  teamAPlayer1Id,
                  setTeamAPlayer1Id,
                  eligibleTeamAP1,
                  teamAPlayer2Id || undefined
                )}
                {isDoubles &&
                  renderPlayerSelect(
                    `Player 2${genderP2 ? ` (${genderP2})` : ""}`,
                    teamAPlayer2Id,
                    setTeamAPlayer2Id,
                    eligibleTeamAP2,
                    teamAPlayer1Id || undefined
                  )}
              </div>

              {/* Team B Players */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">
                  {fixture.teamMatch.teamB.name}
                </h3>
                {renderPlayerSelect(
                  `Player 1${genderP1 ? ` (${genderP1})` : ""}`,
                  teamBPlayer1Id,
                  setTeamBPlayer1Id,
                  eligibleTeamBP1,
                  teamBPlayer2Id || undefined
                )}
                {isDoubles &&
                  renderPlayerSelect(
                    `Player 2${genderP2 ? ` (${genderP2})` : ""}`,
                    teamBPlayer2Id,
                    setTeamBPlayer2Id,
                    eligibleTeamBP2,
                    teamBPlayer1Id || undefined
                  )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? "Assigning..." : "Assign & Create Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
