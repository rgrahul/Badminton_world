export type MatchType = "SINGLES" | "DOUBLES"
export type MatchStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED"
export type Side = "A" | "B"

export interface MatchConfig {
  setsCount: number // Best of 3 or 5
  pointsToWin: number // Points needed to win a set (default 21)
  deuceCap: number // Maximum points in deuce (default 30)
}

export interface Players {
  sideA: {
    player1: string
    player2?: string // undefined for singles
  }
  sideB: {
    player1: string
    player2?: string // undefined for singles
  }
}

export interface SetScore {
  setNumber: number
  scoreA: number
  scoreB: number
  winningSide?: Side
  isComplete: boolean
}

export interface ScoreSnapshot {
  currentSetNumber: number
  currentSetScoreA: number
  currentSetScoreB: number
  setsWonBySideA: number
  setsWonBySideB: number
  sets: SetScore[]
}

export interface ServerInfo {
  servingSide: Side
  serverName: string
  // For doubles: track which player is in which court position
  // This is essential for correct BWF doubles serving rules
  positions?: {
    sideA: {
      rightCourt: string  // player name currently in right service court
      leftCourt: string   // player name currently in left service court
    }
    sideB: {
      rightCourt: string
      leftCourt: string
    }
  }
}

export interface MatchState {
  config: MatchConfig
  type: MatchType
  status: MatchStatus
  players: Players
  score: ScoreSnapshot
  server: ServerInfo
  winningSide?: Side
  rallyCount: number
}

export interface RallyResult {
  scoringSide: Side
  newScore: ScoreSnapshot
  newServer: ServerInfo
  setCompleted: boolean
  matchCompleted: boolean
  winningSide?: Side
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export enum MatchEvent {
  MATCH_STARTED = "MATCH_STARTED",
  POINT_SCORED = "POINT_SCORED",
  SET_COMPLETED = "SET_COMPLETED",
  MATCH_COMPLETED = "MATCH_COMPLETED",
  RALLY_UNDONE = "RALLY_UNDONE",
}
