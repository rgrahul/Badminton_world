"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddPlayerDialog } from "./AddPlayerDialog"

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
}

interface PlayerSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  tournamentId?: string
}

export function PlayerSelect({ value, onChange, placeholder = "Select or add player...", disabled, tournamentId }: PlayerSelectProps) {
  const [open, setOpen] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [serverSearchDone, setServerSearchDone] = useState(false)
  const [search, setSearch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [tournamentId])

  // Client-side filter first, then server fallback with debounce
  useEffect(() => {
    if (!search) {
      setFilteredPlayers(players)
      setServerSearchDone(false)
      return
    }

    // Client-side filter
    const localResults = players.filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase()) ||
      player.email?.toLowerCase().includes(search.toLowerCase()) ||
      player.mobileNumber?.includes(search)
    )
    setFilteredPlayers(localResults)
    setServerSearchDone(false)

    // If client-side finds results, no need for server call
    if (localResults.length > 0) return

    // No local results — debounce a server search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchServer(search)
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, players])

  const fetchPlayers = async () => {
    try {
      const url = tournamentId
        ? `/api/tournaments/${tournamentId}/players`
        : `/api/players?limit=1000`
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setPlayers(data.data.players)
        setFilteredPlayers(data.data.players)
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchServer = useCallback(async (query: string) => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await fetch(`/api/players?search=${encodeURIComponent(query)}&limit=50`)
      const data = await response.json()
      if (response.ok) {
        const serverPlayers: Player[] = data.data.players
        if (serverPlayers.length > 0) {
          // Merge new players into local cache (deduplicate by id)
          setPlayers((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newPlayers = serverPlayers.filter((p) => !existingIds.has(p.id))
            return newPlayers.length > 0 ? [...prev, ...newPlayers] : prev
          })
          setFilteredPlayers(serverPlayers)
        } else {
          setFilteredPlayers([])
        }
      }
    } catch (error) {
      console.error("Server search failed:", error)
    } finally {
      setSearching(false)
      setServerSearchDone(true)
    }
  }, [])

  const handlePlayerAdded = async (player: Player) => {
    // If tournament-scoped, also register the player in the tournament
    if (tournamentId) {
      try {
        await fetch(`/api/tournaments/${tournamentId}/players`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerIds: [player.id] }),
        })
      } catch (error) {
        console.error("Failed to add player to tournament:", error)
      }
    }
    // Refresh player list
    fetchPlayers()
    // Set the newly created player as selected
    onChange(player.name)
    setShowAddDialog(false)
    setOpen(false)
  }

  const handleSelectPlayer = (playerName: string) => {
    onChange(playerName)
    setOpen(false)
    setSearch("")
  }

  const handleAddNewPlayer = () => {
    setShowAddDialog(true)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />}
            </div>

            {/* Add New Player Button */}
            <button
              onClick={handleAddNewPlayer}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent cursor-pointer border-b bg-primary/5"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Player</span>
            </button>

            {/* Player List */}
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Loading players...
                </div>
              ) : searching ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {search && serverSearchDone
                      ? `No player found for "${search}"`
                      : "No player found"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewPlayer}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Player
                  </Button>
                </div>
              ) : (
                <div className="p-1">
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player.name)}
                      className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === player.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col items-start flex-1">
                        <span>{player.name}</span>
                        {(player.email || player.mobileNumber) && (
                          <span className="text-xs text-muted-foreground">
                            {player.email || player.mobileNumber}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Add Player Dialog */}
      <AddPlayerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onPlayerAdded={handlePlayerAdded}
        initialName={search}
      />
    </>
  )
}
