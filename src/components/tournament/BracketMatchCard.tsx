"use client"

import Link from "next/link"

interface BracketMatchCardProps {
  tournamentId: string
  teamAName?: string
  teamBName?: string
  teamASourceLabel?: string
  teamBSourceLabel?: string
  winnerTeamId?: string | null
  teamAId?: string | null
  teamBId?: string | null
  teamMatchId?: string | null
  teamMatchStatus?: string | null
  fixturesWonByTeamA?: number
  fixturesWonByTeamB?: number
}

export function BracketMatchCard({
  tournamentId,
  teamAName,
  teamBName,
  teamASourceLabel,
  teamBSourceLabel,
  winnerTeamId,
  teamAId,
  teamBId,
  teamMatchId,
  teamMatchStatus,
  fixturesWonByTeamA,
  fixturesWonByTeamB,
}: BracketMatchCardProps) {
  const isCompleted = teamMatchStatus === "COMPLETED"
  const teamADisplay = teamAName || teamASourceLabel || "TBD"
  const teamBDisplay = teamBName || teamBSourceLabel || "TBD"
  const teamAWon = winnerTeamId && winnerTeamId === teamAId
  const teamBWon = winnerTeamId && winnerTeamId === teamBId

  const card = (
    <div className={`border rounded-lg overflow-hidden w-48 text-sm ${
      teamMatchId ? "cursor-pointer hover:shadow-md transition-shadow" : ""
    }`}>
      <div
        className={`px-3 py-1.5 flex items-center justify-between ${
          teamAWon ? "bg-green-50 font-semibold" : "bg-white"
        } border-b`}
      >
        <span className={`truncate ${!teamAName ? "text-muted-foreground italic" : ""}`}>
          {teamADisplay}
        </span>
        {isCompleted && (
          <span className="text-xs font-bold ml-2">{fixturesWonByTeamA ?? 0}</span>
        )}
      </div>
      <div
        className={`px-3 py-1.5 flex items-center justify-between ${
          teamBWon ? "bg-green-50 font-semibold" : "bg-white"
        }`}
      >
        <span className={`truncate ${!teamBName ? "text-muted-foreground italic" : ""}`}>
          {teamBDisplay}
        </span>
        {isCompleted && (
          <span className="text-xs font-bold ml-2">{fixturesWonByTeamB ?? 0}</span>
        )}
      </div>
    </div>
  )

  if (teamMatchId) {
    return (
      <Link href={`/tournaments/${tournamentId}/team-matches/${teamMatchId}`}>
        {card}
      </Link>
    )
  }

  return card
}
