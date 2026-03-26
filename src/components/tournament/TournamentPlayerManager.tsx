"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { derivePlayerCategory } from "@/lib/constants"
import { PlayerAvatar } from "@/components/player/PlayerLink"
import { useRole } from "@/hooks/useRole"
import * as XLSX from "xlsx"

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  profilePhoto?: string | null
}

interface TournamentPlayerManagerProps {
  tournamentId: string
  onPlayersChanged?: () => void
}

export function TournamentPlayerManager({ tournamentId, onPlayersChanged }: TournamentPlayerManagerProps) {
  const { alert, confirmDelete } = useAlertDialog()
  const { canManage, isAdmin } = useRole()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"search" | "create" | "excel">("search")

  // Search existing players state
  const [globalSearch, setGlobalSearch] = useState("")
  const [globalPlayers, setGlobalPlayers] = useState<Player[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])

  // Create new player state
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    age: "",
    gender: "",
  })
  const [creating, setCreating] = useState(false)

  // Excel import state
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [parsedPlayers, setParsedPlayers] = useState<any[]>([])
  const [excelProcessing, setExcelProcessing] = useState(false)
  const [excelResult, setExcelResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchTournamentPlayers()
  }, [tournamentId])

  const fetchTournamentPlayers = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`)
      const data = await response.json()
      if (response.ok) {
        setPlayers(data.data.players)
      }
    } catch (error) {
      console.error("Failed to fetch tournament players:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchGlobalPlayers = async (query: string) => {
    if (!query.trim()) {
      setGlobalPlayers([])
      return
    }
    try {
      setSearchLoading(true)
      const response = await fetch(`/api/players?search=${encodeURIComponent(query)}&limit=50`)
      const data = await response.json()
      if (response.ok) {
        // Exclude players already in the tournament
        const existingIds = new Set(players.map((p) => p.id))
        setGlobalPlayers(data.data.players.filter((p: Player) => !existingIds.has(p.id)))
      }
    } catch (error) {
      console.error("Failed to search players:", error)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dialogMode === "search") {
        searchGlobalPlayers(globalSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [globalSearch, dialogMode, players])

  const handleAddSelected = async () => {
    if (selectedPlayerIds.length === 0) return
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      })

      if (response.ok) {
        await fetchTournamentPlayers()
        setSelectedPlayerIds([])
        setGlobalSearch("")
        setGlobalPlayers([])
        setDialogOpen(false)
        onPlayersChanged?.()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to add players", "Error")
      }
    } catch (error) {
      console.error("Add players error:", error)
      alert("An error occurred", "Error")
    }
  }

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayer.name.trim()) {
      alert("Player name is required", "Validation Error")
      return
    }

    try {
      setCreating(true)
      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPlayer: {
            name: newPlayer.name,
            email: newPlayer.email || null,
            mobileNumber: newPlayer.mobileNumber || null,
            age: newPlayer.age ? parseInt(newPlayer.age) : null,
            gender: newPlayer.gender || null,
          },
        }),
      })

      if (response.ok) {
        await fetchTournamentPlayers()
        setNewPlayer({ name: "", email: "", mobileNumber: "", age: "", gender: "" })
        setDialogOpen(false)
        onPlayersChanged?.()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create player", "Error")
      }
    } catch (error) {
      console.error("Create player error:", error)
      alert("An error occurred", "Error")
    } finally {
      setCreating(false)
    }
  }

  const handleRemovePlayer = async (playerId: string, playerName: string) => {
    const confirmed = await confirmDelete(
      `Remove "${playerName}" from this tournament? The player will not be deleted globally.`
    )
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/tournaments/${tournamentId}/players/${playerId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        await fetchTournamentPlayers()
        onPlayersChanged?.()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to remove player", "Error")
      }
    } catch (error) {
      console.error("Remove player error:", error)
      alert("An error occurred", "Error")
    }
  }

  const openDialog = (mode: "search" | "create" | "excel" = "search") => {
    setDialogMode(mode)
    setGlobalSearch("")
    setGlobalPlayers([])
    setSelectedPlayerIds([])
    setNewPlayer({ name: "", email: "", mobileNumber: "", age: "", gender: "" })
    setExcelFile(null)
    setParsedPlayers([])
    setExcelResult(null)
    setDialogOpen(true)
  }

  const parseExcelFile = async (file: File) => {
    return new Promise<any[]>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(sheet)

          const players = jsonData.map((row: any) => {
            let gender: "MALE" | "FEMALE" | "OTHER" | null = null
            const genderVal = (row.gender || row.Gender || "").toString().toUpperCase()
            if (genderVal === "MALE" || genderVal === "M") gender = "MALE"
            else if (genderVal === "FEMALE" || genderVal === "F") gender = "FEMALE"
            else if (genderVal === "OTHER" || genderVal === "O") gender = "OTHER"

            return {
              name: row.name || row.Name || "",
              email: row.email || row.Email || null,
              mobileNumber: row.mobileNumber || row.MobileNumber || row.mobile || row.Mobile || null,
              age: row.age || row.Age ? parseInt(row.age || row.Age) : null,
              gender,
              yearsOfExperience: row.yearsOfExperience || row.YearsOfExperience || row.experience ? parseInt(row.yearsOfExperience || row.YearsOfExperience || row.experience) : null,
              skillRating: row.skillRating || row.SkillRating || row.rating ? parseInt(row.skillRating || row.SkillRating || row.rating) : null,
              profilePhoto: row.profilePhoto || row.ProfilePhoto || row.photo || row.Photo || null,
            }
          }).filter((p: any) => p.name && p.name.trim() !== "")

          resolve(players)
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsBinaryString(file)
    })
  }

  const handleParseExcel = async () => {
    if (!excelFile) return
    try {
      setExcelProcessing(true)
      const players = await parseExcelFile(excelFile)
      if (players.length === 0) {
        alert("No valid players found. Make sure the 'name' column exists.", "Parse Error")
        return
      }
      setParsedPlayers(players)
      setExcelResult({ success: true, message: `Parsed ${players.length} players` })
    } catch {
      alert("Failed to parse Excel file.", "Parse Error")
    } finally {
      setExcelProcessing(false)
    }
  }

  const handleExcelUpload = async () => {
    if (parsedPlayers.length === 0) return
    try {
      setExcelProcessing(true)
      const response = await fetch(`/api/tournaments/${tournamentId}/players/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: parsedPlayers }),
      })
      const data = await response.json()
      if (response.ok) {
        setExcelResult({ success: true, message: data.data.message })
        await fetchTournamentPlayers()
        onPlayersChanged?.()
        setTimeout(() => setDialogOpen(false), 1500)
      } else {
        setExcelResult({ success: false, message: data.error || "Upload failed" })
      }
    } catch {
      setExcelResult({ success: false, message: "An error occurred" })
    } finally {
      setExcelProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const template = [
      { name: "John Doe", email: "john@example.com", mobileNumber: "+1234567890", age: 25, gender: "MALE" },
      { name: "Jane Smith", email: "jane@example.com", mobileNumber: "+0987654321", age: 28, gender: "FEMALE" },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Players")
    XLSX.writeFile(wb, "tournament_players_template.xlsx")
  }

  const getCategoryBadge = (player: Player) => {
    const cat = derivePlayerCategory(player.age ?? null, player.gender ?? null)
    const styles = {
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      KID: "bg-amber-100 text-amber-800",
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[cat]}`}>
        {cat}
      </span>
    )
  }

  const filteredPlayers = players.filter((p) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(s) ||
      (p.email && p.email.toLowerCase().includes(s)) ||
      (p.mobileNumber && p.mobileNumber.includes(s))
    )
  })

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading players...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search registered players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        {canManage && <Button variant="outline" onClick={() => openDialog("excel")}>Import Excel</Button>}
        {canManage && <Button onClick={() => openDialog("search")}>Add Player</Button>}
      </div>

      {/* Player list */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {players.length === 0
              ? "No players registered for this tournament yet"
              : "No players match your search"}
          </p>
          {players.length === 0 && (
            <Button onClick={openDialog}>Add First Player</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPlayers.map((player) => (
            <Card key={player.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar name={player.name} profilePhoto={player.profilePhoto} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/players/${player.id}`} className="font-medium text-sm hover:underline hover:text-blue-600 transition-colors">
                          {player.name}
                        </Link>
                        {getCategoryBadge(player)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {[isAdmin ? player.email : null, isAdmin ? player.mobileNumber : null, player.age ? `Age ${player.age}` : null]
                          .filter(Boolean)
                          .join(" | ")}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      onClick={() => handleRemovePlayer(player.id, player.name)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Player Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "excel" ? "Import Players from Excel" : "Add Player to Tournament"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "excel" ? "Upload an Excel file to add multiple players at once" : "Search for existing players or create a new one"}
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={dialogMode === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setDialogMode("search")}
            >
              Search Existing
            </Button>
            <Button
              type="button"
              variant={dialogMode === "create" ? "default" : "outline"}
              size="sm"
              onClick={() => setDialogMode("create")}
            >
              Create New
            </Button>
            <Button
              type="button"
              variant={dialogMode === "excel" ? "default" : "outline"}
              size="sm"
              onClick={() => setDialogMode("excel")}
            >
              Import Excel
            </Button>
          </div>

          {dialogMode === "search" ? (
            <div className="space-y-3">
              <Input
                placeholder="Search by name, email, or phone..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                autoFocus
              />
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : globalPlayers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {globalSearch ? "No players found" : "Type to search players"}
                  </div>
                ) : (
                  globalPlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id)
                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          setSelectedPlayerIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== player.id)
                              : [...prev, player.id]
                          )
                        }}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                          isSelected
                            ? "bg-green-50 border-l-4 border-l-green-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PlayerAvatar name={player.name} profilePhoto={player.profilePhoto} size="md" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{player.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[player.email, player.mobileNumber].filter(Boolean).join(" | ")}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-green-600 text-xs font-bold flex-shrink-0 ml-2">
                            Selected
                          </span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              {selectedPlayerIds.length > 0 && (
                <Button onClick={handleAddSelected} className="w-full">
                  Add {selectedPlayerIds.length} Player{selectedPlayerIds.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreatePlayer} className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="Enter player name"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                    placeholder="player@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={newPlayer.mobileNumber}
                    onChange={(e) => setNewPlayer({ ...newPlayer, mobileNumber: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPlayer.age}
                    onChange={(e) => setNewPlayer({ ...newPlayer, age: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={newPlayer.gender}
                    onValueChange={(value) => setNewPlayer({ ...newPlayer, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create & Add to Tournament"}
              </Button>
            </form>
          )}

          {dialogMode === "excel" && (
            <div className="space-y-4">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Download Template</p>
                    <p className="text-xs text-blue-700">Get the Excel template with correct columns</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    Download
                  </Button>
                </div>
              </div>

              {/* Column info */}
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Required: name</p>
                <p>Optional: email, mobileNumber, age, gender (MALE/FEMALE), yearsOfExperience, skillRating</p>
                <p className="mt-1 text-green-700">Existing players (matched by name) will be reused, not duplicated.</p>
              </div>

              {/* File upload */}
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    setExcelFile(e.target.files?.[0] || null)
                    setParsedPlayers([])
                    setExcelResult(null)
                  }}
                />
                {excelFile && (
                  <p className="text-xs text-muted-foreground">
                    {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Parse button */}
              {excelFile && parsedPlayers.length === 0 && (
                <Button onClick={handleParseExcel} disabled={excelProcessing} className="w-full">
                  {excelProcessing ? "Parsing..." : "Parse File"}
                </Button>
              )}

              {/* Preview */}
              {parsedPlayers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Preview ({parsedPlayers.length} players)</h4>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Name</th>
                          <th className="px-2 py-1.5 text-left">Email</th>
                          <th className="px-2 py-1.5 text-left">Age</th>
                          <th className="px-2 py-1.5 text-left">Gender</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPlayers.slice(0, 50).map((p, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1.5">{p.name}</td>
                            <td className="px-2 py-1.5 truncate max-w-[120px]">{p.email || "-"}</td>
                            <td className="px-2 py-1.5">{p.age || "-"}</td>
                            <td className="px-2 py-1.5">{p.gender || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedPlayers.length > 50 && (
                      <div className="text-center py-1 text-xs text-muted-foreground bg-gray-50">
                        Showing first 50 of {parsedPlayers.length}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleExcelUpload}
                    disabled={excelProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {excelProcessing ? "Importing..." : `Import ${parsedPlayers.length} Players`}
                  </Button>
                </div>
              )}

              {/* Result */}
              {excelResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  excelResult.success
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  {excelResult.message}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
