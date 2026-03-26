import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { MatchRepository } from "@/lib/db/repositories/MatchRepository"
import { SetRepository } from "@/lib/db/repositories/SetRepository"
import { RallyRepository } from "@/lib/db/repositories/RallyRepository"
import { SetEngine } from "@/lib/scoring-engine/SetEngine"
import { errorResponse, successResponse } from "@/lib/api/responses"

export async function POST(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return errorResponse("Unauthorized", 401)
    }

    // Get match with details
    const match = await MatchRepository.findByIdWithDetails(params.matchId)
    if (!match) {
      return errorResponse("Match not found", 404)
    }

    if (match.status === "NOT_STARTED") {
      return errorResponse("Match has not started yet")
    }

    // Get last active rally
    const lastRally = await RallyRepository.findLastByMatchId(match.id)
    if (!lastRally) {
      return errorResponse("No rally to undo")
    }

    // Get the set for this rally
    const rallySet = await SetRepository.findById(lastRally.setId)
    if (!rallySet) {
      return errorResponse("Set not found")
    }

    // Soft delete the rally
    await RallyRepository.softDelete(lastRally.id)

    // Get previous rally to determine new score
    const remainingRallies = await RallyRepository.findBySetId(rallySet.id)
    const previousRally = remainingRallies[remainingRallies.length - 1]

    let newScoreA = 0
    let newScoreB = 0
    let isSetComplete = false
    let winningSide: string | null = null

    if (previousRally) {
      newScoreA = previousRally.scoreA
      newScoreB = previousRally.scoreB

      // Check if set is still complete after undo
      const setWon = SetEngine.validateSet(
        {
          setNumber: rallySet.setNumber,
          scoreA: newScoreA,
          scoreB: newScoreB,
          isComplete: false,
          winningSide: undefined,
        },
        {
          setsCount: match.setsCount,
          pointsToWin: match.pointsToWin,
          deuceCap: match.deuceCap,
        }
      )

      if (setWon.valid) {
        // Re-check if set is won
        const currentSet = {
          setNumber: rallySet.setNumber,
          scoreA: newScoreA,
          scoreB: newScoreB,
          isComplete: false,
        }
        // We need to manually check if this score completes the set
        // For now, assume it doesn't if we removed a point
        isSetComplete = false
      }
    }

    // Update set scores and reopen the set
    await SetRepository.update(rallySet.id, {
      scoreA: newScoreA,
      scoreB: newScoreB,
      winningSide: null, // Always clear winningSide when undoing
      completedAt: null, // Always reopen the set when undoing
    })

    // Check if we need to delete an empty next set and move back to this set
    const currentSet = match.sets.find((s) => s.setNumber === match.currentSetNumber)
    const isCurrentSetEmpty =
      currentSet &&
      currentSet.setNumber > rallySet.setNumber &&
      currentSet.scoreA === 0 &&
      currentSet.scoreB === 0

    // Determine what needs to be updated in the match
    const updates: any = {}
    let shouldDeleteEmptySet = false

    // If the set was completed before undo, decrement sets won and clear match winner
    if (rallySet.completedAt) {
      if (rallySet.winningSide === "A") {
        updates.setsWonBySideA = Math.max(0, match.setsWonBySideA - 1)
      } else if (rallySet.winningSide === "B") {
        updates.setsWonBySideB = Math.max(0, match.setsWonBySideB - 1)
      }
      // Always clear match winningSide when reopening a completed set,
      // since the score route sets winningSide even while status is IN_PROGRESS
      updates.winningSide = null
    }

    // If match was completed, reopen it
    if (match.status === "COMPLETED") {
      updates.status = "IN_PROGRESS"
      updates.winningSide = null
      updates.completedAt = null
    }

    // Always ensure currentSetNumber points to the set we're undoing in
    if (match.currentSetNumber !== rallySet.setNumber) {
      updates.currentSetNumber = rallySet.setNumber
    }

    // If current set is empty and ahead of the rally set, delete it
    if (isCurrentSetEmpty && currentSet) {
      shouldDeleteEmptySet = true
      updates.currentSetNumber = rallySet.setNumber
    }

    // Update match if needed
    if (Object.keys(updates).length > 0) {
      await MatchRepository.update(match.id, updates)
    }

    // Delete empty next set if needed
    if (shouldDeleteEmptySet && currentSet) {
      await SetRepository.delete(currentSet.id)
    }

    return successResponse({
      message: "Rally undone successfully",
      newScore: {
        scoreA: newScoreA,
        scoreB: newScoreB,
      },
      setDeleted: shouldDeleteEmptySet,
      movedBackToSet: shouldDeleteEmptySet ? rallySet.setNumber : null,
    })
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message)
    }

    console.error("Undo rally error:", error)
    return errorResponse("Internal server error", 500)
  }
}
