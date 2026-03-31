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
import { useAlertDialog } from "@/hooks/useAlertDialog"

export default function EditMatchPage({ params }: { params: { matchId: string } }) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

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
    fetchMatch()
  }, [params.matchId])

  const fetchMatch = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(`/api/matches/${params.matchId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch match")
      }

      const match = data.data.match

      // Check if match has started
      if (match.status !== "NOT_STARTED") {
        alert("Cannot edit match that has already started")
        router.push(`/matches/${params.matchId}`)
        return
      }

      setFormData({
        name: match.name || "",
        type: match.type || "SINGLES",
        sideAPlayer1: match.sideAPlayer1 || "",
        sideAPlayer2: match.sideAPlayer2 || "",
        sideBPlayer1: match.sideBPlayer1 || "",
        sideBPlayer2: match.sideBPlayer2 || "",
        setsCount: match.setsCount || 3,
        pointsToWin: match.pointsToWin || 21,
        deuceCap: match.deuceCap || 30,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        sideAPlayer2: formData.type === "DOUBLES" ? formData.sideAPlayer2 : undefined,
        sideBPlayer2: formData.type === "DOUBLES" ? formData.sideBPlayer2 : undefined,
      }

      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update match")
      }

      alert("Match updated successfully!")
      router.push(`/matches/${params.matchId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center text-gray-400">Loading match...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Edit Match</CardTitle>
            <CardDescription className="text-gray-400">Update match details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Match Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Match Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Friendly Match, Tournament Round 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Match Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-300">Match Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLES">Singles</SelectItem>
                    <SelectItem value="DOUBLES">Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Team A Players */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-300">Team A Players</h3>
                <div className="space-y-2">
                  <Label htmlFor="sideAPlayer1" className="text-gray-300">Player 1</Label>
                  <PlayerSelect
                    value={formData.sideAPlayer1}
                    onChange={(value) => setFormData({ ...formData, sideAPlayer1: value })}
                    placeholder="Select or add player..."
                    disabled={isLoading}
                  />
                </div>
                {formData.type === "DOUBLES" && (
                  <div className="space-y-2">
                    <Label htmlFor="sideAPlayer2" className="text-gray-300">Player 2</Label>
                    <PlayerSelect
                      value={formData.sideAPlayer2}
                      onChange={(value) => setFormData({ ...formData, sideAPlayer2: value })}
                      placeholder="Select or add partner..."
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Team B Players */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-300">Team B Players</h3>
                <div className="space-y-2">
                  <Label htmlFor="sideBPlayer1" className="text-gray-300">Player 1</Label>
                  <PlayerSelect
                    value={formData.sideBPlayer1}
                    onChange={(value) => setFormData({ ...formData, sideBPlayer1: value })}
                    placeholder="Select or add player..."
                    disabled={isLoading}
                  />
                </div>
                {formData.type === "DOUBLES" && (
                  <div className="space-y-2">
                    <Label htmlFor="sideBPlayer2" className="text-gray-300">Player 2</Label>
                    <PlayerSelect
                      value={formData.sideBPlayer2}
                      onChange={(value) => setFormData({ ...formData, sideBPlayer2: value })}
                      placeholder="Select or add partner..."
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Match Configuration */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-300">Match Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setsCount" className="text-gray-400">Sets</Label>
                    <Select
                      value={formData.setsCount.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, setsCount: parseInt(value) })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Best of 3</SelectItem>
                        <SelectItem value="5">Best of 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pointsToWin" className="text-gray-400">Points to Win</Label>
                    <Input
                      id="pointsToWin"
                      type="number"
                      min="1"
                      value={formData.pointsToWin}
                      onChange={(e) =>
                        setFormData({ ...formData, pointsToWin: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deuceCap" className="text-gray-400">Deuce Cap</Label>
                    <Input
                      id="deuceCap"
                      type="number"
                      min="1"
                      value={formData.deuceCap}
                      onChange={(e) =>
                        setFormData({ ...formData, deuceCap: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/matches/${params.matchId}`)}
                  disabled={isLoading}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400">
                  {isLoading ? "Updating..." : "Update Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
