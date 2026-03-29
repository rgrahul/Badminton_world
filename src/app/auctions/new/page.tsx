"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuctionTeamSetup } from "@/components/auction/AuctionTeamSetup"
import { useAlertDialog } from "@/hooks/useAlertDialog"

interface TournamentOption {
  id: string
  name: string
}

interface TeamRow {
  name: string
  budget: string
}

export default function NewAuctionPage() {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [name, setName] = useState("")
  const [tournamentId, setTournamentId] = useState<string>("")
  const [tournaments, setTournaments] = useState<TournamentOption[]>([])
  const [teams, setTeams] = useState<TeamRow[]>([
    { name: "", budget: "100000" },
    { name: "", budget: "100000" },
    { name: "", budget: "100000" },
    { name: "", budget: "100000" },
  ])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchAvailableTournaments()
  }, [])

  const fetchAvailableTournaments = async () => {
    try {
      // Fetch tournaments that don't already have an auction
      const [tournamentsRes, auctionsRes] = await Promise.all([
        fetch("/api/tournaments"),
        fetch("/api/auctions"),
      ])
      const tournamentsData = await tournamentsRes.json()
      const auctionsData = await auctionsRes.json()

      if (tournamentsRes.ok && auctionsRes.ok) {
        const auctionTournamentIds = new Set(
          auctionsData.data.auctions
            .filter((a: any) => a.tournamentId)
            .map((a: any) => a.tournamentId)
        )
        const available = tournamentsData.data.tournaments.filter(
          (t: any) => !auctionTournamentIds.has(t.id)
        )
        setTournaments(available.map((t: any) => ({ id: t.id, name: t.name })))
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("Please enter an auction name", "Validation Error")
      return
    }

    const validTeams = teams.filter((t) => t.name.trim())
    if (validTeams.length === 0) {
      alert("Please add at least one team", "Validation Error")
      return
    }

    try {
      setCreating(true)

      // Create auction
      const auctionRes = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tournamentId: tournamentId && tournamentId !== "none" ? tournamentId : undefined,
        }),
      })

      if (!auctionRes.ok) {
        const data = await auctionRes.json()
        alert(data.error || "Failed to create auction", "Error")
        return
      }

      const auctionData = await auctionRes.json()
      const auctionId = auctionData.data.auction.id

      // Create teams
      const teamsRes = await fetch(`/api/auctions/${auctionId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: validTeams.map((t) => ({
            name: t.name.trim(),
            budget: parseFloat(t.budget) || 0,
          })),
        }),
      })

      if (!teamsRes.ok) {
        const data = await teamsRes.json()
        alert(data.error || "Auction created but failed to add teams", "Warning")
      }

      router.push(`/auctions/${auctionId}`)
    } catch (error) {
      console.error("Create auction error:", error)
      alert("An error occurred", "Error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.push("/auctions")}>
            ← Back to Auctions
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Auction</CardTitle>
            <CardDescription>Set up a player auction with teams and budget</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Auction Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., ABL 2026 Player Auction"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Link to Tournament (optional)</Label>
                <Select value={tournamentId} onValueChange={setTournamentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tournament</SelectItem>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Linking to a tournament allows importing tournament players and syncing auction
                  results.
                </p>
              </div>

              <div className="border-t pt-4">
                <AuctionTeamSetup teams={teams} onChange={setTeams} />
              </div>

              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Auction"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
