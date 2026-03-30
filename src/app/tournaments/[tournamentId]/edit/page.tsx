"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/Header"
import { useAlertDialog } from "@/hooks/useAlertDialog"

export default function EditTournamentPage({ params }: { params: { tournamentId: string } }) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")

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
    titlePhotoPosition: "center",
    category: "",
    requiresTeams: false,
    teamRequiredMale: 0,
    teamRequiredFemale: 0,
    teamRequiredKid: 0,
  })

  useEffect(() => {
    fetchTournament()
  }, [params.tournamentId])

  const fetchTournament = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tournament")
      }

      const tournament = data.data.tournament

      // Check if tournament has started
      if (tournament.status !== "UPCOMING") {
        alert("Cannot edit tournament that has already started", "Tournament Already Started")
        router.push(`/tournaments/${params.tournamentId}`)
        return
      }

      // Format dates for input fields
      const dateFrom = new Date(tournament.dateFrom).toISOString().split("T")[0]
      const dateTo = new Date(tournament.dateTo).toISOString().split("T")[0]

      setFormData({
        name: tournament.name || "",
        description: tournament.description || "",
        dateFrom,
        dateTo,
        organizerName: tournament.organizerName || "",
        organizerEmail: tournament.organizerEmail || "",
        organizerPhone: tournament.organizerPhone || "",
        venue: tournament.venue || "",
        city: tournament.city || "",
        titlePhoto: tournament.titlePhoto || "",
        titlePhotoPosition: tournament.titlePhotoPosition || "center",
        category: tournament.category || "",
        requiresTeams: tournament.requiresTeams || false,
        teamRequiredMale: tournament.teamRequiredMale ?? 0,
        teamRequiredFemale: tournament.teamRequiredFemale ?? 0,
        teamRequiredKid: tournament.teamRequiredKid ?? 0,
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
      // Validate dates
      if (new Date(formData.dateTo) < new Date(formData.dateFrom)) {
        throw new Error("End date must be after start date")
      }

      const payload = {
        ...formData,
        titlePhoto: formData.titlePhoto || null,
      }

      const response = await fetch(`/api/tournaments/${params.tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update tournament")
      }

      alert("Tournament updated successfully!", "Success")
      router.push(`/tournaments/${params.tournamentId}`)
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
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">Loading tournament...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Tournament</CardTitle>
            <CardDescription>Update tournament details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Tournament Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Championship 2024"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tournament description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Start Date *</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={formData.dateFrom}
                    onChange={(e) => setFormData({ ...formData, dateFrom: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">End Date *</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={formData.dateTo}
                    onChange={(e) => setFormData({ ...formData, dateTo: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Organizer Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Organizer Details</h3>
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
                <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-4">
                <h3 className="font-semibold">Venue Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      placeholder="Sports Complex Name"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City Name"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Title Photo */}
              <div className="space-y-2">
                <Label htmlFor="titlePhoto">Title Photo URL</Label>
                <Input
                  id="titlePhoto"
                  type="url"
                  placeholder="https://example.com/tournament-photo.jpg"
                  value={formData.titlePhoto}
                  onChange={(e) => setFormData({ ...formData, titlePhoto: e.target.value })}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Optional banner image shown on the tournament page</p>
              </div>

              {/* Title Photo Position */}
              {formData.titlePhoto && (
                <div className="space-y-2">
                  <Label>Photo Position</Label>
                  <div className="flex gap-2">
                    {(["top", "center", "bottom"] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setFormData({ ...formData, titlePhotoPosition: pos })}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          formData.titlePhotoPosition === pos
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:bg-accent"
                        }`}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Controls which part of the image is visible in the banner crop</p>
                </div>
              )}

              {/* Team Mode */}
              <div className="space-y-2">
                <Label className="font-semibold">Team Mode</Label>
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => !isLoading && setFormData({ ...formData, requiresTeams: !formData.requiresTeams })}
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
                  <span className="text-sm text-muted-foreground">
                    {formData.requiresTeams ? "Teams enabled" : "No teams"}
                  </span>
                </div>
              </div>

              {formData.requiresTeams && (
                <div className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-semibold">Team roster (per team)</h3>
                  <p className="text-sm text-muted-foreground">
                    Target male / female / kid counts for every team when building full rosters.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="teamRequiredMale">Male</Label>
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
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="teamRequiredFemale">Female</Label>
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
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="teamRequiredKid">Kid</Label>
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
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Open, U19, Veterans"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/tournaments/${params.tournamentId}`)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Updating..." : "Update Tournament"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
