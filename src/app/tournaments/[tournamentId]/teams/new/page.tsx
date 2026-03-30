"use client"

import { useState, useEffect } from "react"
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
import { compositionTeamSize, compositionRulesFromTournament } from "@/lib/tournamentTeamComposition"

export default function NewTeamPage({ params }: { params: { tournamentId: string } }) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tournamentLoading, setTournamentLoading] = useState(true)
  const [tournamentName, setTournamentName] = useState("")
  const [composition, setComposition] = useState({
    teamRequiredMale: 0,
    teamRequiredFemale: 0,
    teamRequiredKid: 0,
  })

  const [formData, setFormData] = useState({ name: "" })

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [isAuctionMode, setIsAuctionMode] = useState(false)

  const targetTeamSize = compositionTeamSize(composition)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/tournaments/${params.tournamentId}`)
        const data = await res.json()
        if (cancelled || !res.ok) return
        const t = data.data.tournament
        setTournamentName(t.name || "")
        setComposition({
          teamRequiredMale: t.teamRequiredMale ?? 0,
          teamRequiredFemale: t.teamRequiredFemale ?? 0,
          teamRequiredKid: t.teamRequiredKid ?? 0,
        })
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setTournamentLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params.tournamentId])

  useEffect(() => {
    if (isAuctionMode) return
    if (selectedPlayerIds.length === 0) return
    if (captainId && !selectedPlayerIds.includes(captainId)) {
      setCaptainId(null)
    }
  }, [selectedPlayerIds, captainId, isAuctionMode])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      alert("Team name is required", "Validation Error")
      return
    }

    if (!isAuctionMode) {
      if (targetTeamSize === 0) {
        alert(
          "This tournament has no roster composition set. Edit the tournament and set required male / female / kid counts for each team.",
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
      const response = await fetch(`/api/tournaments/${params.tournamentId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          playerIds: selectedPlayerIds,
          logoUrl: logoBase64 || undefined,
          skipCompositionValidation: isAuctionMode,
          captainId: captainId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team")
      }

      router.push(`/tournaments/${params.tournamentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const compositionRules = compositionRulesFromTournament(composition)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">👥</span>
              Create New Team
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
              Set up a team for this tournament
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
                  disabled={isLoading || tournamentLoading}
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

              {/* Tournament roster target (read-only) */}
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                  Tournament roster target
                </h3>
                {tournamentLoading ?
                  <p className="text-sm text-blue-700">Loading tournament…</p>
                : targetTeamSize === 0 ?
                  <div className="text-sm text-blue-900 space-y-2">
                    <p>No composition is set for this tournament yet.</p>
                    <Link
                      href={`/tournaments/${params.tournamentId}/edit`}
                      className="inline-flex text-blue-700 font-semibold underline"
                    >
                      Edit tournament
                    </Link>
                    <span className="text-blue-700"> to set required male / female / kid counts (or use “Players added via Auction”).</span>
                  </div>
                : <>
                    <p className="text-sm text-blue-800">
                      Applies to every team in <span className="font-semibold">{tournamentName}</span>. Change it on the tournament edit page.
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

              {/* Auction Mode Toggle */}
              <div className="flex items-center gap-3 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                <input
                  type="checkbox"
                  id="auctionMode"
                  checked={isAuctionMode}
                  onChange={(e) => setIsAuctionMode(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="auctionMode" className="text-orange-800 font-semibold cursor-pointer">
                  Players added via Auction
                </Label>
                {isAuctionMode && (
                  <span className="text-xs text-orange-600 ml-auto">Composition validation skipped</span>
                )}
              </div>

              {/* Team captain — before roster selection, separate from player picker */}
              <div className="space-y-4 bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200">
                <TeamCaptainSelect
                  mode={isAuctionMode ? "allPlayers" : "roster"}
                  selectedPlayerIds={selectedPlayerIds}
                  value={captainId}
                  onChange={setCaptainId}
                  disabled={isLoading}
                />
              </div>

              {/* Player Selection */}
              <div
                className={`space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200 ${isAuctionMode ? "opacity-50" : ""}`}
              >
                <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                  Select Players
                  {isAuctionMode && (
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
                  disabled={isLoading || tournamentLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-bold"
                >
                  {isLoading ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
