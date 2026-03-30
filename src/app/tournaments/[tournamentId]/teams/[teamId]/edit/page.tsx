"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { TeamPlayerPicker } from "@/components/team/TeamPlayerPicker"
import { TeamCaptainSelect } from "@/components/team/TeamCaptainSelect"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { toGoogleDriveDisplayUrl } from "@/lib/googleDriveImageUrl"
import { compositionTeamSize, compositionRulesFromTournament } from "@/lib/tournamentTeamComposition"

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
  logoUrl: string | null
  captainId: string | null
  playersAddedViaAuction: boolean
  captain: { id: string; name: string } | null
  tournament: {
    id: string
    name: string
    teamRequiredMale: number
    teamRequiredFemale: number
    teamRequiredKid: number
  }
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

  const [formData, setFormData] = useState({ name: "" })
  const [composition, setComposition] = useState({
    teamRequiredMale: 0,
    teamRequiredFemale: 0,
    teamRequiredKid: 0,
  })
  const [tournamentName, setTournamentName] = useState("")

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [captainPreview, setCaptainPreview] = useState<{ id: string; name: string } | null>(null)
  const [playersAddedViaAuction, setPlayersAddedViaAuction] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  const targetTeamSize = compositionTeamSize(composition)
  const compositionRules = compositionRulesFromTournament(composition)

  useEffect(() => {
    if (playersAddedViaAuction) return
    if (selectedPlayerIds.length === 0) return
    if (captainId && !selectedPlayerIds.includes(captainId)) {
      setCaptainId(null)
    }
  }, [selectedPlayerIds, captainId, playersAddedViaAuction])

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
      setFormData({ name: team.name })
      setTournamentName(team.tournament.name)
      setComposition({
        teamRequiredMale: team.tournament.teamRequiredMale,
        teamRequiredFemale: team.tournament.teamRequiredFemale,
        teamRequiredKid: team.tournament.teamRequiredKid,
      })
      setSelectedPlayerIds(team.players.map((tp) => tp.playerId))
      setCaptainId(team.captainId ?? null)
      setCaptainPreview(team.captain ? { id: team.captain.id, name: team.captain.name } : null)
      setPlayersAddedViaAuction(team.playersAddedViaAuction ?? false)
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

    if (!playersAddedViaAuction) {
      if (targetTeamSize === 0) {
        alert(
          "This tournament has no roster composition set. Edit the tournament first.",
          "Validation Error"
        )
        return
      }

      if (selectedPlayerIds.length !== targetTeamSize) {
        alert(
          `Please select exactly ${targetTeamSize} players. Currently selected: ${selectedPlayerIds.length}`,
          "Validation Error"
        )
        return
      }
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
            playerIds: selectedPlayerIds,
            logoUrl: logoBase64 || null,
            captainId,
            playersAddedViaAuction,
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
                        src={toGoogleDriveDisplayUrl(logoPreview)}
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

              {/* Players added via Auction */}
              <div className="flex items-center gap-3 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <input
                  type="checkbox"
                  id="editAuctionMode"
                  checked={playersAddedViaAuction}
                  onChange={(e) => setPlayersAddedViaAuction(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="editAuctionMode" className="text-orange-800 font-semibold cursor-pointer">
                  Players added via Auction
                </Label>
                {playersAddedViaAuction && (
                  <span className="text-xs text-orange-600 ml-auto">Composition validation relaxed</span>
                )}
              </div>

              {/* Tournament roster target (read-only) */}
              <div
                className={`space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200 ${playersAddedViaAuction ? "opacity-50" : ""}`}
              >
                <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                  Tournament roster target
                  {playersAddedViaAuction && (
                    <span className="text-xs font-normal text-blue-500">(optional in auction mode)</span>
                  )}
                </h3>
                {targetTeamSize === 0 ?
                  <div className="text-sm text-blue-900 space-y-2">
                    <p>No composition is set for this tournament yet.</p>
                    <Link
                      href={`/tournaments/${params.tournamentId}/edit`}
                      className="inline-flex text-blue-700 font-semibold underline"
                    >
                      Edit tournament
                    </Link>
                  </div>
                : <>
                    <p className="text-sm text-blue-800">
                      Applies to every team in <span className="font-semibold">{tournamentName}</span>.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-white/80 border border-blue-200 p-3 text-center">
                        <div className="text-xl font-bold text-blue-700">{composition.teamRequiredMale}</div>
                        <div className="text-xs text-blue-600 font-medium">Male</div>
                      </div>
                      <div className="rounded-lg bg-white/80 border border-pink-200 p-3 text-center">
                        <div className="text-xl font-bold text-pink-700">{composition.teamRequiredFemale}</div>
                        <div className="text-xs text-pink-600 font-medium">Female</div>
                      </div>
                      <div className="rounded-lg bg-white/80 border border-amber-200 p-3 text-center">
                        <div className="text-xl font-bold text-amber-700">{composition.teamRequiredKid}</div>
                        <div className="text-xs text-amber-600 font-medium">Kid</div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-700 font-medium bg-blue-50 rounded p-2">
                      Target squad size: <span className="font-bold">{targetTeamSize}</span> players total
                      <span className="font-normal"> (including captain)</span>
                    </div>
                  </>
                }
              </div>

              {/* Team captain — before roster selection, separate from player picker */}
              <div className="space-y-4 bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200">
                <TeamCaptainSelect
                  mode={
                    playersAddedViaAuction || selectedPlayerIds.length === 0 ? "allPlayers" : "roster"
                  }
                  selectedPlayerIds={selectedPlayerIds}
                  value={captainId}
                  onChange={(id) => {
                    setCaptainId(id)
                    setCaptainPreview(null)
                  }}
                  captainPreview={captainPreview}
                  disabled={isLoading}
                />
              </div>

              {/* Player Selection */}
              <div
                className={`space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200 ${playersAddedViaAuction ? "opacity-50" : ""}`}
              >
                <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                  Select Players
                  {playersAddedViaAuction && (
                    <span className="text-xs font-normal text-green-600">(optional in auction mode)</span>
                  )}
                </h3>
                <TeamPlayerPicker
                  selectedPlayerIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                  compositionRules={compositionRules}
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
