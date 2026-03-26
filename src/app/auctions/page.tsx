"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GavelIcon } from "@/components/icons/GavelIcon"
import { AuctionSummary } from "@/types/auction"
import { useRole } from "@/hooks/useRole"

type StatusTab = "ALL" | "SETUP" | "LIVE" | "PAUSED" | "COMPLETED"

export default function AuctionsPage() {
  const { canManage } = useRole()
  const [auctions, setAuctions] = useState<AuctionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL")

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions")
      const data = await response.json()
      if (response.ok) {
        setAuctions(data.data.auctions)
      }
    } catch (error) {
      console.error("Failed to fetch auctions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = statusFilter === "ALL"
    ? auctions
    : auctions.filter((a) => a.status === statusFilter)

  const statusColors: Record<string, string> = {
    SETUP: "bg-gray-100 text-gray-800",
    LIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Auctions</h1>
          {canManage && (
            <Link href="/auctions/new">
              <Button>Create New Auction</Button>
            </Link>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 mb-6">
          {(["ALL", "SETUP", "LIVE", "PAUSED", "COMPLETED"] as StatusTab[]).map((tab) => (
            <Button
              key={tab}
              variant={statusFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab)}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading auctions...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <GavelIcon size={64} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {auctions.length === 0 ? "No auctions created yet" : "No auctions match the filter"}
            </p>
            {auctions.length === 0 && canManage && (
              <Link href="/auctions/new">
                <Button>Create Your First Auction</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((auction) => (
              <Link key={auction.id} href={`/auctions/${auction.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg truncate">{auction.name}</CardTitle>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${
                          statusColors[auction.status]
                        }`}
                      >
                        {auction.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{auction._count.teams} teams</span>
                      <span>{auction._count.players} players</span>
                    </div>
                    {auction.tournament && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Tournament: {auction.tournament.name}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(auction.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
