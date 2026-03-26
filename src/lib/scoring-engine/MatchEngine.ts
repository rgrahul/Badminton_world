import type {
  MatchConfig,
  MatchState,
  MatchType,
  Players,
  RallyResult,
  ScoreSnapshot,
  Side,
} from "./types"
import { ScoringRules } from "./ScoringRules"
import { SetEngine } from "./SetEngine"
import { ServerTracker } from "./ServerTracker"

export class MatchEngine {
  /**
   * Creates a new match state
   * @param type - Match type (singles/doubles)
   * @param players - Match players
   * @param config - Match configuration
   * @returns Initial match state
   */
  static createMatch(type: MatchType, players: Players, config: MatchConfig): MatchState {
    // Validate config
    const configValidation = ScoringRules.validateConfig(config)
    if (!configValidation.valid) {
      throw new Error(`Invalid config: ${configValidation.error}`)
    }

    // Create initial set
    const initialSet = SetEngine.createNewSet(1)

    // Determine initial server
    const initialServer = ServerTracker.getInitialServer(players, type)

    return {
      config,
      type,
      status: "NOT_STARTED",
      players,
      score: {
        currentSetNumber: 1,
        currentSetScoreA: 0,
        currentSetScoreB: 0,
        setsWonBySideA: 0,
        setsWonBySideB: 0,
        sets: [initialSet],
      },
      server: initialServer,
      rallyCount: 0,
    }
  }

  /**
   * Starts a match
   * @param state - Current match state
   * @returns Updated match state
   */
  static startMatch(state: MatchState): MatchState {
    if (state.status !== "NOT_STARTED") {
      throw new Error("Match has already been started")
    }

    return {
      ...state,
      status: "IN_PROGRESS",
    }
  }

  /**
   * Adds a point to the match
   * @param state - Current match state
   * @param scoringSide - Side that scored the point
   * @returns Rally result with updated state
   */
  static addPoint(state: MatchState, scoringSide: Side): RallyResult {
    if (state.status !== "IN_PROGRESS") {
      throw new Error("Cannot add point: match is not in progress")
    }

    if (state.winningSide) {
      throw new Error("Cannot add point: match is already complete")
    }

    // Get current set
    const currentSetIndex = state.score.sets.length - 1
    const currentSet = state.score.sets[currentSetIndex]

    if (currentSet.isComplete) {
      throw new Error("Cannot add point: current set is complete")
    }

    // Update the current set with the new point
    const updatedSet = SetEngine.addPoint(currentSet, scoringSide, state.config)

    // Update sets array
    const updatedSets = [...state.score.sets]
    updatedSets[currentSetIndex] = updatedSet

    // Update sets won count if set just completed
    let setsWonBySideA = state.score.setsWonBySideA
    let setsWonBySideB = state.score.setsWonBySideB
    let setCompleted = false
    let matchCompleted = false
    let winningSide: Side | undefined = undefined

    if (updatedSet.isComplete && !currentSet.isComplete) {
      // Set just completed
      setCompleted = true
      if (updatedSet.winningSide === "A") {
        setsWonBySideA++
      } else {
        setsWonBySideB++
      }

      // Check if match is won
      const matchWon = ScoringRules.isMatchWon(
        setsWonBySideA,
        setsWonBySideB,
        state.config
      )
      if (matchWon.isWon) {
        matchCompleted = true
        winningSide = matchWon.winningSide
      }
    }

    // Determine new server
    const newServer = ServerTracker.getNextServer(
      state.server,
      scoringSide,
      state.players,
      state.type,
      updatedSet.scoreA,
      updatedSet.scoreB
    )

    // Create new score snapshot
    const newScore: ScoreSnapshot = {
      currentSetNumber: state.score.currentSetNumber,
      currentSetScoreA: updatedSet.scoreA,
      currentSetScoreB: updatedSet.scoreB,
      setsWonBySideA,
      setsWonBySideB,
      sets: updatedSets,
    }

    return {
      scoringSide,
      newScore,
      newServer,
      setCompleted,
      matchCompleted,
      winningSide,
    }
  }

  /**
   * Applies a rally result to the match state
   * @param state - Current match state
   * @param result - Rally result to apply
   * @returns Updated match state
   */
  static applyRallyResult(state: MatchState, result: RallyResult): MatchState {
    const newState: MatchState = {
      ...state,
      score: result.newScore,
      server: result.newServer,
      rallyCount: state.rallyCount + 1,
      winningSide: result.winningSide,
      status: result.matchCompleted ? "COMPLETED" : state.status,
    }

    return newState
  }

  /**
   * Starts a new set after the previous one completes
   * @param state - Current match state
   * @param previousSetWinner - Winner of the previous set
   * @returns Updated match state
   */
  static startNewSet(state: MatchState, previousSetWinner: Side): MatchState {
    const currentSet = state.score.sets[state.score.sets.length - 1]

    if (!currentSet.isComplete) {
      throw new Error("Cannot start new set: current set is not complete")
    }

    if (state.winningSide) {
      throw new Error("Cannot start new set: match is already complete")
    }

    const newSetNumber = state.score.currentSetNumber + 1
    const newSet = SetEngine.createNewSet(newSetNumber)

    // Determine server for new set
    const newServer = ServerTracker.getServerForNewSet(previousSetWinner, state.players, state.type)

    return {
      ...state,
      score: {
        ...state.score,
        currentSetNumber: newSetNumber,
        currentSetScoreA: 0,
        currentSetScoreB: 0,
        sets: [...state.score.sets, newSet],
      },
      server: newServer,
    }
  }

  /**
   * Gets the current match status summary
   * @param state - Match state
   * @returns Human-readable summary
   */
  static getMatchSummary(state: MatchState): string {
    const lines: string[] = []
    lines.push(`Match Status: ${state.status}`)
    lines.push(
      `Sets: ${state.score.setsWonBySideA}-${state.score.setsWonBySideB} (best of ${state.config.setsCount})`
    )

    state.score.sets.forEach((set) => {
      lines.push(SetEngine.getSetSummary(set))
    })

    if (state.winningSide) {
      lines.push(`Winner: Side ${state.winningSide}`)
    } else if (state.status === "IN_PROGRESS") {
      lines.push(`Current Server: ${state.server.serverName} (Side ${state.server.servingSide})`)
    }

    return lines.join("\n")
  }

  /**
   * Validates the entire match state
   * @param state - Match state to validate
   * @returns Validation result
   */
  static validateMatchState(state: MatchState): { valid: boolean; error?: string } {
    // Validate config
    const configValidation = ScoringRules.validateConfig(state.config)
    if (!configValidation.valid) {
      return configValidation
    }

    // Validate server
    const serverValidation = ServerTracker.validateServer(state.server, state.players)
    if (!serverValidation.valid) {
      return serverValidation
    }

    // Validate sets
    for (const set of state.score.sets) {
      const setValidation = SetEngine.validateSet(set, state.config)
      if (!setValidation.valid) {
        return setValidation
      }
    }

    // Validate sets won count
    const completedSets = state.score.sets.filter((s) => s.isComplete)
    const actualSetsWonA = completedSets.filter((s) => s.winningSide === "A").length
    const actualSetsWonB = completedSets.filter((s) => s.winningSide === "B").length

    if (
      state.score.setsWonBySideA !== actualSetsWonA ||
      state.score.setsWonBySideB !== actualSetsWonB
    ) {
      return {
        valid: false,
        error: "Sets won count does not match completed sets",
      }
    }

    // Validate match completion
    const matchWon = ScoringRules.isMatchWon(
      state.score.setsWonBySideA,
      state.score.setsWonBySideB,
      state.config
    )
    if (matchWon.isWon && !state.winningSide) {
      return {
        valid: false,
        error: "Match should be complete but winningSide is not set",
      }
    }

    if (!matchWon.isWon && state.winningSide) {
      return {
        valid: false,
        error: "Match is marked as complete but not enough sets won",
      }
    }

    return { valid: true }
  }
}
