"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlayerLink } from "@/components/player/PlayerLink"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"
import { GroupCard } from "@/components/tournament/GroupCard"
import { GroupRearrangeDialog } from "@/components/tournament/GroupRearrangeDialog"
import { KnockoutBracket } from "@/components/tournament/KnockoutBracket"
import { TournamentPlayerManager } from "@/components/tournament/TournamentPlayerManager"
import { AuctionTeamSetup } from "@/components/auction/AuctionTeamSetup"
import { GavelIcon } from "@/components/icons/GavelIcon"

interface Match {
  id: string
  name: string
  type: string
  status: string
  sideAPlayer1: string
  sideAPlayer2?: string | null
  sideBPlayer1: string
  sideBPlayer2?: string | null
  setsWonBySideA: number
  setsWonBySideB: number
  winningSide?: string | null
  createdAt: string
}

interface TeamPlayerInfo {
  id: string
  playerId: string
  category: string
  player: {
    id: string
    name: string
    age: number | null
    gender: string | null
  }
}

interface Team {
  id: string
  name: string
  teamSize: number
  requiredMale: number
  requiredFemale: number
  requiredKid: number
  logoUrl: string | null
  players: TeamPlayerInfo[]
  _count: {
    players: number
  }
}

interface TeamMatchFixtureSummary {
  id: string
  teamAPlayer1Id: string | null
  matchId: string | null
}

interface TeamMatchSummary {
  id: string
  name: string
  category: string
  status: string
  fixturesWonByTeamA: number
  fixturesWonByTeamB: number
  totalPointsTeamA: number
  totalPointsTeamB: number
  winningTeamId: string | null
  winningTeam: { id: string; name: string } | null
  teamA: { id: string; name: string }
  teamB: { id: string; name: string }
  _count: { fixtures: number }
  fixtures: TeamMatchFixtureSummary[]
}

interface GroupTeam {
  teamId: string
  team: { id: string; name: string }
  seedOrder: number
}

interface TournamentGroup {
  id: string
  name: string
  sortOrder: number
  groupTeams: GroupTeam[]
}

interface KnockoutMatchData {
  id: string
  round: string
  matchNumber: number
  teamAId?: string | null
  teamBId?: string | null
  teamASourceLabel?: string | null
  teamBSourceLabel?: string | null
  winnerTeamId?: string | null
  teamMatchId?: string | null
  teamA?: { id: string; name: string } | null
  teamB?: { id: string; name: string } | null
  winnerTeam?: { id: string; name: string } | null
  teamMatch?: {
    id: string
    name: string
    status: string
    fixturesWonByTeamA: number
    fixturesWonByTeamB: number
    winningTeamId: string | null
  } | null
}

interface Tournament {
  id: string
  name: string
  description?: string
  dateFrom: string
  dateTo: string
  organizerName: string
  organizerEmail?: string
  organizerPhone?: string
  venue?: string
  city?: string
  titlePhoto?: string
  titlePhotoPosition?: string
  category?: string
  requiresTeams: boolean
  format?: string
  numberOfGroups?: number
  qualifyPerGroup?: number
  status: string
  createdAt: string
  matches: Match[]
  teams: Team[]
  teamMatches: TeamMatchSummary[]
  groups?: TournamentGroup[]
  knockoutMatches?: KnockoutMatchData[]
  _count: {
    matches: number
    teams: number
    teamMatches: number
  }
}

interface GroupStandingEntry {
  teamId: string
  teamName: string
  played: number
  won: number
  lost: number
  drawn: number
  fixturesWon: number
  fixturesLost: number
  pointsFor: number
  pointsAgainst: number
}

interface GroupStandingData {
  groupId: string
  groupName: string
  sortOrder: number
  standings: GroupStandingEntry[]
}

export default function TournamentDetailPage({ params }: { params: { tournamentId: string } }) {
  const router = useRouter()
  const { canManage } = useRole()
  const { alert, confirm, confirmDelete } = useAlertDialog()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})
  const [tournamentPlayerCount, setTournamentPlayerCount] = useState(0)

  // Groups/Knockout state
  const [groupStandings, setGroupStandings] = useState<GroupStandingData[]>([])
  const [generatingGroups, setGeneratingGroups] = useState(false)
  const [generatingLeagueMatches, setGeneratingLeagueMatches] = useState(false)
  const [generatingBracket, setGeneratingBracket] = useState(false)
  const [rearrangeOpen, setRearrangeOpen] = useState(false)

  // Title photo state
  const [titlePhotoDialogOpen, setTitlePhotoDialogOpen] = useState(false)
  const [titlePhotoUrl, setTitlePhotoUrl] = useState("")
  const [titlePhotoSaving, setTitlePhotoSaving] = useState(false)

  // Fixtures state
  const [fixtures, setFixtures] = useState<any[]>([])
  const [fixturesLoading, setFixturesLoading] = useState(false)
  const [uploadingFixtureId, setUploadingFixtureId] = useState<string | null>(null)

  // Auction state
  const [auctionData, setAuctionData] = useState<{
    id: string
    name: string
    status: string
    _count: { teams: number; players: number }
  } | null>(null)
  const [auctionLoading, setAuctionLoading] = useState(false)
  const [creatingAuction, setCreatingAuction] = useState(false)
  const [syncingTeams, setSyncingTeams] = useState(false)
  const [auctionDialogOpen, setAuctionDialogOpen] = useState(false)
  const [auctionName, setAuctionName] = useState("")
  const [auctionTeams, setAuctionTeams] = useState<{ name: string; budget: string }[]>([])

  const isLeagueKnockout = tournament?.format === "LEAGUE_KNOCKOUT"
  const isKnockoutOnly = tournament?.format === "KNOCKOUT_ONLY"
  const isCustom = !isLeagueKnockout && !isKnockoutOnly

  useEffect(() => {
    fetchTournament()
    fetchPlayerMap()
    fetchTournamentPlayerCount()
    fetchAuction()
    fetchFixtures()
  }, [params.tournamentId])

  useEffect(() => {
    if (tournament && isLeagueKnockout) {
      fetchGroupStandings()
    }
  }, [tournament?.id, isLeagueKnockout])

  const fetchTournament = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.tournamentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tournament")
      }

      setTournament(data.data.tournament)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayerMap = async () => {
    try {
      const response = await fetch("/api/players?limit=500")
      const data = await response.json()
      if (response.ok) {
        const map: Record<string, string> = {}
        for (const player of data.data.players) {
          map[player.name] = player.id
        }
        setPlayerMap(map)
      }
    } catch (error) {
      console.error("Failed to fetch player map:", error)
    }
  }

  const fetchTournamentPlayerCount = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.tournamentId}/players`)
      const data = await response.json()
      if (response.ok) {
        setTournamentPlayerCount(data.data.players.length)
      }
    } catch (error) {
      console.error("Failed to fetch tournament player count:", error)
    }
  }

  const fetchGroupStandings = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.tournamentId}/groups`)
      const data = await response.json()
      if (response.ok) {
        setGroupStandings(data.data.standings || [])
      }
    } catch (error) {
      console.error("Failed to fetch group standings:", error)
    }
  }

  const fetchAuction = async () => {
    try {
      setAuctionLoading(true)
      const response = await fetch(`/api/auctions?tournamentId=${params.tournamentId}`)
      const data = await response.json()
      if (response.ok && data.data.auctions.length > 0) {
        setAuctionData(data.data.auctions[0])
      }
    } catch (error) {
      console.error("Failed to fetch auction:", error)
    } finally {
      setAuctionLoading(false)
    }
  }

  const fetchFixtures = async () => {
    try {
      setFixturesLoading(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}/fixtures`)
      const data = await response.json()
      if (response.ok) {
        setFixtures(data.data.fixtures)
      }
    } catch (error) {
      console.error("Failed to fetch fixtures:", error)
    } finally {
      setFixturesLoading(false)
    }
  }

  const handleFixtureImageUpload = async (fixtureId: string, file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("Please select an image file under 5MB", "Invalid File")
      return
    }
    setUploadingFixtureId(fixtureId)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        const response = await fetch(`/api/tournaments/${params.tournamentId}/fixtures/${fixtureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64 }),
        })
        if (response.ok) {
          await fetchFixtures()
        } else {
          const data = await response.json()
          alert(data.error || "Failed to upload image", "Error")
        }
        setUploadingFixtureId(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadingFixtureId(null)
    }
  }

  const handleRemoveFixtureImage = async (fixtureId: string) => {
    try {
      setUploadingFixtureId(fixtureId)
      const response = await fetch(`/api/tournaments/${params.tournamentId}/fixtures/${fixtureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: null }),
      })
      if (response.ok) {
        await fetchFixtures()
      }
    } catch (error) {
      console.error("Remove image error:", error)
    } finally {
      setUploadingFixtureId(null)
    }
  }

  const handleCreateAuction = () => {
    if (!tournament) return
    setAuctionName(`${tournament.name} Auction`)
    setAuctionTeams(
      tournament.teams.length > 0
        ? tournament.teams.map((t) => ({ name: t.name, budget: "800000" }))
        : []
    )
    setAuctionDialogOpen(true)
  }

  const handleCreateAuctionSubmit = async () => {
    if (!tournament) return

    try {
      setCreatingAuction(true)
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: auctionName,
          tournamentId: tournament.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || "Failed to create auction", "Error")
        return
      }

      const data = await response.json()
      const auctionId = data.data.auction.id

      const validTeams = auctionTeams.filter((t) => t.name.trim())
      if (validTeams.length > 0) {
        const teamsResponse = await fetch(`/api/auctions/${auctionId}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teams: validTeams.map((t) => ({
              name: t.name.trim(),
              budget: parseInt(t.budget) || 800000,
            })),
          }),
        })

        if (!teamsResponse.ok) {
          const teamsData = await teamsResponse.json()
          console.error("Failed to create auction teams:", teamsData.error)
        }
      }

      setAuctionDialogOpen(false)
      router.push(`/auctions/${auctionId}`)
    } catch (error) {
      console.error("Create auction error:", error)
      alert("An error occurred", "Error")
    } finally {
      setCreatingAuction(false)
    }
  }

  const handleSyncTeams = async () => {
    if (!auctionData) return

    const confirmed = await confirm(
      "Create tournament teams from auction results? This will create teams with their sold players.",
      "Create Tournament Teams"
    )
    if (!confirmed) return

    try {
      setSyncingTeams(true)
      const response = await fetch(
        `/api/auctions/${auctionData.id}/sync-teams`,
        { method: "POST" }
      )
      const data = await response.json()

      if (response.ok) {
        alert(`Created ${data.data.count} tournament teams!`, "Success")
        await fetchTournament()
        await fetchTournamentPlayerCount()
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

  const handleStartTournament = async () => {
    if (!tournament) return

    const today = new Date()
    const tournamentStart = new Date(tournament.dateFrom)
    today.setHours(0, 0, 0, 0)
    tournamentStart.setHours(0, 0, 0, 0)

    if (today < tournamentStart) {
      alert(
        `Cannot start tournament. Tournament is scheduled to start on ${tournamentStart.toLocaleDateString()}. Current date: ${today.toLocaleDateString()}`,
        "Cannot Start Tournament"
      )
      return
    }

    const confirmed = await confirm(
      "Start this tournament? Matches will be allowed to begin.",
      "Start Tournament"
    )
    if (!confirmed) return

    try {
      setIsStarting(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ONGOING" }),
      })

      if (response.ok) {
        await fetchTournament()
        alert("Tournament started successfully!", "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to start tournament", "Error")
      }
    } catch (error) {
      console.error("Start tournament error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsStarting(false)
    }
  }

  const handleFinishTournament = async () => {
    if (!tournament) return

    const incompleteMatches = tournament.matches.filter(
      (m) => m.status !== "COMPLETED" && m.status !== "ABANDONED"
    )

    if (incompleteMatches.length > 0) {
      alert(
        `Cannot finish tournament. ${incompleteMatches.length} match(es) are still incomplete (NOT_STARTED or IN_PROGRESS). Complete or abandon all matches first.`,
        "Cannot Finish Tournament"
      )
      return
    }

    const confirmed = await confirm(
      "Finish this tournament? The status will be changed to COMPLETED.",
      "Finish Tournament"
    )
    if (!confirmed) return

    try {
      setIsFinishing(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      if (response.ok) {
        await fetchTournament()
        alert("Tournament finished successfully!", "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to finish tournament", "Error")
      }
    } catch (error) {
      console.error("Finish tournament error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsFinishing(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete(
      "Are you sure you want to delete this tournament? This will not delete the matches."
    )
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/tournaments/${params.tournamentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/tournaments")
      } else {
        alert("Failed to delete tournament", "Error")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const confirmed = await confirmDelete(
      `Are you sure you want to delete team "${teamName}"? This action cannot be undone.`
    )
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/teams/${teamId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        await fetchTournament()
        alert("Team deleted successfully!", "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team", "Error")
      }
    } catch (error) {
      console.error("Delete team error:", error)
      alert("An error occurred", "Error")
    }
  }

  const handleDeleteTeamMatch = async (teamMatchId: string, teamMatchName: string) => {
    const confirmed = await confirmDelete(
      `Are you sure you want to delete team match "${teamMatchName}"? This will also delete all fixtures.`
    )
    if (!confirmed) return

    try {
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/team-matches/${teamMatchId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        await fetchTournament()
        alert("Team match deleted successfully!", "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team match", "Error")
      }
    } catch (error) {
      console.error("Delete team match error:", error)
      alert("An error occurred", "Error")
    }
  }

  const handleGenerateGroups = async () => {
    if (!tournament) return
    const numGroups = tournament.numberOfGroups ?? 2

    const confirmed = await confirm(
      `Generate ${numGroups} groups and randomly assign ${tournament._count.teams} teams?`,
      "Generate Groups"
    )
    if (!confirmed) return

    try {
      setGeneratingGroups(true)
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/groups/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numberOfGroups: numGroups }),
        }
      )

      if (response.ok) {
        await fetchTournament()
        await fetchGroupStandings()
        alert("Groups generated successfully!", "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to generate groups", "Error")
      }
    } catch (error) {
      console.error("Generate groups error:", error)
      alert("An error occurred", "Error")
    } finally {
      setGeneratingGroups(false)
    }
  }

  const handleGenerateLeagueMatches = async () => {
    const confirmed = await confirm(
      "Generate round-robin team matches for all groups? This will create matches based on the default format.",
      "Generate League Matches"
    )
    if (!confirmed) return

    try {
      setGeneratingLeagueMatches(true)
      const response = await fetch(
        `/api/tournaments/${params.tournamentId}/groups/generate-matches`,
        { method: "POST" }
      )

      if (response.ok) {
        const data = await response.json()
        await fetchTournament()
        alert(`Created ${data.data.count} league matches!`, "Success")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to generate matches", "Error")
      }
    } catch (error) {
      console.error("Generate league matches error:", error)
      alert("An error occurred", "Error")
    } finally {
      setGeneratingLeagueMatches(false)
    }
  }

  const handleGenerateBracket = async () => {
    if (!tournament) return

    if (isLeagueKnockout) {
      const confirmed = await confirm(
        "Generate knockout bracket from group standings? Top qualifiers from each group will be seeded.",
        "Generate Bracket"
      )
      if (!confirmed) return

      try {
        setGeneratingBracket(true)
        const response = await fetch(
          `/api/tournaments/${params.tournamentId}/knockout/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seedFromGroups: true }),
          }
        )

        if (response.ok) {
          await fetchTournament()
          alert("Bracket generated successfully!", "Success")
        } else {
          const data = await response.json()
          alert(data.error || "Failed to generate bracket", "Error")
        }
      } catch (error) {
        console.error("Generate bracket error:", error)
        alert("An error occurred", "Error")
      } finally {
        setGeneratingBracket(false)
      }
    } else {
      // KNOCKOUT_ONLY — use all teams
      const teamIds = tournament.teams.map((t) => t.id)
      if (teamIds.length < 2) {
        alert("Need at least 2 teams to generate a bracket", "Error")
        return
      }

      const confirmed = await confirm(
        `Generate knockout bracket with ${teamIds.length} teams?`,
        "Generate Bracket"
      )
      if (!confirmed) return

      try {
        setGeneratingBracket(true)
        const response = await fetch(
          `/api/tournaments/${params.tournamentId}/knockout/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamIds }),
          }
        )

        if (response.ok) {
          await fetchTournament()
          alert("Bracket generated successfully!", "Success")
        } else {
          const data = await response.json()
          alert(data.error || "Failed to generate bracket", "Error")
        }
      } catch (error) {
        console.error("Generate bracket error:", error)
        alert("An error occurred", "Error")
      } finally {
        setGeneratingBracket(false)
      }
    }
  }

  const computeStandings = () => {
    if (!tournament || !tournament.requiresTeams) return []

    const teamStats: Record<string, {
      teamId: string
      teamName: string
      played: number
      won: number
      lost: number
      drawn: number
      fixturesWon: number
      fixturesLost: number
      pointsFor: number
      pointsAgainst: number
    }> = {}

    for (const team of tournament.teams) {
      teamStats[team.id] = {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        fixturesWon: 0,
        fixturesLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      }
    }

    for (const tm of tournament.teamMatches) {
      if (tm.status !== "COMPLETED") continue

      const statsA = teamStats[tm.teamA.id]
      const statsB = teamStats[tm.teamB.id]
      if (!statsA || !statsB) continue

      statsA.played++
      statsB.played++

      statsA.fixturesWon += tm.fixturesWonByTeamA
      statsA.fixturesLost += tm.fixturesWonByTeamB
      statsB.fixturesWon += tm.fixturesWonByTeamB
      statsB.fixturesLost += tm.fixturesWonByTeamA

      statsA.pointsFor += tm.totalPointsTeamA
      statsA.pointsAgainst += tm.totalPointsTeamB
      statsB.pointsFor += tm.totalPointsTeamB
      statsB.pointsAgainst += tm.totalPointsTeamA

      if (tm.winningTeamId === tm.teamA.id) {
        statsA.won++
        statsB.lost++
      } else if (tm.winningTeamId === tm.teamB.id) {
        statsB.won++
        statsA.lost++
      } else {
        statsA.drawn++
        statsB.drawn++
      }
    }

    return Object.values(teamStats).sort((a, b) => {
      const pointsA = a.won * 2 + a.drawn
      const pointsB = b.won * 2 + b.drawn
      if (pointsB !== pointsA) return pointsB - pointsA
      const diffA = a.pointsFor - a.pointsAgainst
      const diffB = b.pointsFor - b.pointsAgainst
      if (diffB !== diffA) return diffB - diffA
      return b.pointsFor - a.pointsFor
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      NOT_STARTED: "bg-gray-100 text-gray-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      ABANDONED: "bg-red-100 text-red-800",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colors[status as keyof typeof colors]
        }`}
      >
        {status.replace("_", " ")}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const getFormatLabel = (format?: string) => {
    switch (format) {
      case "LEAGUE_KNOCKOUT": return "League + Knockout"
      case "KNOCKOUT_ONLY": return "Knockout Only"
      default: return "Custom"
    }
  }

  const convertGoogleDriveUrl = (url: string): string => {
    if (!url) return url
    const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
    const openIdMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
    const idParam = url.match(/[?&]id=([^&]+)/)
    const fileId = fileIdMatch?.[1] || openIdMatch?.[1] || idParam?.[1]
    if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w4000`
    if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return `https://drive.google.com/thumbnail?id=${url.trim()}&sz=w4000`
    return url
  }

  const handleSaveTitlePhoto = async (url: string | null) => {
    if (!tournament) return
    setTitlePhotoSaving(true)
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titlePhoto: url }),
      })
      if (res.ok) {
        setTournament((prev) => prev ? { ...prev, titlePhoto: url ?? undefined } : prev)
        setTitlePhotoDialogOpen(false)
        setTitlePhotoUrl("")
      }
    } catch (error) {
      console.error("Save title photo error:", error)
    } finally {
      setTitlePhotoSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading tournament...</div>
        </main>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Tournament not found"}</div>
        </main>
      </div>
    )
  }

  // Determine default tab and available tabs
  const defaultTab = isLeagueKnockout
    ? "groups"
    : isKnockoutOnly
    ? "knockout"
    : tournament.requiresTeams
    ? "teams"
    : "matches"

  const hasGroups = (tournament.groups?.length ?? 0) > 0
  const hasKnockoutMatches = (tournament.knockoutMatches?.length ?? 0) > 0
  const allLeagueMatchesDone = isLeagueKnockout && groupStandings.length > 0 &&
    groupStandings.every((g) => {
      const teamsInGroup = tournament.groups?.find((gr) => gr.id === g.groupId)?.groupTeams.length ?? 0
      const expectedMatches = (teamsInGroup * (teamsInGroup - 1)) / 2
      const completedCount = g.standings.reduce((sum, s) => sum + s.played, 0) / 2
      return expectedMatches > 0 && completedCount >= expectedMatches
    })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/tournaments")}>
            ← Back to Tournaments
          </Button>
          {canManage && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {tournament.status === "UPCOMING" && (
                <>
                  <Button
                    onClick={handleStartTournament}
                    disabled={isStarting}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
                  >
                    {isStarting ? "⏳ Starting..." : "🏁 Start"}
                  </Button>
                  <Link href={`/tournaments/${tournament.id}/edit`}>
                    <Button variant="outline" size="lg">
                      Edit Tournament
                    </Button>
                  </Link>
                </>
              )}
              {tournament.status === "ONGOING" && (
                <Button
                  onClick={handleFinishTournament}
                  disabled={isFinishing}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
                >
                  {isFinishing ? "⏳ Finishing..." : "🏆 Finish Tournament"}
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Tournament"}
              </Button>
            </div>
          )}
        </div>

        {/* Tournament Info Card */}
        <Card className="mb-6">
          {tournament.titlePhoto ? (
            <div className="relative w-full h-48 sm:h-64 overflow-hidden rounded-t-lg group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={convertGoogleDriveUrl(tournament.titlePhoto)}
                alt={tournament.name}
                className={`w-full h-full object-cover ${
                  tournament.titlePhotoPosition === "top" ? "object-top" :
                  tournament.titlePhotoPosition === "bottom" ? "object-bottom" :
                  "object-center"
                }`}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
              {canManage && (
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={async () => {
                        const res = await fetch(`/api/tournaments/${tournament.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ titlePhotoPosition: pos }),
                        })
                        if (res.ok) {
                          setTournament((prev) => prev ? { ...prev, titlePhotoPosition: pos } : prev)
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                        (tournament.titlePhotoPosition || "center") === pos
                          ? "bg-white text-black shadow"
                          : "bg-black/50 text-white hover:bg-black/70"
                      }`}
                    >
                      {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setTitlePhotoUrl(tournament.titlePhoto || "")
                      setTitlePhotoDialogOpen(true)
                    }}
                    className="px-2 py-1 text-xs rounded font-medium bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => handleSaveTitlePhoto(null)}
                    className="px-2 py-1 text-xs rounded font-medium bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : canManage ? (
            <button
              onClick={() => {
                setTitlePhotoUrl("")
                setTitlePhotoDialogOpen(true)
              }}
              className="w-full h-32 border-b border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors rounded-t-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Add Title Photo</span>
            </button>
          ) : null}
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{tournament.name}</CardTitle>
                <CardDescription className="mt-2">
                  {formatDate(tournament.dateFrom)} - {formatDate(tournament.dateTo)}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {tournament.requiresTeams && tournament.format && tournament.format !== "CUSTOM" && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-teal-100 text-teal-800">
                    {getFormatLabel(tournament.format)}
                  </span>
                )}
                {getStatusBadge(tournament.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tournament.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{tournament.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tournament.venue && (
                <div>
                  <div className="text-sm text-muted-foreground">Venue</div>
                  <div className="font-medium">{tournament.venue}</div>
                </div>
              )}
              {tournament.city && (
                <div>
                  <div className="text-sm text-muted-foreground">City</div>
                  <div className="font-medium">{tournament.city}</div>
                </div>
              )}
              {tournament.category && (
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{tournament.category}</div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Organizer Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{tournament.organizerName}</div>
                </div>
                {tournament.organizerEmail && (
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{tournament.organizerEmail}</div>
                  </div>
                )}
                {tournament.organizerPhone && (
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{tournament.organizerPhone}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab}>
          <TabsList className="w-full flex flex-wrap">
            <TabsTrigger value="players" className="flex-1">Players ({tournamentPlayerCount})</TabsTrigger>
            {tournament.requiresTeams && (
              <TabsTrigger value="teams" className="flex-1">Teams ({tournament._count.teams})</TabsTrigger>
            )}
            {tournament.requiresTeams && (
              <TabsTrigger value="auction" className="flex-1">Auction</TabsTrigger>
            )}
            {isLeagueKnockout && (
              <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
            )}
            {(isLeagueKnockout || isKnockoutOnly) && (
              <TabsTrigger value="knockout" className="flex-1">Knockout</TabsTrigger>
            )}
            {canManage && isCustom && tournament.requiresTeams && (
              <TabsTrigger value="standings" className="flex-1">Standings</TabsTrigger>
            )}
            {tournament.requiresTeams && (
              <TabsTrigger value="team-matches" className="flex-1">Team Matches ({tournament._count.teamMatches})</TabsTrigger>
            )}
            {tournament.requiresTeams && (
              <TabsTrigger value="fixtures" className="flex-1">Fixtures ({fixtures.length})</TabsTrigger>
            )}
            <TabsTrigger value="matches" className="flex-1">Matches ({tournament._count.matches})</TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Players ({tournamentPlayerCount})</CardTitle>
                <CardDescription>Players registered for this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <TournamentPlayerManager
                  tournamentId={tournament.id}
                  key={tournament.id}
                  onPlayersChanged={fetchTournamentPlayerCount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab (LEAGUE_KNOCKOUT) */}
          {isLeagueKnockout && (
            <TabsContent value="groups">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Groups</CardTitle>
                      <CardDescription>
                        {hasGroups ? `${tournament.groups!.length} groups` : "Generate groups to assign teams"}
                      </CardDescription>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleGenerateGroups}
                          disabled={generatingGroups || tournament._count.teams < 2}
                        >
                          {generatingGroups ? "Generating..." : hasGroups ? "Regenerate Groups" : "Generate Groups"}
                        </Button>
                        {hasGroups && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRearrangeOpen(true)}
                            >
                              Rearrange
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleGenerateLeagueMatches}
                              disabled={generatingLeagueMatches}
                            >
                              {generatingLeagueMatches ? "Generating..." : "Generate League Matches"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!hasGroups ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No groups generated yet. Add teams first, then generate groups.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Link href={`/tournaments/${tournament.id}/teams/new`}>
                          <Button variant="outline">Add Team</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tournament.groups!.map((group) => {
                        const gs = groupStandings.find((s) => s.groupId === group.id)
                        return (
                          <GroupCard
                            key={group.id}
                            tournamentId={tournament.id}
                            groupName={group.name}
                            groupTeams={group.groupTeams}
                            standings={gs?.standings || []}
                            qualifyCount={tournament.qualifyPerGroup ?? 2}
                          />
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Per-group standings */}
              {groupStandings.length > 0 && (
                <div className="space-y-4 mt-4">
                  {groupStandings.map((gs) => {
                    const qCount = tournament.qualifyPerGroup ?? 2
                    return (
                      <Card key={gs.groupId}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{gs.groupName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {gs.standings.some((s) => s.played > 0) ? (
                            <>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b text-left">
                                      <th className="pb-2 pr-2 font-medium">#</th>
                                      <th className="pb-2 pr-2 font-medium">Team</th>
                                      <th className="pb-2 pr-2 font-medium text-center">P</th>
                                      <th className="pb-2 pr-2 font-medium text-center">W</th>
                                      <th className="pb-2 pr-2 font-medium text-center">L</th>
                                      <th className="pb-2 pr-2 font-medium text-center">D</th>
                                      <th className="pb-2 pr-2 font-medium text-center">PD</th>
                                      <th className="pb-2 font-medium text-center">Pts</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {gs.standings.map((s, i) => {
                                      const pts = s.won * 2 + s.drawn
                                      const diff = s.pointsFor - s.pointsAgainst
                                      const isQualified = i < qCount
                                      return (
                                        <tr
                                          key={s.teamId}
                                          className={`border-b last:border-0 ${isQualified ? "bg-green-50" : ""}`}
                                        >
                                          <td className="py-2 pr-2 font-medium">
                                            {i + 1}
                                            {isQualified && (
                                              <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                                                Q
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 pr-2 font-medium">
                                            <Link
                                              href={`/tournaments/${tournament.id}/teams/${s.teamId}`}
                                              className="hover:underline text-primary"
                                            >
                                              {s.teamName}
                                            </Link>
                                          </td>
                                          <td className="py-2 pr-2 text-center">{s.played}</td>
                                          <td className="py-2 pr-2 text-center">{s.won}</td>
                                          <td className="py-2 pr-2 text-center">{s.lost}</td>
                                          <td className="py-2 pr-2 text-center">{s.drawn}</td>
                                          <td className="py-2 pr-2 text-center">
                                            <span className={diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}>
                                              {diff > 0 ? "+" : ""}{diff}
                                            </span>
                                          </td>
                                          <td className="py-2 text-center font-bold">{pts}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-2">
                                P=Played, W=Won, L=Lost, D=Drawn, PD=Point Diff, Pts=Points (Win=2, Draw=1)
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No matches played yet.</p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                  {allLeagueMatchesDone && !hasKnockoutMatches && (
                    <div className="text-center py-4">
                      <Button onClick={handleGenerateBracket} disabled={generatingBracket}>
                        {generatingBracket ? "Generating..." : "Proceed to Knockout →"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {hasGroups && (
                <GroupRearrangeDialog
                  open={rearrangeOpen}
                  onOpenChange={setRearrangeOpen}
                  groups={tournament.groups!}
                  tournamentId={tournament.id}
                  onSaved={() => {
                    fetchTournament()
                    fetchGroupStandings()
                  }}
                />
              )}
            </TabsContent>
          )}

          {/* Knockout Tab */}
          {(isLeagueKnockout || isKnockoutOnly) && (
            <TabsContent value="knockout">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Knockout Bracket</CardTitle>
                      <CardDescription>
                        {hasKnockoutMatches ? "Elimination bracket" : "Generate the knockout bracket"}
                      </CardDescription>
                    </div>
                    {canManage && !hasKnockoutMatches && (
                      <Button
                        size="sm"
                        onClick={handleGenerateBracket}
                        disabled={generatingBracket}
                      >
                        {generatingBracket ? "Generating..." : "Generate Bracket"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {hasKnockoutMatches ? (
                    <KnockoutBracket
                      matches={tournament.knockoutMatches!}
                      tournamentId={tournament.id}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {isLeagueKnockout
                          ? allLeagueMatchesDone
                            ? "All league matches are complete. Generate the knockout bracket to continue."
                            : "Complete all league matches first, then generate the knockout bracket."
                          : "Add teams and generate the bracket to start the tournament."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Teams Tab */}
          {tournament.requiresTeams && (
            <TabsContent value="teams">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Teams ({tournament._count.teams})</CardTitle>
                      <CardDescription>Teams in this tournament</CardDescription>
                    </div>
                    {canManage && (
                      <Link href={`/tournaments/${tournament.id}/teams/new`}>
                        <Button size="sm">Create Team</Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(!tournament.teams || tournament.teams.length === 0) ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No teams in this tournament yet</p>
                      {canManage && (
                        <Link href={`/tournaments/${tournament.id}/teams/new`}>
                          <Button>Create First Team</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tournament.teams.map((team) => (
                        <Card key={team.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {team.logoUrl ? (
                                  <img
                                    src={team.logoUrl}
                                    alt={`${team.name} logo`}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {team.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{team.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({team._count.players} players)
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {team.requiredMale > 0 && (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                                        {team.requiredMale}M
                                      </span>
                                    )}
                                    {team.requiredFemale > 0 && (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-800">
                                        {team.requiredFemale}F
                                      </span>
                                    )}
                                    {team.requiredKid > 0 && (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                                        {team.requiredKid}K
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <Link href={`/tournaments/${tournament.id}/teams/${team.id}`}>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </Link>
                                {canManage && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteTeam(team.id, team.name)}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Team Matches Tab */}
          {tournament.requiresTeams && (
            <TabsContent value="team-matches">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Team Matches ({tournament._count.teamMatches})</CardTitle>
                      <CardDescription>Structured matches between teams</CardDescription>
                    </div>
                    {canManage && (
                      <Link href={`/tournaments/${tournament.id}/team-matches/new`}>
                        <Button size="sm">Create Team Match</Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {(!tournament.teamMatches || tournament.teamMatches.length === 0) ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No team matches created yet</p>
                      {canManage && (
                        <Link href={`/tournaments/${tournament.id}/team-matches/new`}>
                          <Button>Create First Team Match</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tournament.teamMatches.map((tm) => {
                        const assignedCount = tm.fixtures.filter((f) => f.teamAPlayer1Id).length
                        const totalFixtures = tm._count.fixtures
                        return (
                          <Card key={tm.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{tm.name}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      tm.category === "ADULT"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {tm.category}
                                    </span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      tm.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                                      tm.status === "READY" ? "bg-green-100 text-green-800" :
                                      tm.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                                      "bg-green-100 text-green-800"
                                    }`}>
                                      {tm.status.replace("_", " ")}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {tm.teamA.name} vs {tm.teamB.name}
                                  </div>
                                  {tm.status === "COMPLETED" ? (
                                    <div className="text-sm mt-1">
                                      <span className="font-semibold">
                                        {tm.fixturesWonByTeamA} - {tm.fixturesWonByTeamB}
                                      </span>
                                      {tm.winningTeam && (
                                        <span className="text-green-600 ml-2 text-xs">
                                          {tm.winningTeam.name} won
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {assignedCount}/{totalFixtures} fixtures assigned
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                  <Link href={`/tournaments/${tournament.id}/team-matches/${tm.id}`}>
                                    <Button variant="outline" size="sm">
                                      View
                                    </Button>
                                  </Link>
                                  {canManage && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteTeamMatch(tm.id, tm.name)}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Standings Tab */}
          {tournament.requiresTeams && isCustom && (
            <TabsContent value="standings">
              {(() => {
                  const standings = computeStandings()
                  const hasCompletedMatches = standings.some((s) => s.played > 0)
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle>Team Standings</CardTitle>
                        <CardDescription>Rankings based on completed team matches</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!hasCompletedMatches ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No completed team matches yet. Standings will appear once matches are completed.</p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-left">
                                    <th className="pb-2 pr-3 font-medium">#</th>
                                    <th className="pb-2 pr-3 font-medium">Team</th>
                                    <th className="pb-2 pr-3 font-medium text-center">P</th>
                                    <th className="pb-2 pr-3 font-medium text-center">W</th>
                                    <th className="pb-2 pr-3 font-medium text-center">L</th>
                                    <th className="pb-2 pr-3 font-medium text-center">D</th>
                                    <th className="pb-2 pr-3 font-medium text-center">FW</th>
                                    <th className="pb-2 pr-3 font-medium text-center">FL</th>
                                    <th className="pb-2 pr-3 font-medium text-center">PD</th>
                                    <th className="pb-2 font-medium text-center">Pts</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {standings.map((s, i) => {
                                    const pts = s.won * 2 + s.drawn
                                    const diff = s.pointsFor - s.pointsAgainst
                                    return (
                                      <tr key={s.teamId} className="border-b last:border-0">
                                        <td className="py-2 pr-3 font-medium">{i + 1}</td>
                                        <td className="py-2 pr-3 font-medium">{s.teamName}</td>
                                        <td className="py-2 pr-3 text-center">{s.played}</td>
                                        <td className="py-2 pr-3 text-center">{s.won}</td>
                                        <td className="py-2 pr-3 text-center">{s.lost}</td>
                                        <td className="py-2 pr-3 text-center">{s.drawn}</td>
                                        <td className="py-2 pr-3 text-center">{s.fixturesWon}</td>
                                        <td className="py-2 pr-3 text-center">{s.fixturesLost}</td>
                                        <td className="py-2 pr-3 text-center">
                                          <span className={diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}>
                                            {diff > 0 ? "+" : ""}{diff}
                                          </span>
                                        </td>
                                        <td className="py-2 text-center font-bold">{pts}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                              P=Played, W=Won, L=Lost, D=Drawn, FW=Fixtures Won, FL=Fixtures Lost, PD=Point Differential, Pts=Points (Win=2, Draw=1)
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })()}
            </TabsContent>
          )}

          {/* Auction Tab */}
          {tournament.requiresTeams && (
            <TabsContent value="auction">
              <Card>
                <CardHeader>
                  <CardTitle>Player Auction</CardTitle>
                  <CardDescription>
                    Run a player auction/draft for this tournament
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {auctionLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : !auctionData ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-4">
                        <GavelIcon size={64} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        No auction has been created for this tournament yet.
                      </p>
                      {canManage && (
                        <Button
                          onClick={handleCreateAuction}
                          disabled={creatingAuction}
                        >
                          {creatingAuction ? "Creating..." : "Create Auction"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{auctionData.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              auctionData.status === "LIVE" ? "bg-green-100 text-green-800" :
                              auctionData.status === "PAUSED" ? "bg-amber-100 text-amber-800" :
                              auctionData.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {auctionData.status}
                            </span>
                            <span>{auctionData._count.teams} teams</span>
                            <span>{auctionData._count.players} players</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {canManage && auctionData.status !== "SETUP" && (
                            <Button
                              variant="outline"
                              onClick={handleSyncTeams}
                              disabled={syncingTeams}
                            >
                              {syncingTeams ? "Creating..." : "Create Tournament Teams"}
                            </Button>
                          )}
                          <Link href={`/auctions/${auctionData.id}`}>
                            <Button>{canManage ? "Open Auction" : "View Auction"}</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Fixtures Tab */}
          {tournament.requiresTeams && (
            <TabsContent value="fixtures">
              <Card>
                <CardHeader>
                  <CardTitle>Fixtures ({fixtures.length})</CardTitle>
                  <CardDescription>All fixtures across team matches</CardDescription>
                </CardHeader>
                <CardContent>
                  {fixturesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading fixtures...</div>
                  ) : fixtures.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No fixtures yet. Create team matches first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fixtures.map((fixture) => {
                        const fixtureTypeLabel: Record<string, string> = {
                          MEN_DOUBLES: "Men's Doubles",
                          WOMEN_DOUBLES: "Women's Doubles",
                          MIXED_DOUBLES: "Mixed Doubles",
                          MEN_SINGLES: "Men's Singles",
                          WOMEN_SINGLES: "Women's Singles",
                          KIDS_SINGLES: "Kids Singles",
                          KIDS_DOUBLES: "Kids Doubles",
                        }
                        const typeLabel = fixtureTypeLabel[fixture.fixtureType] || fixture.fixtureType
                        const matchStatus = fixture.match?.status
                        return (
                          <Card key={fixture.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Fixture image */}
                                <div className="flex-shrink-0">
                                  {fixture.imageUrl ? (
                                    <div className="relative group">
                                      <img
                                        src={fixture.imageUrl}
                                        alt={`Fixture ${fixture.fixtureNumber}`}
                                        className="w-20 h-20 rounded-lg object-cover border"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                                      />
                                      <button
                                        onClick={() => handleRemoveFixtureImage(fixture.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={uploadingFixtureId === fixture.id}
                                      >
                                        x
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span className="text-[10px] text-gray-400 mt-0.5">Add Photo</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) handleFixtureImageUpload(fixture.id, file)
                                          e.target.value = ""
                                        }}
                                        disabled={uploadingFixtureId === fixture.id}
                                      />
                                    </label>
                                  )}
                                </div>

                                {/* Fixture details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      #{fixture.fixtureNumber} {typeLabel}
                                    </span>
                                    {matchStatus && (
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        matchStatus === "COMPLETED" ? "bg-green-100 text-green-800" :
                                        matchStatus === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                                        "bg-gray-100 text-gray-800"
                                      }`}>
                                        {matchStatus.replace("_", " ")}
                                      </span>
                                    )}
                                    {uploadingFixtureId === fixture.id && (
                                      <span className="text-xs text-muted-foreground">Uploading...</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1.5">
                                    {fixture.teamMatch.teamA.name} vs {fixture.teamMatch.teamB.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {fixture.teamMatch.name}
                                  </div>
                                  {fixture.teamAPlayer1 && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                      <span>
                                        <span className="text-muted-foreground">A: </span>
                                        {fixture.teamAPlayer1.name}
                                        {fixture.teamAPlayer2 && ` & ${fixture.teamAPlayer2.name}`}
                                      </span>
                                      <span>
                                        <span className="text-muted-foreground">B: </span>
                                        {fixture.teamBPlayer1?.name}
                                        {fixture.teamBPlayer2 && ` & ${fixture.teamBPlayer2.name}`}
                                      </span>
                                    </div>
                                  )}
                                  {fixture.match && fixture.match.status === "COMPLETED" && (
                                    <div className="text-xs font-semibold mt-1">
                                      Score: {fixture.match.setsWonBySideA} - {fixture.match.setsWonBySideB}
                                    </div>
                                  )}
                                </div>

                                {/* View match link */}
                                {fixture.match && (
                                  <div className="flex-shrink-0">
                                    <Link href={`/matches/${fixture.match.id}`}>
                                      <Button variant="outline" size="sm">View Match</Button>
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tournament Matches ({tournament._count.matches})</CardTitle>
                    <CardDescription>All matches in this tournament</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {tournament.matches.length > 0 && (
                      <>
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                          </svg>
                        </Button>
                      </>
                    )}
                    {canManage && (
                      <Link href={`/tournaments/${tournament.id}/matches/new`}>
                        <Button size="sm">Create Match</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tournament.matches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No matches in this tournament yet</p>
                    {canManage && (
                      <Link href={`/tournaments/${tournament.id}/matches/new`}>
                        <Button>Create First Match</Button>
                      </Link>
                    )}
                  </div>
                ) : viewMode === "list" ? (
                  <div className="space-y-3">
                    {tournament.matches.map((match) => (
                      <Card key={match.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{match.name}</span>
                                {getStatusBadge(match.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                                {match.sideAPlayer2 && <>{" & "}<PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></>}
                                {" vs "}
                                <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                                {match.sideBPlayer2 && <>{" & "}<PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></>}
                              </div>
                            </div>
                            {match.status !== "NOT_STARTED" && (
                              <div className="flex-shrink-0 text-center px-6">
                                <div className="text-3xl font-bold tabular-nums">
                                  {match.setsWonBySideA} - {match.setsWonBySideB}
                                </div>
                                {match.winningSide && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    Side {match.winningSide} Won
                                  </div>
                                )}
                              </div>
                            )}
                            <Link href={`/matches/${match.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tournament.matches.map((match) => (
                      <Card key={match.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base truncate">{match.name}</CardTitle>
                            {getStatusBadge(match.status)}
                          </div>
                          <CardDescription className="text-xs">
                            {match.type}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm">
                              <div className="mb-1">
                                <span className="font-medium">Team A:</span>
                                <div className="text-muted-foreground">
                                  <PlayerLink name={match.sideAPlayer1} playerMap={playerMap} />
                                  {match.sideAPlayer2 && <>{" & "}<PlayerLink name={match.sideAPlayer2} playerMap={playerMap} /></>}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Team B:</span>
                                <div className="text-muted-foreground">
                                  <PlayerLink name={match.sideBPlayer1} playerMap={playerMap} />
                                  {match.sideBPlayer2 && <>{" & "}<PlayerLink name={match.sideBPlayer2} playerMap={playerMap} /></>}
                                </div>
                              </div>
                            </div>
                            {match.status !== "NOT_STARTED" && (
                              <div className="text-center">
                                <div className="text-2xl font-bold tabular-nums">
                                  {match.setsWonBySideA} - {match.setsWonBySideB}
                                </div>
                                {match.winningSide && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Side {match.winningSide} Won
                                  </div>
                                )}
                              </div>
                            )}
                            <Link href={`/matches/${match.id}`} className="block">
                              <Button variant="outline" size="sm" className="w-full">
                                View Match
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Auction Dialog */}
        <Dialog open={auctionDialogOpen} onOpenChange={setAuctionDialogOpen}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Auction</DialogTitle>
              <DialogDescription>
                Set up the auction name and teams with their budgets.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auction-name">Auction Name</Label>
                <Input
                  id="auction-name"
                  value={auctionName}
                  onChange={(e) => setAuctionName(e.target.value)}
                  placeholder="Auction name"
                />
              </div>
              <AuctionTeamSetup teams={auctionTeams} onChange={setAuctionTeams} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAuctionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAuctionSubmit}
                disabled={creatingAuction || !auctionName.trim()}
              >
                {creatingAuction ? "Creating..." : "Create Auction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Title Photo Dialog */}
        <Dialog open={titlePhotoDialogOpen} onOpenChange={setTitlePhotoDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{tournament.titlePhoto ? "Change Title Photo" : "Add Title Photo"}</DialogTitle>
              <DialogDescription>
                Enter an image URL, Google Drive link, or upload a file.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Preview */}
              {titlePhotoUrl && !titlePhotoUrl.startsWith("data:") && (
                <div className="w-full h-32 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={convertGoogleDriveUrl(titlePhotoUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block" }}
                  />
                </div>
              )}
              {titlePhotoUrl && titlePhotoUrl.startsWith("data:") && (
                <div className="w-full h-32 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={titlePhotoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
              )}

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="titlePhotoUrl">Image URL or Google Drive link</Label>
                <Input
                  id="titlePhotoUrl"
                  value={titlePhotoUrl.startsWith("data:") ? "" : titlePhotoUrl}
                  onChange={(e) => setTitlePhotoUrl(e.target.value)}
                  placeholder="https://... or Google Drive link"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="titlePhotoFile">Or upload a file</Label>
                <Input
                  id="titlePhotoFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) {
                      alert("Image must be under 5MB", "File Too Large")
                      return
                    }
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setTitlePhotoUrl(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ""
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Max 5MB. For Google Drive, make sure the file is set to "Anyone with the link can view"
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTitlePhotoDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveTitlePhoto(titlePhotoUrl || null)}
                disabled={titlePhotoSaving || !titlePhotoUrl}
              >
                {titlePhotoSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
