"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Header } from "@/components/layout/Header"
import { PlayerSelect } from "@/components/match/PlayerSelect"

export default function NewTournamentMatchPage({ params }: { params: { tournamentId: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tournamentName, setTournamentName] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    type: "SINGLES",
    sideAPlayer1: "",
    sideAPlayer2: "",
    sideBPlayer1: "",
    sideBPlayer2: "",
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
  })

  useEffect(() => {
    // Fetch tournament name
    const fetchTournament = async () => {
      try {
        const response = await fetch(`/api/tournaments/${params.tournamentId}`)
        const data = await response.json()
        if (response.ok) {
          setTournamentName(data.data.tournament.name)
        }
      } catch (error) {
        console.error("Error fetching tournament:", error)
      }
    }
    fetchTournament()
  }, [params.tournamentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        sideAPlayer2: formData.type === "DOUBLES" ? formData.sideAPlayer2 : undefined,
        sideBPlayer2: formData.type === "DOUBLES" ? formData.sideBPlayer2 : undefined,
        tournamentId: params.tournamentId,
      }

      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create match")
      }

      // Redirect to tournament detail page
      router.push(`/tournaments/${params.tournamentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">🏸</span>
              Create Tournament Match
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
              {tournamentName && `🏆 Tournament: ${tournamentName}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700 font-semibold flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  {error}
                </div>
              )}

              {/* Match Name */}
              <div className="space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <Label htmlFor="name" className="text-gray-800 font-bold flex items-center gap-1">
                  <span>📝</span> Match Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Semi-Final 1, Quarter-Final A vs B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-2 focus:border-green-500"
                />
              </div>

              {/* Match Type */}
              <div className="space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <Label htmlFor="type" className="text-blue-800 font-bold flex items-center gap-1">
                  <span>🎯</span> Match Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-2 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLES">🧍 Singles</SelectItem>
                    <SelectItem value="DOUBLES">👥 Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team A Players */}
              <div className="space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                  <span>🟢</span> Team A Players
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="sideAPlayer1">Player 1</Label>
                  <PlayerSelect
                    value={formData.sideAPlayer1}
                    onChange={(value) => setFormData({ ...formData, sideAPlayer1: value })}
                    placeholder="Select or add player..."
                    disabled={isLoading}
                    tournamentId={params.tournamentId}
                  />
                </div>
                {formData.type === "DOUBLES" && (
                  <div className="space-y-2">
                    <Label htmlFor="sideAPlayer2">Player 2</Label>
                    <PlayerSelect
                      value={formData.sideAPlayer2}
                      onChange={(value) => setFormData({ ...formData, sideAPlayer2: value })}
                      placeholder="Select or add partner..."
                      disabled={isLoading}
                      tournamentId={params.tournamentId}
                    />
                  </div>
                )}
              </div>

              {/* Team B Players */}
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                  <span>🔵</span> Team B Players
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="sideBPlayer1">Player 1</Label>
                  <PlayerSelect
                    value={formData.sideBPlayer1}
                    onChange={(value) => setFormData({ ...formData, sideBPlayer1: value })}
                    placeholder="Select or add player..."
                    disabled={isLoading}
                    tournamentId={params.tournamentId}
                  />
                </div>
                {formData.type === "DOUBLES" && (
                  <div className="space-y-2">
                    <Label htmlFor="sideBPlayer2">Player 2</Label>
                    <PlayerSelect
                      value={formData.sideBPlayer2}
                      onChange={(value) => setFormData({ ...formData, sideBPlayer2: value })}
                      placeholder="Select or add partner..."
                      disabled={isLoading}
                      tournamentId={params.tournamentId}
                    />
                  </div>
                )}
              </div>

              {/* Match Configuration */}
              <div className="space-y-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-800 flex items-center gap-2 text-lg">
                  <span>⚙️</span> Match Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setsCount" className="text-purple-700 font-semibold">Sets</Label>
                    <Select
                      value={formData.setsCount.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, setsCount: parseInt(value) })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Single Set</SelectItem>
                        <SelectItem value="3">Best of 3</SelectItem>
                        <SelectItem value="5">Best of 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsToWin" className="text-purple-700 font-semibold">Points to Win</Label>
                    <Input
                      id="pointsToWin"
                      type="number"
                      min="1"
                      value={formData.pointsToWin}
                      onChange={(e) =>
                        setFormData({ ...formData, pointsToWin: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deuceCap" className="text-purple-700 font-semibold">Deuce Cap</Label>
                    <Input
                      id="deuceCap"
                      type="number"
                      min="1"
                      value={formData.deuceCap}
                      onChange={(e) =>
                        setFormData({ ...formData, deuceCap: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/tournaments/${params.tournamentId}`)}
                  disabled={isLoading}
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  ❌ Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-bold">
                  {isLoading ? "Creating... ⏳" : "✅ Create Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
