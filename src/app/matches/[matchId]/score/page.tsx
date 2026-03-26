"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { BadmintonCourt } from "@/components/match/BadmintonCourt"
import { ScoreBoard } from "@/components/match/ScoreBoard"
import { ScoreButton } from "@/components/match/ScoreButton"

import { UndoButton } from "@/components/match/UndoButton"
import { Button } from "@/components/ui/button"
import { useMatchData } from "@/hooks/useMatchData"
import { useMatchScore } from "@/hooks/useMatchScore"
import { useUndo } from "@/hooks/useUndo"
import { useAlertDialog } from "@/hooks/useAlertDialog"

export default function ScorePage({ params }: { params: { matchId: string } }) {
  const router = useRouter()
  const { alert, confirm } = useAlertDialog()
  const { match, currentServer, loading, error, refetch } = useMatchData(params.matchId)
  const { addPoint, isScoring } = useMatchScore(params.matchId, refetch)
  const { undo, isUndoing } = useUndo(params.matchId, refetch)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    // Auto-refresh every 5 seconds when match is in progress
    if (match?.status === "IN_PROGRESS") {
      const interval = setInterval(refetch, 5000)
      return () => clearInterval(interval)
    }
  }, [match?.status, refetch])

  const handleScore = async (side: "A" | "B") => {
    try {
      await addPoint(side)
    } catch (error) {
      console.error("Score error:", error)
      // Always refetch to keep UI in sync, even after errors
      await refetch()
      await alert(
        error instanceof Error ? error.message : "Failed to add point. Please try again.",
        "Scoring Error"
      )
    }
  }

  const handleUndo = async () => {
    try {
      await undo()
    } catch (error) {
      console.error("Undo error:", error)
      await refetch()
      await alert(
        error instanceof Error ? error.message : "Failed to undo. Please try again.",
        "Undo Error"
      )
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
      ? `Complete match with ${
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading match...</div>
        </main>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Match not found"}</div>
        </main>
      </div>
    )
  }

  // Find the current set by setNumber (not just the last one in array)
  const currentSet = match.sets.find((s) => s.setNumber === match.currentSetNumber)
  const isCompleted = match.status === "COMPLETED"

  // If currentSet is not found, show error
  if (!currentSet) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">Current set not found</div>
        </main>
      </div>
    )
  }

  // Check if one side has won the match (has majority of sets)
  const setsToWin = Math.ceil(match.setsCount / 2)
  const hasWinner = match.setsWonBySideA >= setsToWin || match.setsWonBySideB >= setsToWin

  // Players change ends after every set, and mid-game in the deciding set
  // (at more than half of pointsToWin, e.g. 11 for 21-point, 3 for 5-point)
  const tossSwapped = match.courtSwapped ?? false
  let endChanges = match.currentSetNumber - 1 // one change per completed set
  const isDecidingSet = match.currentSetNumber === match.setsCount
  if (isDecidingSet) {
    const midGameThreshold = Math.ceil(match.pointsToWin / 2)
    const maxScore = Math.max(currentSet.scoreA, currentSet.scoreB)
    if (maxScore >= midGameThreshold) {
      endChanges += 1
    }
  }
  const effectiveCourtSwapped = endChanges % 2 === 0 ? tossSwapped : !tossSwapped

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Match Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{match.name}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">{match.type} Match</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push(`/matches/${match.id}`)}>
            📋 View Details
          </Button>
        </div>

        {/* Match Completed Banner */}
        {isCompleted && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 border-4 border-yellow-400 p-4 sm:p-8 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-4xl font-black text-yellow-800 mb-4">🎉 Match Completed! 🎉</h2>
            <div className="bg-white rounded-lg p-3 sm:p-4 mb-3 shadow-lg">
              <p className="text-lg sm:text-2xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                🏆 Winner: Side {match.winningSide} 🏆
              </p>
              <p className="text-base sm:text-xl text-gray-800 font-bold mt-2">
                {match.winningSide === "A"
                  ? `${match.sideAPlayer1}${match.sideAPlayer2 ? ` & ${match.sideAPlayer2}` : ""}`
                  : `${match.sideBPlayer1}${match.sideBPlayer2 ? ` & ${match.sideBPlayer2}` : ""}`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xl sm:text-2xl font-black">
              <span className="text-green-600">{match.setsWonBySideA}</span>
              <span className="text-gray-400">-</span>
              <span className="text-blue-600">{match.setsWonBySideB}</span>
            </div>
          </div>
        )}

        {/* Score Board */}
        <div className="mb-8">
          <ScoreBoard
            sideAPlayer1={match.sideAPlayer1}
            sideAPlayer2={match.sideAPlayer2}
            sideBPlayer1={match.sideBPlayer1}
            sideBPlayer2={match.sideBPlayer2}
            currentSetScoreA={currentSet.scoreA}
            currentSetScoreB={currentSet.scoreB}
            setsWonBySideA={match.setsWonBySideA}
            setsWonBySideB={match.setsWonBySideB}
            currentSetNumber={match.currentSetNumber}
            sets={match.sets}
          />
        </div>

        {/* Court Visualization */}
        {currentServer && (
          <div className="mb-6">
            <BadmintonCourt
              sideAPlayer1={match.sideAPlayer1}
              sideAPlayer2={match.sideAPlayer2}
              sideBPlayer1={match.sideBPlayer1}
              sideBPlayer2={match.sideBPlayer2}
              servingSide={currentServer.servingSide}
              serverName={currentServer.serverName}
              scoreA={currentSet.scoreA}
              scoreB={currentSet.scoreB}
              matchType={match.type}
              positions={currentServer.positions}
              courtSwapped={effectiveCourtSwapped}
            />
          </div>
        )}



        {/* Scoring Buttons — order follows court sides */}
        {!isCompleted && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreButton
              side={effectiveCourtSwapped ? "B" : "A"}
              playerName={effectiveCourtSwapped ? match.sideBPlayer1 : match.sideAPlayer1}
              player2Name={(effectiveCourtSwapped ? match.sideBPlayer2 : match.sideAPlayer2) || undefined}
              onScore={handleScore}
              disabled={isScoring || isUndoing}
            />
            <ScoreButton
              side={effectiveCourtSwapped ? "A" : "B"}
              playerName={effectiveCourtSwapped ? match.sideAPlayer1 : match.sideBPlayer1}
              player2Name={(effectiveCourtSwapped ? match.sideAPlayer2 : match.sideBPlayer2) || undefined}
              onScore={handleScore}
              disabled={isScoring || isUndoing}
            />
          </div>
        )}

        {/* Undo and Complete Match Buttons */}
        <div className="flex justify-center gap-4">
          {/* Undo button for corrections */}
          {!isCompleted && <UndoButton onUndo={handleUndo} disabled={isScoring || isUndoing} />}

          {/* Complete Match button only when someone has won */}
          {!isCompleted && hasWinner && (
            <Button
              variant="outline"
              onClick={handleCompleteMatch}
              disabled={isScoring || isUndoing || isCompleting}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              {isCompleting ? "Completing..." : "✓ Complete Match"}
            </Button>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        {!isCompleted && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Tip: You can use keyboard shortcuts for faster scoring (to be implemented)</p>
          </div>
        )}
      </main>
    </div>
  )
}
