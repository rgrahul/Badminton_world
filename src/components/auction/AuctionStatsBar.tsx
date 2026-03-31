"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AuctionStats } from "@/types/auction"

interface AuctionStatsBarProps {
  stats: AuctionStats
}

export function AuctionStatsBar({ stats }: AuctionStatsBarProps) {
  const items = [
    { label: "Total Players", value: stats.total, color: "text-white" },
    { label: "Available", value: stats.available, color: "text-cyan-400" },
    { label: "Sold", value: stats.sold, color: "text-emerald-400" },
    { label: "Total Spent", value: `${(stats.totalSpent / 1000).toFixed(0)}K`, color: "text-purple-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
