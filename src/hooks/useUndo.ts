import { useState } from "react"

export function useUndo(matchId: string, onSuccess?: () => void) {
  const [isUndoing, setIsUndoing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const undo = async () => {
    try {
      setIsUndoing(true)
      setError(null)

      const response = await fetch(`/api/matches/${matchId}/undo`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to undo")
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
      setIsUndoing(false)
    }
  }

  return { undo, isUndoing, error }
}
