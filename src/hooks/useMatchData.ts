import { useEffect, useState } from "react"

interface Match {
  id: string
  name: string
  type: string
  status: string
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  sideAPlayer1Photo?: string | null
  sideAPlayer2Photo?: string | null
  sideBPlayer1Photo?: string | null
  sideBPlayer2Photo?: string | null
  currentSetNumber: number
  setsWonBySideA: number
  setsWonBySideB: number
  winningSide?: string | null
  setsCount: number
  pointsToWin: number
  deuceCap: number
  createdAt: string
  courtSwapped?: boolean
  startedAt?: string | null
  completedAt?: string | null
  sets: Array<{
    setNumber: number
    scoreA: number
    scoreB: number
    winningSide?: string | null
  }>
}

interface CurrentServer {
  servingSide: string
  serverName: string
  positions?: {
    sideA: { rightCourt: string; leftCourt: string }
    sideB: { rightCourt: string; leftCourt: string }
  }
}

export function useMatchData(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null)
  const [currentServer, setCurrentServer] = useState<CurrentServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch match")
      }

      setMatch(data.data.match)
      setCurrentServer(data.data.currentServer || null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()
  }, [matchId])

  return { match, currentServer, loading, error, refetch: fetchMatch }
}
