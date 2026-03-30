"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AuctionStatsBar } from "@/components/auction/AuctionStatsBar"
import { PlayerSpotlight } from "@/components/auction/PlayerSpotlight"
import { BidPanel } from "@/components/auction/BidPanel"
import { PlayerQueue } from "@/components/auction/PlayerQueue"
import { AuctionPlayerGrid } from "@/components/auction/AuctionPlayerGrid"
import { AuctionTeamCard } from "@/components/auction/AuctionTeamCard"
import { ExcelImportDialog } from "@/components/auction/ExcelImportDialog"
import { GavelIcon, SoldGavelIcon } from "@/components/icons/GavelIcon"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import {
  AuctionFull,
  AuctionStats,
  AuctionPlayerWithDetails,
  BidHistoryEntry,
} from "@/types/auction"
import { useRole } from "@/hooks/useRole"
import { SKILL_CATEGORY_VALUES, skillCategoryLabel } from "@/lib/skillCategory"
import type { SkillCategory } from "@prisma/client"

function parseNonNegativePrice(raw: string): number {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const emptySkillPriceForm = (): Record<SkillCategory, string> => ({
  BEGINNER: "0",
  INTERMEDIATE: "0",
  INTERMEDIATE_PLUS: "0",
  ADVANCED: "0",
})

export default function AuctionPage({ params }: { params: { auctionId: string } }) {
  const router = useRouter()
  const { canManage } = useRole()
  const { alert, confirm, confirmDelete } = useAlertDialog()

  const [auction, setAuction] = useState<AuctionFull | null>(null)
  const [stats, setStats] = useState<AuctionStats>({
    total: 0,
    available: 0,
    sold: 0,
    unsold: 0,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentPlayer, setCurrentPlayer] = useState<AuctionPlayerWithDetails | null>(null)
  const [currentBid, setCurrentBid] = useState(0)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [bidHistory, setBidHistory] = useState<BidHistoryEntry[]>([])
  const [selling, setSelling] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [addingPlayers, setAddingPlayers] = useState(false)
  const [syncingTeams, setSyncingTeams] = useState(false)
  const [tournamentImportOpen, setTournamentImportOpen] = useState(false)
  const [tournamentSkillPrices, setTournamentSkillPrices] =
    useState<Record<SkillCategory, string>>(emptySkillPriceForm)
  const [tournamentUncategorizedPrice, setTournamentUncategorizedPrice] = useState("0")

  const fetchAuction = useCallback(async () => {
    try {
      const response = await fetch(`/api/auctions/${params.auctionId}`)
      const data = await response.json()
      if (response.ok) {
        setAuction(data.data.auction)
      }
    } catch (error) {
      console.error("Failed to fetch auction:", error)
    } finally {
      setLoading(false)
    }
  }, [params.auctionId])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/auctions/${params.auctionId}/players`)
      const data = await response.json()
      if (response.ok) {
        setStats(data.data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [params.auctionId])

  useEffect(() => {
    fetchAuction()
    fetchStats()
  }, [fetchAuction, fetchStats])

  const handleStatusChange = async (newStatus: string) => {
    const confirmed = await confirm(
      `Change auction status to ${newStatus}?`,
      "Change Status"
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/auctions/${params.auctionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const payload = await response.json().catch(() => null)
        const d = payload?.data as
          | {
              teamsSynced?: number
              teamsSyncSkippedConflict?: boolean
            }
          | undefined
        if (newStatus === "COMPLETED" && d) {
          if (d.teamsSyncSkippedConflict) {
            alert(
              "Auction completed. The tournament already had teams with those names, so creating teams from the auction was skipped. Verify rosters if needed.",
              "Notice"
            )
          } else if (typeof d.teamsSynced === "number" && d.teamsSynced > 0) {
            alert(
              `Auction completed. ${d.teamsSynced} tournament team(s) were created with their sold players.`,
              "Success"
            )
          }
        }
        await fetchAuction()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update status", "Error")
      }
    } catch (error) {
      console.error("Status change error:", error)
    }
  }

  const handleDeleteAuction = async () => {
    const confirmed = await confirmDelete(
      "Are you sure you want to delete this auction? All teams and player assignments will be lost."
    )
    if (!confirmed) return

    try {
      const response = await fetch(`/api/auctions/${params.auctionId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        router.push("/auctions")
      }
    } catch (error) {
      console.error("Delete auction error:", error)
    }
  }

  const handleSelectPlayer = (player: AuctionPlayerWithDetails) => {
    setCurrentPlayer(player)
    setCurrentBid(player.basePrice)
    setSelectedTeamId(null)
  }

  const handleSold = async () => {
    if (!currentPlayer || !selectedTeamId || currentBid <= 0) return

    try {
      setSelling(true)
      const response = await fetch(
        `/api/auctions/${params.auctionId}/players/${currentPlayer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sell",
            soldPrice: currentBid,
            soldToTeamId: selectedTeamId,
          }),
        }
      )

      if (response.ok) {
        const team = auction?.teams.find((t) => t.id === selectedTeamId)
        setBidHistory((prev) => [
          {
            id: Date.now().toString(),
            playerName: currentPlayer.player.name,
            teamName: team?.name || "Unknown",
            amount: currentBid,
            timestamp: new Date(),
          },
          ...prev,
        ])

        setCurrentPlayer(null)
        setCurrentBid(0)
        setSelectedTeamId(null)
        await fetchAuction()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to sell player", "Error")
      }
    } catch (error) {
      console.error("Sell player error:", error)
      alert("An error occurred", "Error")
    } finally {
      setSelling(false)
    }
  }

  const handleUnsold = async () => {
    if (!currentPlayer) return

    try {
      setSelling(true)
      const response = await fetch(
        `/api/auctions/${params.auctionId}/players/${currentPlayer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsold" }),
        }
      )

      if (response.ok) {
        setCurrentPlayer(null)
        setCurrentBid(0)
        setSelectedTeamId(null)
        await fetchAuction()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to mark unsold", "Error")
      }
    } catch (error) {
      console.error("Unsold player error:", error)
    } finally {
      setSelling(false)
    }
  }

  const handleResetPlayer = async (auctionPlayerId: string) => {
    const confirmed = await confirm(
      "Reset this player to available? If sold, the team's spent amount will be restored.",
      "Reset Player"
    )
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/auctions/${params.auctionId}/players/${auctionPlayerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset" }),
        }
      )

      if (response.ok) {
        await fetchAuction()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to reset player", "Error")
      }
    } catch (error) {
      console.error("Reset player error:", error)
    }
  }

  const handleImportPlayers = async (players: any[]) => {
    try {
      setImporting(true)
      const response = await fetch(
        `/api/auctions/${params.auctionId}/players/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        alert(`Successfully imported ${data.data.count} players!`, "Success")
        setImportOpen(false)
        await fetchAuction()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to import players", "Error")
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("An error occurred during import", "Error")
    } finally {
      setImporting(false)
    }
  }

  const submitTournamentPlayersImport = async () => {
    if (!auction?.tournamentId) {
      alert("This auction is not linked to a tournament", "Error")
      return
    }

    const confirmed = await confirm(
      "Import all players from the linked tournament into this auction? Team captains are excluded from the auction pool.",
      "Import Tournament Players"
    )
    if (!confirmed) return

    const basePriceBySkillCategory = {
      BEGINNER: parseNonNegativePrice(tournamentSkillPrices.BEGINNER),
      INTERMEDIATE: parseNonNegativePrice(tournamentSkillPrices.INTERMEDIATE),
      INTERMEDIATE_PLUS: parseNonNegativePrice(tournamentSkillPrices.INTERMEDIATE_PLUS),
      ADVANCED: parseNonNegativePrice(tournamentSkillPrices.ADVANCED),
    }

    try {
      setAddingPlayers(true)
      const response = await fetch(`/api/auctions/${params.auctionId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromTournament: true,
          basePrice: parseNonNegativePrice(tournamentUncategorizedPrice),
          basePriceBySkillCategory,
        }),
      })

      if (response.ok) {
        alert("Tournament players imported!", "Success")
        setTournamentImportOpen(false)
        setTournamentSkillPrices(emptySkillPriceForm())
        setTournamentUncategorizedPrice("0")
        await fetchAuction()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to import tournament players", "Error")
      }
    } catch (error) {
      console.error("Add tournament players error:", error)
    } finally {
      setAddingPlayers(false)
    }
  }

  const handleSyncTeams = async () => {
    if (!auction?.tournamentId) {
      alert("This auction is not linked to a tournament", "Error")
      return
    }

    const confirmed = await confirm(
      "Create tournament teams from auction results? This will create teams with their sold players in the tournament.",
      "Create Tournament Teams"
    )
    if (!confirmed) return

    try {
      setSyncingTeams(true)
      const response = await fetch(
        `/api/auctions/${params.auctionId}/sync-teams`,
        { method: "POST" }
      )
      const data = await response.json()

      if (response.ok) {
        alert(`Created ${data.data.count} tournament teams!`, "Success")
        await fetchAuction()
      } else {
        alert(data.error || "Failed to create tournament teams", "Error")
      }
    } catch (error) {
      console.error("Sync teams error:", error)
      alert("An error occurred", "Error")
    } finally {
      setSyncingTeams(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading auction...</div>
        </main>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">Auction not found</div>
        </main>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    SETUP: "bg-gray-100 text-gray-800",
    LIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/auctions")}>
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">{auction.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[auction.status]}`}>
                  {auction.status}
                </span>
                {auction.tournament && (
                  <span className="text-xs text-muted-foreground">
                    {auction.tournament.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              {/* Add Players Buttons */}
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                Import Excel
              </Button>
              {auction.tournamentId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTournamentImportOpen(true)}
                  disabled={addingPlayers}
                >
                  Add Tournament Players
                </Button>
              )}

              {/* Status Controls */}
              {auction.status === "SETUP" && (
                <Button size="sm" onClick={() => handleStatusChange("LIVE")} className="bg-green-600 hover:bg-green-700">
                  Start Auction
                </Button>
              )}
              {auction.status === "LIVE" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("PAUSED")}>
                  Pause
                </Button>
              )}
              {auction.status === "PAUSED" && (
                <Button size="sm" onClick={() => handleStatusChange("LIVE")} className="bg-green-600 hover:bg-green-700">
                  Resume
                </Button>
              )}
              {(auction.status === "LIVE" || auction.status === "PAUSED") && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("COMPLETED")}>
                  Complete
                </Button>
              )}
              {auction.tournamentId && auction.status !== "SETUP" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncTeams}
                  disabled={syncingTeams}
                >
                  {syncingTeams ? "Creating..." : "Create Tournament Teams"}
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleDeleteAuction}>
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard">
          <TabsList className="w-full flex">
            <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
            <TabsTrigger value="auction" className="flex-1">Auction</TabsTrigger>
            <TabsTrigger value="teams" className="flex-1">Teams ({auction.teams.length})</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <AuctionStatsBar stats={stats} />
            <AuctionPlayerGrid
              players={auction.players}
              onReset={canManage ? handleResetPlayer : undefined}
            />
          </TabsContent>

          {/* Auction (Live) Tab */}
          <TabsContent value="auction">
            {auction.status === "SETUP" ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <GavelIcon size={64} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Auction Not Started</h3>
                  <p className="text-muted-foreground mb-4">
                    {canManage
                      ? "Add players and teams, then start the auction to begin bidding."
                      : "The auction has not started yet. Check back later."}
                  </p>
                  {canManage && (
                    <Button onClick={() => handleStatusChange("LIVE")} className="bg-green-600 hover:bg-green-700">
                      Start Auction
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : auction.status === "COMPLETED" ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <SoldGavelIcon size={64} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Auction Completed</h3>
                  <p className="text-muted-foreground">
                    This auction has been completed. View results in the Dashboard and Teams tabs.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 280px)" }}>
                {/* Player Spotlight */}
                <div className="lg:col-span-4">
                  <PlayerSpotlight
                    player={currentPlayer}
                    currentBid={currentBid}
                  />
                </div>

                {/* Bid Panel */}
                <div className="lg:col-span-4">
                  {canManage ? (
                    <BidPanel
                      teams={auction.teams}
                      currentPlayer={currentPlayer}
                      currentBid={currentBid}
                      selectedTeamId={selectedTeamId}
                      bidHistory={bidHistory}
                      onBidChange={setCurrentBid}
                      onTeamSelect={setSelectedTeamId}
                      onSold={handleSold}
                      onUnsold={handleUnsold}
                      selling={selling}
                    />
                  ) : (
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">Current Bid</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-4xl font-black text-primary mb-2">
                          {currentBid.toLocaleString()}
                        </div>
                        {bidHistory.length > 0 && (
                          <div className="text-sm text-muted-foreground space-y-1 w-full mt-4">
                            <div className="font-medium mb-2">Bid History</div>
                            {bidHistory.map((entry, i) => (
                              <div key={i} className="flex justify-between text-xs bg-muted rounded px-2 py-1">
                                <span>{entry.teamName}</span>
                                <span className="font-semibold">{entry.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Player Queue */}
                <div className="lg:col-span-4">
                  <PlayerQueue
                    players={auction.players}
                    currentPlayerId={currentPlayer?.id ?? null}
                    onSelectPlayer={handleSelectPlayer}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            {auction.teams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No teams in this auction</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {auction.teams.map((team) => (
                  <AuctionTeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Excel Import Dialog */}
        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={handleImportPlayers}
          importing={importing}
        />

        <Dialog open={tournamentImportOpen} onOpenChange={setTournamentImportOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add tournament players</DialogTitle>
              <DialogDescription>
                Set base price per skill level. Players without a skill level use the “No skill level”
                price. Captains are still excluded from the pool.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {SKILL_CATEGORY_VALUES.map((cat) => (
                <div key={cat} className="space-y-1.5">
                  <Label htmlFor={`tournament-base-${cat}`}>{skillCategoryLabel(cat)}</Label>
                  <Input
                    id={`tournament-base-${cat}`}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={tournamentSkillPrices[cat]}
                    onChange={(e) =>
                      setTournamentSkillPrices((prev) => ({ ...prev, [cat]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-1.5 pt-1 border-t">
                <Label htmlFor="tournament-base-none">No skill level set</Label>
                <Input
                  id="tournament-base-none"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={tournamentUncategorizedPrice}
                  onChange={(e) => setTournamentUncategorizedPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Applied when the player profile has no skill category.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setTournamentImportOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={submitTournamentPlayersImport} disabled={addingPlayers}>
                {addingPlayers ? "Adding..." : "Import players"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
