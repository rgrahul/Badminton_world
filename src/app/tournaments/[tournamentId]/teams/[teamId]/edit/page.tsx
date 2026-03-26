"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { TeamPlayerPicker } from "@/components/team/TeamPlayerPicker"
import { useAlertDialog } from "@/hooks/useAlertDialog"

interface TeamPlayer {
  playerId: string
  category: string
  player: {
    id: string
    name: string
  }
}

interface Team {
  id: string
  name: string
  teamSize: number
  requiredMale: number
  requiredFemale: number
  requiredKid: number
  logoUrl: string | null
  players: TeamPlayer[]
}

export default function EditTeamPage({
  params,
}: {
  params: { tournamentId: string; teamId: string }
}) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    requiredMale: 0,
    requiredFemale: 0,
    requiredKid: 0,
  })

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  const teamSize = formData.requiredMale + formData.requiredFemale + formData.requiredKid

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file", "Invalid File")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB", "File Too Large")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setLogoBase64(result)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    fetchTeam()
  }, [params.teamId])

  const fetchTeam = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/teams/${params.teamId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team")
      }

      const team: Team = data.data.team
      setFormData({
        name: team.name,
        requiredMale: team.requiredMale,
        requiredFemale: team.requiredFemale,
        requiredKid: team.requiredKid,
      })
      setSelectedPlayerIds(team.players.map((tp) => tp.playerId))
      if (team.logoUrl) {
        setLogoPreview(team.logoUrl)
        setLogoBase64(team.logoUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      alert("Team name is required", "Validation Error")
      return
    }

    if (teamSize === 0) {
      alert("Team size must be greater than 0. Set composition rules.", "Validation Error")
      return
    }

    if (selectedPlayerIds.length !== teamSize) {
      alert(
        `Please select exactly ${teamSize} players. Currently selected: ${selectedPlayerIds.length}`,
        "Validation Error"
      )
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/teams/${params.teamId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            teamSize,
            requiredMale: formData.requiredMale,
            requiredFemale: formData.requiredFemale,
            requiredKid: formData.requiredKid,
            playerIds: selectedPlayerIds,
            logoUrl: logoBase64 || null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update team")
      }

      router.push(`/tournaments/${params.tournamentId}/teams/${params.teamId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading team...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">👥</span>
              Edit Team
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
              Update team details and players
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700 font-semibold flex items-center gap-2">
                  <span className="text-xl">!!</span>
                  {error}
                </div>
              )}

              {/* Team Name */}
              <div className="space-y-2 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <Label htmlFor="name" className="text-yellow-800 font-bold flex items-center gap-1">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Thunder Hawks"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-2 focus:border-yellow-500"
                />
              </div>

              {/* Team Logo */}
              <div className="space-y-2 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <Label className="text-purple-800 font-bold flex items-center gap-1">
                  Team Logo
                </Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Team logo preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-300"
                      />
                      <button
                        type="button"
                        onClick={() => { setLogoPreview(null); setLogoBase64(null) }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-purple-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isLoading}
                      className="border-2 focus:border-purple-500 text-sm"
                    />
                    <p className="text-xs text-purple-600 mt-1">Optional. Max 5MB. PNG, JPG, or SVG.</p>
                  </div>
                </div>
              </div>

              {/* Composition Rules */}
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                  Composition Rules
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requiredMale" className="text-blue-700 font-semibold">
                      Required Male
                    </Label>
                    <Input
                      id="requiredMale"
                      type="number"
                      min="0"
                      value={formData.requiredMale}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredMale: parseInt(e.target.value) || 0 })
                      }
                      disabled={isLoading}
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredFemale" className="text-blue-700 font-semibold">
                      Required Female
                    </Label>
                    <Input
                      id="requiredFemale"
                      type="number"
                      min="0"
                      value={formData.requiredFemale}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredFemale: parseInt(e.target.value) || 0 })
                      }
                      disabled={isLoading}
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredKid" className="text-blue-700 font-semibold">
                      Required Kid
                    </Label>
                    <Input
                      id="requiredKid"
                      type="number"
                      min="0"
                      value={formData.requiredKid}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredKid: parseInt(e.target.value) || 0 })
                      }
                      disabled={isLoading}
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-blue-700 font-medium bg-blue-50 rounded p-2">
                  Total Team Size: <span className="font-bold">{teamSize}</span> players
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                  Select Players
                </h3>
                <TeamPlayerPicker
                  selectedPlayerIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                  compositionRules={{
                    requiredMale: formData.requiredMale,
                    requiredFemale: formData.requiredFemale,
                    requiredKid: formData.requiredKid,
                  }}
                  tournamentId={params.tournamentId}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-bold"
                >
                  {isLoading ? "Updating..." : "Update Team"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
