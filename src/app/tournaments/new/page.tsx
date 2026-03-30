"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"

type TournamentFormat = "CUSTOM" | "LEAGUE_KNOCKOUT" | "KNOCKOUT_ONLY"

export default function NewTournamentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dateFrom: "",
    dateTo: "",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    venue: "",
    city: "",
    titlePhoto: "",
    category: "",
    requiresTeams: false,
    format: "CUSTOM" as TournamentFormat,
    numberOfGroups: 2,
    qualifyPerGroup: 2,
    defaultMenDoubles: 0,
    defaultWomenDoubles: 0,
    defaultMixedDoubles: 0,
    defaultMenSingles: 0,
    defaultWomenSingles: 0,
    defaultKidsSingles: 0,
    defaultKidsDoubles: 0,
    defaultSetsCount: 3,
    defaultPointsToWin: 21,
    defaultDeuceCap: 30,
    teamRequiredMale: 0,
    teamRequiredFemale: 0,
    teamRequiredKid: 0,
  })

  const isStructuredFormat = formData.format === "LEAGUE_KNOCKOUT" || formData.format === "KNOCKOUT_ONLY"
  const isLeague = formData.format === "LEAGUE_KNOCKOUT"
  const needsWizard = formData.requiresTeams && isStructuredFormat

  const totalSteps = needsWizard ? (isLeague ? 3 : 2) : 1
  // Step 1: Basic Info + format
  // Step 2: League Setup (LEAGUE_KNOCKOUT only)
  // Step 3 (or 2 for KO): Match Format

  const getStepLabel = (s: number) => {
    if (!needsWizard) return "Tournament Details"
    if (s === 1) return "Basic Info"
    if (isLeague) {
      if (s === 2) return "League Setup"
      if (s === 3) return "Match Format"
    } else {
      if (s === 2) return "Match Format"
    }
    return ""
  }

  const totalFixtures =
    formData.defaultMenDoubles +
    formData.defaultWomenDoubles +
    formData.defaultMixedDoubles +
    formData.defaultMenSingles +
    formData.defaultWomenSingles +
    formData.defaultKidsSingles +
    formData.defaultKidsDoubles

  const canProceedStep1 = formData.name && formData.dateFrom && formData.dateTo && formData.organizerName
  const canProceedMatchFormat = totalFixtures > 0

  const handleSubmit = async () => {
    setError("")
    setIsLoading(true)

    try {
      if (new Date(formData.dateTo) < new Date(formData.dateFrom)) {
        throw new Error("End date must be after start date")
      }

      const payload: Record<string, any> = { ...formData }
      if (!payload.titlePhoto) delete payload.titlePhoto
      // Clean up fields not relevant to the format
      if (!formData.requiresTeams) {
        delete payload.teamRequiredMale
        delete payload.teamRequiredFemale
        delete payload.teamRequiredKid
      }
      if (!formData.requiresTeams || formData.format === "CUSTOM") {
        delete payload.format
        delete payload.numberOfGroups
        delete payload.qualifyPerGroup
        delete payload.defaultMenDoubles
        delete payload.defaultWomenDoubles
        delete payload.defaultMixedDoubles
        delete payload.defaultMenSingles
        delete payload.defaultWomenSingles
        delete payload.defaultKidsSingles
        delete payload.defaultKidsDoubles
        delete payload.defaultSetsCount
        delete payload.defaultPointsToWin
        delete payload.defaultDeuceCap
      }
      if (formData.format !== "LEAGUE_KNOCKOUT") {
        delete payload.numberOfGroups
        delete payload.qualifyPerGroup
      }

      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tournament")
      }

      router.push(`/tournaments/${data.data.tournament.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-3xl sm:text-4xl">🏆</span>
              Create New Tournament
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">
              {needsWizard
                ? `Step ${step} of ${totalSteps}: ${getStepLabel(step)}`
                : "Set up a new badminton tournament"}
            </CardDescription>
            {/* Step indicators */}
            {needsWizard && (
              <div className="flex gap-2 mt-3">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i + 1 <= step ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700 font-semibold flex items-center gap-2 mb-6">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Tournament Name */}
                <div className="space-y-2 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                  <Label htmlFor="name" className="text-yellow-800 font-bold flex items-center gap-1">
                    <span>🏅</span> Tournament Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Championship 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                    className="border-2 focus:border-yellow-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                  <Label htmlFor="description" className="text-gray-800 font-bold flex items-center gap-1">
                    <span>📝</span> Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Tournament description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isLoading}
                    rows={3}
                    className="border-2 focus:border-gray-500"
                  />
                </div>

                {/* Dates */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <Label className="text-blue-800 font-bold flex items-center gap-1 mb-3">
                    <span>📅</span> Tournament Dates
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-blue-700 font-semibold">Start Date *</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={formData.dateFrom}
                        onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                        required
                        disabled={isLoading}
                        className="border-2 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-blue-700 font-semibold">End Date *</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={formData.dateTo}
                        onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                        required
                        disabled={isLoading}
                        className="border-2 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Organizer Details */}
                <div className="space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                  <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                    <span>👤</span> Organizer Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="organizerName">Organizer Name *</Label>
                    <Input
                      id="organizerName"
                      placeholder="Organization or person name"
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizerEmail">Email</Label>
                      <Input
                        id="organizerEmail"
                        type="email"
                        placeholder="contact@example.com"
                        value={formData.organizerEmail}
                        onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizerPhone">Phone</Label>
                      <Input
                        id="organizerPhone"
                        type="tel"
                        placeholder="+1234567890"
                        value={formData.organizerPhone}
                        onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Venue Details */}
                <div className="space-y-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-purple-800 flex items-center gap-2 text-lg">
                    <span>📍</span> Venue Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue" className="text-purple-700 font-semibold">Venue</Label>
                      <Input
                        id="venue"
                        placeholder="Sports Complex Name"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        disabled={isLoading}
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-purple-700 font-semibold">City</Label>
                      <Input
                        id="city"
                        placeholder="City Name"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={isLoading}
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Title Photo */}
                <div className="space-y-2 bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                  <Label htmlFor="titlePhoto" className="text-pink-800 font-bold flex items-center gap-1">
                    <span>🖼️</span> Title Photo URL
                  </Label>
                  <Input
                    id="titlePhoto"
                    type="url"
                    placeholder="https://example.com/tournament-photo.jpg"
                    value={formData.titlePhoto}
                    onChange={(e) => setFormData({ ...formData, titlePhoto: e.target.value })}
                    disabled={isLoading}
                    className="border-2 focus:border-pink-500"
                  />
                  <p className="text-xs text-pink-600">Optional banner image shown on the tournament page</p>
                </div>

                {/* Team Mode */}
                <div className="space-y-2 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                  <Label className="text-indigo-800 font-bold flex items-center gap-1">
                    <span>👥</span> Team Mode
                  </Label>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => !isLoading && setFormData({ ...formData, requiresTeams: !formData.requiresTeams, format: !formData.requiresTeams ? formData.format : "CUSTOM" })}
                  >
                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        formData.requiresTeams ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          formData.requiresTeams ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-indigo-800">
                      {formData.requiresTeams ? "Teams enabled — create and manage teams in this tournament" : "No teams — individual matches only"}
                    </span>
                  </div>
                </div>

                {/* Team roster composition (when teams enabled) */}
                {formData.requiresTeams && (
                  <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                    <Label className="text-blue-800 font-bold flex items-center gap-1 text-lg">
                      <span>👥</span> Team roster (same for every team)
                    </Label>
                    <p className="text-sm text-blue-700">
                      How many male, female, and kid players each team must have when you build full rosters (not auction mode).
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="teamRequiredMale" className="text-blue-700 text-xs font-semibold">
                          Male
                        </Label>
                        <Input
                          id="teamRequiredMale"
                          type="number"
                          min={0}
                          value={formData.teamRequiredMale}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamRequiredMale: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          disabled={isLoading}
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="teamRequiredFemale" className="text-blue-700 text-xs font-semibold">
                          Female
                        </Label>
                        <Input
                          id="teamRequiredFemale"
                          type="number"
                          min={0}
                          value={formData.teamRequiredFemale}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamRequiredFemale: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          disabled={isLoading}
                          className="border-2"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="teamRequiredKid" className="text-blue-700 text-xs font-semibold">
                          Kid
                        </Label>
                        <Input
                          id="teamRequiredKid"
                          type="number"
                          min={0}
                          value={formData.teamRequiredKid}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamRequiredKid: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          disabled={isLoading}
                          className="border-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tournament Format (only when teams enabled) */}
                {formData.requiresTeams && (
                  <div className="space-y-3 bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-200">
                    <Label className="text-teal-800 font-bold flex items-center gap-1 text-lg">
                      <span>🎮</span> Tournament Format
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {([
                        { value: "CUSTOM", label: "Custom", desc: "Manually create team matches as needed" },
                        { value: "LEAGUE_KNOCKOUT", label: "League + Knockout", desc: "Group stage with round-robin, then knockout bracket from qualifiers" },
                        { value: "KNOCKOUT_ONLY", label: "Knockout Only", desc: "Direct elimination bracket tournament" },
                      ] as const).map((opt) => (
                        <div
                          key={opt.value}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            formData.format === opt.value
                              ? "border-teal-500 bg-teal-50 shadow-md"
                              : "border-gray-200 bg-white hover:border-teal-300"
                          }`}
                          onClick={() => setFormData({ ...formData, format: opt.value })}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.format === opt.value ? "border-teal-500" : "border-gray-300"
                              }`}
                            >
                              {formData.format === opt.value && (
                                <div className="w-3 h-3 rounded-full bg-teal-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{opt.label}</div>
                              <div className="text-xs text-gray-500">{opt.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2 bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <Label htmlFor="category" className="text-orange-800 font-bold flex items-center gap-1">
                    <span>🎯</span> Category
                  </Label>
                  <Input
                    id="category"
                    placeholder="e.g., Open, U19, Veterans"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={isLoading}
                    className="border-2 focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: League Setup (LEAGUE_KNOCKOUT only) */}
            {step === 2 && isLeague && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border-2 border-teal-200">
                  <h3 className="font-bold text-teal-800 flex items-center gap-2 text-lg mb-4">
                    <span>📊</span> League Configuration
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-teal-700">Number of Groups</Label>
                      <div className="flex flex-wrap gap-2">
                        {[2, 3, 4, 6, 8].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                              formData.numberOfGroups === n
                                ? "border-teal-500 bg-teal-100 text-teal-800"
                                : "border-gray-200 bg-white hover:border-teal-300 text-gray-600"
                            }`}
                            onClick={() => setFormData({ ...formData, numberOfGroups: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold text-teal-700">Qualify Per Group</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                              formData.qualifyPerGroup === n
                                ? "border-teal-500 bg-teal-100 text-teal-800"
                                : "border-gray-200 bg-white hover:border-teal-300 text-gray-600"
                            }`}
                            onClick={() => setFormData({ ...formData, qualifyPerGroup: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-lg border border-teal-200">
                      <div className="text-sm text-teal-700 font-medium">
                        Total qualifiers: {formData.numberOfGroups} groups x {formData.qualifyPerGroup} per group = <strong>{formData.numberOfGroups * formData.qualifyPerGroup}</strong> teams advancing to knockout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 or 3: Match Format */}
            {((step === 2 && !isLeague) || (step === 3 && isLeague)) && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-lg border-2 border-violet-200">
                  <h3 className="font-bold text-violet-800 flex items-center gap-2 text-lg mb-2">
                    <span>🏸</span> Default Match Format
                  </h3>
                  <p className="text-xs text-violet-600 mb-4">
                    These defaults apply to all auto-generated matches. At least one fixture type must be greater than 0.
                  </p>

                  <div className="space-y-3">
                    {([
                      { key: "defaultMenDoubles", label: "Men Doubles" },
                      { key: "defaultWomenDoubles", label: "Women Doubles" },
                      { key: "defaultMixedDoubles", label: "Mixed Doubles" },
                      { key: "defaultMenSingles", label: "Men Singles" },
                      { key: "defaultWomenSingles", label: "Women Singles" },
                      { key: "defaultKidsSingles", label: "Kids Singles" },
                      { key: "defaultKidsDoubles", label: "Kids Doubles" },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="font-medium text-violet-700">{label}</Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border-2 border-violet-300 bg-white text-violet-700 font-bold flex items-center justify-center hover:bg-violet-50"
                            onClick={() => setFormData({ ...formData, [key]: Math.max(0, formData[key] - 1) })}
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-violet-800">{formData[key]}</span>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border-2 border-violet-300 bg-white text-violet-700 font-bold flex items-center justify-center hover:bg-violet-50"
                            onClick={() => setFormData({ ...formData, [key]: formData[key] + 1 })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-violet-200 pt-3 flex items-center justify-between">
                      <span className="font-bold text-violet-800">Total Fixtures</span>
                      <span className="font-bold text-violet-800 text-lg">{totalFixtures}</span>
                    </div>
                  </div>
                </div>

                {/* Scoring Config */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border-2 border-amber-200">
                  <h3 className="font-bold text-amber-800 flex items-center gap-2 text-lg mb-4">
                    <span>📐</span> Scoring Configuration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-amber-700">Sets (Best of)</Label>
                      <div className="flex gap-2">
                        {[1, 3, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-3 py-1.5 rounded border-2 font-semibold text-sm ${
                              formData.defaultSetsCount === n
                                ? "border-amber-500 bg-amber-100 text-amber-800"
                                : "border-gray-200 bg-white text-gray-600"
                            }`}
                            onClick={() => setFormData({ ...formData, defaultSetsCount: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsToWin" className="font-semibold text-amber-700">Points to Win</Label>
                      <Input
                        id="pointsToWin"
                        type="number"
                        min={1}
                        value={formData.defaultPointsToWin}
                        onChange={(e) => setFormData({ ...formData, defaultPointsToWin: parseInt(e.target.value) || 21 })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deuceCap" className="font-semibold text-amber-700">Deuce Cap</Label>
                      <Input
                        id="deuceCap"
                        type="number"
                        min={1}
                        value={formData.defaultDeuceCap}
                        onChange={(e) => setFormData({ ...formData, defaultDeuceCap: parseInt(e.target.value) || 30 })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  ← Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  ❌ Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  isLoading ||
                  (step === 1 && !canProceedStep1) ||
                  (((step === 2 && !isLeague) || (step === 3 && isLeague)) && !canProceedMatchFormat)
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-bold"
              >
                {isLoading
                  ? "Creating... ⏳"
                  : step < totalSteps
                  ? "Next →"
                  : "✅ Create Tournament"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
