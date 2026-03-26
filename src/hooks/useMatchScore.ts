import { useState } from "react"

export function useMatchScore(matchId: string, onSuccess?: () => void) {
  const [isScoring, setIsScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPoint = async (scoringSide: "A" | "B") => {
    try {
      setIsScoring(true)
      setError(null)

      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoringSide }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add point")
      }

      if (onSuccess) {
        onSuccess()
      }

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setIsScoring(false)
    }
  }

  return { addPoint, isScoring, error }
}
