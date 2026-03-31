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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.03] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              Create New Tournament
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-400 font-medium">
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
                      i + 1 <= step ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/20 p-4 text-sm text-red-300 font-semibold flex items-center gap-2 mb-6">
                {error}
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Tournament Name */}
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label htmlFor="name" className="text-gray-300 font-bold flex items-center gap-1">
                    Tournament Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Championship 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label htmlFor="description" className="text-gray-300 font-bold flex items-center gap-1">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Tournament description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isLoading}
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                {/* Dates */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label className="text-gray-300 font-bold flex items-center gap-1 mb-3">
                    Tournament Dates
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom" className="text-gray-300 font-semibold">Start Date *</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={formData.dateFrom}
                        onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                        required
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo" className="text-gray-300 font-semibold">End Date *</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={formData.dateTo}
                        onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                        required
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Organizer Details */}
                <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                    Organizer Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="organizerName" className="text-gray-300">Organizer Name *</Label>
                    <Input
                      id="organizerName"
                      placeholder="Organization or person name"
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizerEmail" className="text-gray-300">Email</Label>
                      <Input
                        id="organizerEmail"
                        type="email"
                        placeholder="contact@example.com"
                        value={formData.organizerEmail}
                        onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizerPhone" className="text-gray-300">Phone</Label>
                      <Input
                        id="organizerPhone"
                        type="tel"
                        placeholder="+1234567890"
                        value={formData.organizerPhone}
                        onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Venue Details */}
                <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                    Venue Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue" className="text-gray-300 font-semibold">Venue</Label>
                      <Input
                        id="venue"
                        placeholder="Sports Complex Name"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300 font-semibold">City</Label>
                      <Input
                        id="city"
                        placeholder="City Name"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={isLoading}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Title Photo */}
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label htmlFor="titlePhoto" className="text-gray-300 font-bold flex items-center gap-1">
                    Title Photo URL
                  </Label>
                  <Input
                    id="titlePhoto"
                    type="url"
                    placeholder="https://example.com/tournament-photo.jpg"
                    value={formData.titlePhoto}
                    onChange={(e) => setFormData({ ...formData, titlePhoto: e.target.value })}
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400">Optional banner image shown on the tournament page</p>
                </div>

                {/* Team Mode */}
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label className="text-gray-300 font-bold flex items-center gap-1">
                    Team Mode
                  </Label>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => !isLoading && setFormData({ ...formData, requiresTeams: !formData.requiresTeams, format: !formData.requiresTeams ? formData.format : "CUSTOM" })}
                  >
                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        formData.requiresTeams ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          formData.requiresTeams ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {formData.requiresTeams ? "Teams enabled — create and manage teams in this tournament" : "No teams — individual matches only"}
                    </span>
                  </div>
                </div>

                {/* Tournament Format (only when teams enabled) */}
                {formData.requiresTeams && (
                  <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-lg">
                    <Label className="text-gray-300 font-bold flex items-center gap-1 text-lg">
                      Tournament Format
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {([
                        { value: "CUSTOM", label: "Custom", desc: "Manually create team matches as needed" },
                        { value: "LEAGUE_KNOCKOUT", label: "League + Knockout", desc: "Group stage with round-robin, then knockout bracket from qualifiers" },
                        { value: "KNOCKOUT_ONLY", label: "Knockout Only", desc: "Direct elimination bracket tournament" },
                      ] as const).map((opt) => (
                        <div
                          key={opt.value}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            formData.format === opt.value
                              ? "border-emerald-500/50 bg-emerald-500/10 shadow-md"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20"
                          }`}
                          onClick={() => setFormData({ ...formData, format: opt.value })}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.format === opt.value ? "border-emerald-500" : "border-gray-500"
                              }`}
                            >
                              {formData.format === opt.value && (
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{opt.label}</div>
                              <div className="text-xs text-gray-400">{opt.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Label htmlFor="category" className="text-gray-300 font-bold flex items-center gap-1">
                    Category
                  </Label>
                  <Input
                    id="category"
                    placeholder="e.g., Open, U19, Veterans"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: League Setup (LEAGUE_KNOCKOUT only) */}
            {step === 2 && isLeague && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-4">
                    League Configuration
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Number of Groups</Label>
                      <div className="flex flex-wrap gap-2">
                        {[2, 3, 4, 6, 8].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                              formData.numberOfGroups === n
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20 text-gray-400"
                            }`}
                            onClick={() => setFormData({ ...formData, numberOfGroups: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Qualify Per Group</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-4 py-2 rounded-lg border font-semibold transition-all ${
                              formData.qualifyPerGroup === n
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20 text-gray-400"
                            }`}
                            onClick={() => setFormData({ ...formData, qualifyPerGroup: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-300 font-medium">
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
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-2">
                    Default Match Format
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
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
                        <Label className="font-medium text-gray-300">{label}</Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-gray-300 font-bold flex items-center justify-center hover:bg-white/10"
                            onClick={() => setFormData({ ...formData, [key]: Math.max(0, formData[key] - 1) })}
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-white">{formData[key]}</span>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 text-gray-300 font-bold flex items-center justify-center hover:bg-white/10"
                            onClick={() => setFormData({ ...formData, [key]: formData[key] + 1 })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                      <span className="font-bold text-white">Total Fixtures</span>
                      <span className="font-bold text-white text-lg">{totalFixtures}</span>
                    </div>
                  </div>
                </div>

                {/* Scoring Config */}
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <h3 className="font-bold text-white flex items-center gap-2 text-lg mb-4">
                    Scoring Configuration
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-300">Sets (Best of)</Label>
                      <div className="flex gap-2">
                        {[1, 3, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`px-3 py-1.5 rounded border font-semibold text-sm ${
                              formData.defaultSetsCount === n
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-white/10 bg-white/[0.03] text-gray-400"
                            }`}
                            onClick={() => setFormData({ ...formData, defaultSetsCount: n })}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsToWin" className="font-semibold text-gray-300">Points to Win</Label>
                      <Input
                        id="pointsToWin"
                        type="number"
                        min={1}
                        value={formData.defaultPointsToWin}
                        onChange={(e) => setFormData({ ...formData, defaultPointsToWin: parseInt(e.target.value) || 21 })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deuceCap" className="font-semibold text-gray-300">Deuce Cap</Label>
                      <Input
                        id="deuceCap"
                        type="number"
                        min={1}
                        value={formData.defaultDeuceCap}
                        onChange={(e) => setFormData({ ...formData, defaultDeuceCap: parseInt(e.target.value) || 30 })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
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
                  className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300 font-semibold"
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300 font-semibold"
                >
                  Cancel
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
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading
                  ? "Creating..."
                  : step < totalSteps
                  ? "Next"
                  : "Create Tournament"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
