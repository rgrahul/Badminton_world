"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TossDialog } from "@/components/match/TossDialog"
import { PlayerLink } from "@/components/player/PlayerLink"
import { useMatchData } from "@/hooks/useMatchData"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"

function MatchDetailAvatar({ name, src, color }: { name: string; src?: string | null; color: "green" | "blue" }) {
  const [error, setError] = useState(false)
  const gradient = color === "green" ? "from-emerald-400 to-emerald-600" : "from-cyan-400 to-cyan-600"
  return (
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-black text-white shadow-lg flex-shrink-0 overflow-hidden`}>
      {src && !error ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setError(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

export default function MatchDetailPage({ params }: { params: { matchId: string } }) {
  const router = useRouter()
  const { canManage } = useRole()
  const { match, loading, error, refetch } = useMatchData(params.matchId)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showTossDialog, setShowTossDialog] = useState(false)
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string }>>([])
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})
  const { alert, confirm, confirmDelete } = useAlertDialog()
  const [isUpdatingTournament, setIsUpdatingTournament] = useState(false)

  useEffect(() => {
    // Fetch tournaments list
    const fetchTournaments = async () => {
      try {
        const response = await fetch("/api/tournaments")
        const data = await response.json()
        if (response.ok) {
          setTournaments(data.data.tournaments)
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error)
      }
    }
    // Fetch player name -> id map
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
    fetchTournaments()
    fetchPlayerMap()
  }, [])

  const handleStartMatch = () => {
    // Check if match is part of a tournament
    const tournament = (match as any).tournament
    if (tournament) {
      // Check tournament status
      if (tournament.status === "UPCOMING") {
        alert(
          "Cannot start match. Tournament has not started yet. Please start the tournament first.",
          "Tournament Not Started"
        )
        return
      }
      // Check tournament dates
      const today = new Date()
      const tournamentStart = new Date(tournament.dateFrom)
      if (today < tournamentStart) {
        alert(`Cannot start match. Tournament starts on ${tournamentStart.toLocaleDateString()}.`, "Tournament Not Started")
        return
      }
    }

    // Show toss dialog
    setShowTossDialog(true)
  }

  const handleTossComplete = async (result: {
    tossWonBy: "A" | "B"
    tossChoice: "SERVE" | "SIDE"
    servingSide: "A" | "B"
    serverName: string
    receiverName?: string
    courtSwapped: boolean
  }) => {
    try {
      setIsStarting(true)
      setShowTossDialog(false)
      const body: Record<string, unknown> = {
        status: "IN_PROGRESS",
        startedAt: new Date().toISOString(),
        tossWonBy: result.tossWonBy,
        tossChoice: result.tossChoice,
        courtSwapped: result.courtSwapped,
        initialServingSide: result.servingSide,
        initialServerName: result.serverName,
      }
      if (result.receiverName) {
        body.initialReceiverName = result.receiverName
      }
      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        router.push(`/matches/${params.matchId}/score`)
      } else {
        const data = await response.json().catch(() => null)
        alert(data?.error || "Failed to start match", "Error")
      }
    } catch (error) {
      console.error("Start match error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsStarting(false)
    }
  }

  const handleCompleteMatch = async () => {
    if (!match) return

    // Determine winner based on sets won
    let winningSide: "A" | "B" | null = null
    if (match.setsWonBySideA > match.setsWonBySideB) {
      winningSide = "A"
    } else if (match.setsWonBySideB > match.setsWonBySideA) {
      winningSide = "B"
    }

    const message = winningSide
      ? `Complete match and declare ${
          winningSide === "A"
            ? `${match.sideAPlayer1}${match.sideAPlayer2 ? ` & ${match.sideAPlayer2}` : ""}`
            : `${match.sideBPlayer1}${match.sideBPlayer2 ? ` & ${match.sideBPlayer2}` : ""}`
        } as the winner?`
      : "Complete match? The score is currently tied."

    const confirmed = await confirm(message, "Complete Match")
    if (!confirmed) return

    try {
      setIsCompleting(true)
      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
          winningSide: winningSide,
          completedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        await refetch()
        alert("Match completed successfully!", "Success")
      } else {
        alert("Failed to complete match", "Error")
      }
    } catch (error) {
      console.error("Complete match error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleTournamentChange = async (tournamentId: string) => {
    try {
      setIsUpdatingTournament(true)
      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournamentId === "none" ? null : tournamentId,
        }),
      })

      if (response.ok) {
        await refetch()
        alert(
          tournamentId === "none" ? "Match removed from tournament" : "Match attached to tournament",
          "Success"
        )
      } else {
        alert("Failed to update tournament", "Error")
      }
    } catch (error) {
      console.error("Update tournament error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsUpdatingTournament(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete("Are you sure you want to delete this match?")
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/matches")
      } else {
        alert("Failed to delete match", "Error")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading match...</div>
        </main>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Match not found"}</div>
        </main>
      </div>
    )
  }

  // Check if one side has won the match (has majority of sets)
  const setsToWin = Math.ceil(match.setsCount / 2)
  const hasWinner = match.setsWonBySideA >= setsToWin || match.setsWonBySideB >= setsToWin

  // Check if match can be started (tournament validation)
  const tournament = (match as any).tournament
  // Match can start if: no tournament, OR tournament is not UPCOMING (i.e., ONGOING or COMPLETED)
  // Once tournament is manually started, date doesn't matter anymore
  const canStartMatch = !tournament || tournament.status !== "UPCOMING"

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      {/* Toss Dialog */}
      {match && (
        <TossDialog
          open={showTossDialog}
          onOpenChange={setShowTossDialog}
          matchType={match.type as "SINGLES" | "DOUBLES"}
          sideAPlayer1={match.sideAPlayer1}
          sideAPlayer2={match.sideAPlayer2}
          sideBPlayer1={match.sideBPlayer1}
          sideBPlayer2={match.sideBPlayer2}
          onComplete={handleTossComplete}
        />
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/matches")} className="border border-white/10 hover:bg-white/5 text-gray-300">
            ← Back to Matches
          </Button>
          {canManage && (
            <div className="flex gap-2">
              {match.status === "NOT_STARTED" && (
                <>
                  <Button
                    onClick={handleStartMatch}
                    disabled={isStarting || !canStartMatch}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400"
                  >
                    {isStarting ? "Starting..." : "Start Match"}
                  </Button>
                  <Link href={`/matches/${match.id}/edit`}>
                    <Button variant="outline" size="lg" className="border border-white/10 hover:bg-white/5 text-gray-300">
                      Edit Match
                    </Button>
                  </Link>
                  {!canStartMatch && tournament && (
                    <div className="flex items-center px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <span className="text-sm text-amber-400">Tournament not started yet</span>
                    </div>
                  )}
                </>
              )}
              {match.status === "IN_PROGRESS" && (
                <>
                  <Link href={`/matches/${match.id}/score`}>
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400">Continue Scoring</Button>
                  </Link>
                  {hasWinner && (
                    <Button
                      onClick={handleCompleteMatch}
                      disabled={isCompleting}
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400"
                    >
                      {isCompleting ? "Completing..." : "Complete Match"}
                    </Button>
                  )}
                </>
              )}
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Match"}
              </Button>
            </div>
          )}
        </div>

        <Card className="mb-6 border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">{match.name}</CardTitle>
            <CardDescription className="text-gray-400">
              {match.type} • Status: {match.status.replace("_", " ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Players */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-300">Players</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <MatchDetailAvatar name={match.sideAPlayer1} src={match.sideAPlayer1Photo} color="green" />
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                        {match.winningSide === "A" && <span>🏆</span>}
                      </div>
                    </div>
                  </div>
                  {match.sideAPlayer2 && (
                    <div className="flex items-center gap-3 mt-3">
                      <MatchDetailAvatar name={match.sideAPlayer2} src={match.sideAPlayer2Photo} color="green" />
                      <div className="flex-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <PlayerLink name={match.sideAPlayer2} playerMap={playerMap} />
                          {match.winningSide === "A" && <span>🏆</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <MatchDetailAvatar name={match.sideBPlayer1} src={match.sideBPlayer1Photo} color="blue" />
                    <div className="flex-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                        {match.winningSide === "B" && <span>🏆</span>}
                      </div>
                    </div>
                  </div>
                  {match.sideBPlayer2 && (
                    <div className="flex items-center gap-3 mt-3">
                      <MatchDetailAvatar name={match.sideBPlayer2} src={match.sideBPlayer2Photo} color="blue" />
                      <div className="flex-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <PlayerLink name={match.sideBPlayer2} playerMap={playerMap} />
                          {match.winningSide === "B" && <span>🏆</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Match Score */}
            {match.status !== "NOT_STARTED" && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-300">Match Score</h3>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-400 mb-2">
                        <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                        {match.sideAPlayer2 && <>{" & "}<PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></>}
                      </div>
                      <div className="text-6xl font-black tabular-nums text-emerald-400">
                        {match.setsWonBySideA}
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-gray-400">VS</div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-400 mb-2">
                        <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                        {match.sideBPlayer2 && <>{" & "}<PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></>}
                      </div>
                      <div className="text-6xl font-black tabular-nums text-cyan-400">
                        {match.setsWonBySideB}
                      </div>
                    </div>
                  </div>
                  {match.winningSide && (
                    <div className="mt-6 text-center">
                      <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-full font-black text-xl shadow-lg">
                        {match.winningSide === "A"
                          ? `${match.sideAPlayer1}${match.sideAPlayer2 ? ` & ${match.sideAPlayer2}` : ""}`
                          : `${match.sideBPlayer1}${match.sideBPlayer2 ? ` & ${match.sideBPlayer2}` : ""}`} Won!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sets */}
            {match.sets && match.sets.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-gray-300">Set Details</h3>
                <div className="space-y-3">
                  {match.sets.map((set) => (
                    <Card key={set.setNumber} className="border-white/10 bg-white/[0.03]">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 items-center">
                          <span className="font-bold text-white">Set {set.setNumber}</span>
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-xl font-black ${set.winningSide === "A" ? "text-yellow-500" : "text-emerald-400"}`}
                              >
                                {set.scoreA}
                              </span>
                              {set.winningSide === "A" && <span className="text-xl">🏆</span>}
                            </div>
                            <span className="text-gray-400 font-bold">-</span>
                            <div className="flex items-center gap-1">
                              {set.winningSide === "B" && <span className="text-xl">🏆</span>}
                              <span
                                className={`text-xl font-black ${set.winningSide === "B" ? "text-yellow-500" : "text-cyan-400"}`}
                              >
                                {set.scoreB}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {set.winningSide && (
                              <span className="text-sm bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                                {set.winningSide === "A"
                                  ? `${match.sideAPlayer1}${match.sideAPlayer2 ? ` & ${match.sideAPlayer2}` : ""}`
                                  : `${match.sideBPlayer1}${match.sideBPlayer2 ? ` & ${match.sideBPlayer2}` : ""}`} won
                              </span>
                            )}
                            {!set.winningSide &&
                              match.sets.indexOf(set) === match.sets.length - 1 && (
                                <span className="text-sm bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold animate-pulse">
                                  In Progress
                                </span>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Tournament Association */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-300">Tournament</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Select
                    value={(match as any).tournament?.id || "none"}
                    onValueChange={handleTournamentChange}
                    disabled={isUpdatingTournament || match.status !== "NOT_STARTED"}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="No tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No tournament</SelectItem>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(match as any).tournament && (
                    <Link href={`/tournaments/${(match as any).tournament.id}`}>
                      <Button variant="outline" size="sm" className="border border-white/10 hover:bg-white/5 text-gray-300">
                        View Tournament
                      </Button>
                    </Link>
                  )}
                </div>
                {match.status !== "NOT_STARTED" && (
                  <p className="text-xs text-gray-400">
                    Tournament cannot be changed once match has started
                  </p>
                )}
                {tournament && match.status === "NOT_STARTED" && !canStartMatch && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <p className="text-sm text-amber-400 font-medium">
                      Match cannot start until tournament begins
                    </p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      Tournament Status: <span className="font-semibold">{tournament.status}</span>
                    </p>
                    {tournament.status === "UPCOMING" && (
                      <p className="text-xs text-amber-400/80">
                        Please start the tournament from the tournament page first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Match Configuration */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-300">Configuration</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Sets</div>
                  <div className="font-medium text-white">Best of {match.setsCount}</div>
                </div>
                <div>
                  <div className="text-gray-400">Points to Win</div>
                  <div className="font-medium text-white">{match.pointsToWin}</div>
                </div>
                <div>
                  <div className="text-gray-400">Deuce Cap</div>
                  <div className="font-medium text-white">{match.deuceCap}</div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-300">Timestamps</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(match.createdAt).toLocaleString()}</span>
                </div>
                {match.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Started:</span>
                    <span className="text-white">{new Date(match.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {match.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed:</span>
                    <span className="text-white">{new Date(match.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
