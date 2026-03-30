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
  players: {
    playerId: string
    category: string
    player: { id: string; name: string; age: number | null; gender: string | null }
  }[]
  _count: { players: number }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-2 border-purple-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Team Match
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
              Set up a structured match between two teams
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700 font-semibold">
                  {error}
                </div>
              )}

              {/* Match Name */}
              <div className="space-y-2 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <Label htmlFor="name" className="text-yellow-800 font-bold">
                  Match Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Semi-Final: Team A vs Team B"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-2 focus:border-yellow-500"
                />
              </div>

              {/* Select Teams */}
              <div className="space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-800 text-lg">Select Teams</h3>
                {teamsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading teams...</p>
                ) : teams.length < 2 ? (
                  <p className="text-sm text-red-600">
                    Need at least 2 teams in this tournament to create a team match.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamA" className="text-green-700 font-semibold">
                        Team A
                      </Label>
                      <select
                        id="teamA"
                        value={formData.teamAId}
                        onChange={(e) =>
                          setFormData({ ...formData, teamAId: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select team...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t._count.players} players)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamB" className="text-green-700 font-semibold">
                        Team B
                      </Label>
                      <select
                        id="teamB"
                        value={formData.teamBId}
                        onChange={(e) =>
                          setFormData({ ...formData, teamBId: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select team...</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t._count.players} players)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 text-lg">Category</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("ADULT")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      formData.category === "ADULT"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("KIDS")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      formData.category === "KIDS"
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-white text-amber-700 border-2 border-amber-300 hover:bg-amber-50"
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
                      <span className="text-sm font-medium text-blue-700">
                        Enable gender restriction (separate boys/girls fixtures)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Format Builder */}
              <div className="space-y-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-800 text-lg">Format Builder</h3>
                <p className="text-sm text-purple-600">
                  Set the number of each fixture type for this team match.
                </p>

                {showAdultFormats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}

                {showKidsFormats && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-purple-700 font-semibold text-xs">
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
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Player Reuse */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-200">
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
                    <span className="text-sm font-bold text-teal-800">
                      Allow players to play in multiple fixtures
                    </span>
                    <p className="text-xs text-teal-600">
                      When enabled, the same player can be assigned to more than one fixture in this team match.
                    </p>
                  </div>
                </label>
              </div>

              {/* Scoring Format */}
              <div className="space-y-4 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200">
                <h3 className="font-bold text-orange-800 text-lg">Scoring Format</h3>
                <p className="text-sm text-orange-600">
                  Applied to all fixture matches in this team match.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-orange-700 font-semibold text-xs">
                      Best of (Sets)
                    </Label>
                    <select
                      value={formData.setsCount}
                      onChange={(e) =>
                        setFormData({ ...formData, setsCount: parseInt(e.target.value) })
                      }
                      disabled={isLoading}
                      className="w-full rounded-md border-2 border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                    >
                      <option value={1}>1 Set</option>
                      <option value={3}>3 Sets</option>
                      <option value={5}>5 Sets</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-orange-700 font-semibold text-xs">
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
                      className="border-2 focus:border-orange-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-orange-700 font-semibold text-xs">
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
                      className="border-2 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-3 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg">Preview</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-gray-500 text-xs font-medium">Total Fixtures</div>
                    <div className="text-2xl font-bold text-gray-800">{totalFixtures}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="text-gray-500 text-xs font-medium">Players per Team</div>
                    <div className="text-2xl font-bold text-gray-800">{breakdown.total}</div>
                  </div>
                </div>
                {breakdown.total > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {breakdown.male > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        {breakdown.male} Male
                      </span>
                    )}
                    {breakdown.female > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
                        {breakdown.female} Female
                      </span>
                    )}
                    {breakdown.kids > 0 && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
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
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || totalFixtures === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all font-bold"
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
