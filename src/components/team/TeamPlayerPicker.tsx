"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { derivePlayerCategory, type PlayerCategory } from "@/lib/constants"
import { PlayerAvatar } from "@/components/player/PlayerLink"

interface Player {
  id: string
  name: string
  age: number | null
  gender: string | null
  email?: string | null
  skillRating?: number | null
  profilePhoto?: string | null
}

interface CompositionRules {
  requiredMale: number
  requiredFemale: number
  requiredKid: number
}

interface TeamPlayerPickerProps {
  selectedPlayerIds: string[]
  onSelectionChange: (playerIds: string[]) => void
  compositionRules: CompositionRules
  tournamentId?: string
}

type FilterTab = "ALL" | "MALE" | "FEMALE" | "KID"

export function TeamPlayerPicker({
  selectedPlayerIds,
  onSelectionChange,
  compositionRules,
  tournamentId,
}: TeamPlayerPickerProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL")

  useEffect(() => {
    fetchPlayers()
  }, [tournamentId])

  const fetchPlayers = async () => {
    try {
      // Always show all global players so team creation isn't blocked.
      // Players get auto-registered to the tournament when the team is created.
      const response = await fetch("/api/players?limit=500")
      const data = await response.json()
      if (response.ok) {
        setPlayers(data.data.players)
      }
    } catch (error) {
      console.error("Failed to fetch players:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerCategory = (player: Player): PlayerCategory => {
    return derivePlayerCategory(player.age, player.gender)
  }

  const selectedCounts = {
    MALE: 0,
    FEMALE: 0,
    KID: 0,
  }

  selectedPlayerIds.forEach((id) => {
    const player = players.find((p) => p.id === id)
    if (player) {
      const cat = getPlayerCategory(player)
      selectedCounts[cat]++
    }
  })

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      !search ||
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      (player.email && player.email.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false

    if (activeTab === "ALL") return true
    return getPlayerCategory(player) === activeTab
  })

  const togglePlayer = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      onSelectionChange(selectedPlayerIds.filter((id) => id !== playerId))
    } else {
      onSelectionChange([...selectedPlayerIds, playerId])
    }
  }

  const getCategoryBadge = (category: PlayerCategory) => {
    const styles = {
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      KID: "bg-amber-100 text-amber-800",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[category]}`}
      >
        {category}
      </span>
    )
  }

  const getCountColor = (current: number, required: number) => {
    if (current === required) return "text-green-600"
    if (current > required) return "text-red-600"
    return "text-gray-600"
  }

  const tabs: { key: FilterTab; label: string; required: number; count: number }[] = [
    { key: "ALL", label: "All", required: compositionRules.requiredMale + compositionRules.requiredFemale + compositionRules.requiredKid, count: selectedPlayerIds.length },
    { key: "MALE", label: "Male", required: compositionRules.requiredMale, count: selectedCounts.MALE },
    { key: "FEMALE", label: "Female", required: compositionRules.requiredFemale, count: selectedCounts.FEMALE },
    { key: "KID", label: "Kid", required: compositionRules.requiredKid, count: selectedCounts.KID },
  ]

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading players...</div>
  }

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="text-xs"
          >
            {tab.label}{" "}
            <span className={`ml-1 font-bold ${getCountColor(tab.count, tab.required)}`}>
              ({tab.count}/{tab.required})
            </span>
          </Button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search players by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border-2"
      />

      {/* Player List */}
      <div className="border-2 rounded-lg max-h-64 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No players found
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id)
            const category = getPlayerCategory(player)
            return (
              <div
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                  isSelected
                    ? "bg-green-50 border-l-4 border-l-green-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerAvatar name={player.name} profilePhoto={player.profilePhoto} size="md" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.gender || "N/A"} {player.age ? `| Age ${player.age}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getCategoryBadge(category)}
                  {isSelected && (
                    <span className="text-green-600 text-sm font-bold">Selected</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selection Summary */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="font-semibold mb-1">Selection Summary</div>
        <div className="flex flex-wrap gap-3">
          <span className={getCountColor(selectedCounts.MALE, compositionRules.requiredMale)}>
            Male: {selectedCounts.MALE}/{compositionRules.requiredMale}
          </span>
          <span className={getCountColor(selectedCounts.FEMALE, compositionRules.requiredFemale)}>
            Female: {selectedCounts.FEMALE}/{compositionRules.requiredFemale}
          </span>
          <span className={getCountColor(selectedCounts.KID, compositionRules.requiredKid)}>
            Kid: {selectedCounts.KID}/{compositionRules.requiredKid}
          </span>
          <span className="text-gray-400">|</span>
          <span
            className={getCountColor(
              selectedPlayerIds.length,
              compositionRules.requiredMale + compositionRules.requiredFemale + compositionRules.requiredKid
            )}
          >
            Total: {selectedPlayerIds.length}/
            {compositionRules.requiredMale + compositionRules.requiredFemale + compositionRules.requiredKid}
          </span>
        </div>
      </div>
    </div>
  )
}
