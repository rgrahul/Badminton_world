"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { useAlertDialog } from "@/hooks/useAlertDialog"

interface Team {
  id: string
  name: string
  teamSize: number
  requiredMale: number
  requiredFemale: number
  requiredKid: number
  players: {
    playerId: string
    category: string
    player: { id: string; name: string; age: number | null; gender: string | null }
  }[]
}

export default function NewTeamMatchPage({ params }: { params: { tournamentId: string } }) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    teamAId: "",
    teamBId: "",
    category: "ADULT" as "ADULT" | "KIDS",
    genderRestriction: false,
    menDoublesCount: 0,
    womenDoublesCount: 0,
    mixedDoublesCount: 0,
    menSinglesCount: 0,
    womenSinglesCount: 0,
    kidsSinglesCount: 0,
    kidsDoublesCount: 0,
    setsCount: 3,
    pointsToWin: 21,
    deuceCap: 30,
    allowPlayerReuse: false,
  })

  useEffect(() => {
    fetchTeams()
  }, [params.tournamentId])

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}/teams`)
      const data = await response.json()
      if (response.ok) {
        setTeams(data.data.teams)
      }
    } catch (err) {
      console.error("Failed to fetch teams:", err)
    } finally {
      setTeamsLoading(false)
    }
  }

  // Calculate totals
  const totalFixtures =
    formData.menDoublesCount +
    formData.womenDoublesCount +
    formData.mixedDoublesCount +
    formData.menSinglesCount +
    formData.womenSinglesCount +
    formData.kidsSinglesCount +
    formData.kidsDoublesCount

  const getRequiredBreakdown = () => {
    if (formData.category === "ADULT") {
      const male =
        formData.menDoublesCount * 2 +
        formData.menSinglesCount +
        formData.mixedDoublesCount
      const female =
        formData.womenDoublesCount * 2 +
        formData.womenSinglesCount +
        formData.mixedDoublesCount
      return { male, female, kids: 0, total: male + female }
    }
    if (formData.genderRestriction) {
      const male =
        formData.menDoublesCount * 2 +
        formData.menSinglesCount +
        formData.mixedDoublesCount
      const female =
        formData.womenDoublesCount * 2 +
        formData.womenSinglesCount +
        formData.mixedDoublesCount
      return { male, female, kids: male + female, total: male + female }
    }
    const kids = formData.kidsSinglesCount + formData.kidsDoublesCount * 2
    return { male: 0, female: 0, kids, total: kids }
  }

  const breakdown = getRequiredBreakdown()

  // Reset format counts when category changes
  const handleCategoryChange = (newCategory: "ADULT" | "KIDS") => {
    setFormData({
      ...formData,
      category: newCategory,
      genderRestriction: false,
      menDoublesCount: 0,
      womenDoublesCount: 0,
      mixedDoublesCount: 0,
      menSinglesCount: 0,
      womenSinglesCount: 0,
      kidsSinglesCount: 0,
      kidsDoublesCount: 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      alert("Match name is required", "Validation Error")
      return
    }
    if (!formData.teamAId || !formData.teamBId) {
      alert("Please select both teams", "Validation Error")
      return
    }
    if (formData.teamAId === formData.teamBId) {
      alert("Team A and Team B must be different", "Validation Error")
      return
    }
    if (totalFixtures === 0) {
      alert("At least one fixture type must have a count greater than 0", "Validation Error")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create team match")
      }

      router.push(
        `/tournaments/${params.tournamentId}/team-matches/${data.data.teamMatch.id}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const showAdultFormats =
    formData.category === "ADULT" ||
    (formData.category === "KIDS" && formData.genderRestriction)
  const showKidsFormats =
    formData.category === "KIDS" && !formData.genderRestriction

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.03] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-black text-white">
              Create Team Match
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-400 font-medium">
              Set up a structured match between two teams
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/20 border border-red-500/20 p-4 text-sm text-red-300 font-semibold">
                  {error}
                </div>
              )}

              {/* Match Name */}
              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                <Label htmlFor="name" className="text-gray-300 font-bold">
                  Match Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Semi-Final: Team A vs Team B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Select Teams */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">Select Teams</h3>
                {teamsLoading ? (
                  <p className="text-sm text-gray-400">Loading teams...</p>
                ) : teams.length < 2 ? (
                  <p className="text-sm text-red-300">
                    Need at least 2 teams in this tournament to create a team match.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamA" className="text-gray-300 font-semibold">
                        Team A
                      </Label>
                      <select
                        id="teamA"
                        value={formData.teamAId}
                        onChange={(e) =>
                          setFormData({ ...formData, teamAId: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">Select team...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.teamSize} players)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamB" className="text-gray-300 font-semibold">
                        Team B
                      </Label>
                      <select
                        id="teamB"
                        value={formData.teamBId}
                        onChange={(e) =>
                          setFormData({ ...formData, teamBId: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">Select team...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.teamSize} players)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">Category</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("ADULT")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      formData.category === "ADULT"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md"
                        : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("KIDS")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      formData.category === "KIDS"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md"
                        : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Kids
                  </button>
                </div>
                {formData.category === "KIDS" && (
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.genderRestriction}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            genderRestriction: e.target.checked,
                            // Reset counts when toggling
                            menDoublesCount: 0,
                            womenDoublesCount: 0,
                            mixedDoublesCount: 0,
                            menSinglesCount: 0,
                            womenSinglesCount: 0,
                            kidsSinglesCount: 0,
                            kidsDoublesCount: 0,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-300">
                        Enable gender restriction (separate boys/girls fixtures)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Format Builder */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">Format Builder</h3>
                <p className="text-sm text-gray-400">
                  Set the number of each fixture type for this team match.
                </p>

                {showAdultFormats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Men&apos;s Doubles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.menDoublesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            menDoublesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Women&apos;s Doubles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.womenDoublesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            womenDoublesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Mixed Doubles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.mixedDoublesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mixedDoublesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Men&apos;s Singles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.menSinglesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            menSinglesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Women&apos;s Singles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.womenSinglesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            womenSinglesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}

                {showKidsFormats && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Kids Singles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.kidsSinglesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kidsSinglesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-300 font-semibold text-xs">
                        Kids Doubles
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.kidsDoublesCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kidsDoublesCount: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Player Reuse */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowPlayerReuse}
                    onChange={(e) =>
                      setFormData({ ...formData, allowPlayerReuse: e.target.checked })
                    }
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-bold text-white">
                      Allow players to play in multiple fixtures
                    </span>
                    <p className="text-xs text-gray-400">
                      When enabled, the same player can be assigned to more than one fixture in this team match.
                    </p>
                  </div>
                </label>
              </div>

              {/* Scoring Format */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">Scoring Format</h3>
                <p className="text-sm text-gray-400">
                  Applied to all fixture matches in this team match.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-300 font-semibold text-xs">
                      Best of (Sets)
                    </Label>
                    <select
                      value={formData.setsCount}
                      onChange={(e) =>
                        setFormData({ ...formData, setsCount: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={1}>1 Set</option>
                      <option value={3}>3 Sets</option>
                      <option value={5}>5 Sets</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 font-semibold text-xs">
                      Points to Win
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.pointsToWin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsToWin: parseInt(e.target.value) || 21,
                        })
                      }
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300 font-semibold text-xs">
                      Deuce Cap
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={formData.deuceCap}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deuceCap: parseInt(e.target.value) || 30,
                        })
                      }
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-lg">
                <h3 className="font-bold text-white text-lg">Preview</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 text-xs font-medium">Total Fixtures</div>
                    <div className="text-2xl font-bold text-white">{totalFixtures}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-gray-400 text-xs font-medium">Players per Team</div>
                    <div className="text-2xl font-bold text-white">{breakdown.total}</div>
                  </div>
                </div>
                {breakdown.total > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {breakdown.male > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-300">
                        {breakdown.male} Male
                      </span>
                    )}
                    {breakdown.female > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-500/20 text-pink-300">
                        {breakdown.female} Female
                      </span>
                    )}
                    {breakdown.kids > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300">
                        {breakdown.kids} Kid
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || totalFixtures === 0}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? "Creating..." : "Create Team Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
