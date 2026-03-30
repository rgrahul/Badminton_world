export interface AuctionTeam {
  id: string
  auctionId: string
  name: string
  budget: number
  spent: number
  logoUrl?: string | null
  soldPlayers: AuctionPlayerWithDetails[]
}

export interface AuctionPlayerWithDetails {
  id: string
  auctionId: string
  playerId: string
  basePrice: number
  status: "AVAILABLE" | "SOLD" | "UNSOLD"
  soldPrice?: number | null
  soldToTeamId?: string | null
  soldAt?: string | null
  sortOrder: number
  player: {
    id: string
    name: string
    email?: string | null
    mobileNumber?: string | null
    age?: number | null
    gender?: string | null
    experience?: string | null
    lastPlayed?: string | null
    skillCategory?: string | null
    profilePhoto?: string | null
  }
  soldToTeam?: { id: string; name: string } | null
}

export interface AuctionFull {
  id: string
  name: string
  status: "SETUP" | "LIVE" | "PAUSED" | "COMPLETED"
  tournamentId?: string | null
  tournament?: { id: string; name: string } | null
  teams: AuctionTeam[]
  players: AuctionPlayerWithDetails[]
  _count: { teams: number; players: number }
}

export interface AuctionSummary {
  id: string
  name: string
  status: "SETUP" | "LIVE" | "PAUSED" | "COMPLETED"
  tournamentId?: string | null
  tournament?: { id: string; name: string } | null
  _count: { teams: number; players: number }
  createdAt: string
}

export interface AuctionStats {
  total: number
  available: number
  sold: number
  unsold: number
  totalSpent: number
}

export interface BidHistoryEntry {
  id: string
  playerName: string
  teamName: string
  amount: number
  timestamp: Date
}
