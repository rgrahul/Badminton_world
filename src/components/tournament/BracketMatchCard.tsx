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
    <div className={`border border-white/10 rounded-lg overflow-hidden w-48 text-sm ${
      teamMatchId ? "cursor-pointer hover:border-white/20 transition-colors" : ""
    }`}>
      <div
        className={`px-3 py-1.5 flex items-center justify-between ${
          teamAWon ? "bg-emerald-500/10 font-semibold text-emerald-300" : "bg-white/[0.03] text-gray-300"
        } border-b border-white/10`}
      >
        <span className={`truncate ${!teamAName ? "text-gray-500 italic" : ""}`}>
          {teamADisplay}
        </span>
        {isCompleted && (
          <span className="text-xs font-bold ml-2 text-white">{fixturesWonByTeamA ?? 0}</span>
        )}
      </div>
      <div
        className={`px-3 py-1.5 flex items-center justify-between ${
          teamBWon ? "bg-emerald-500/10 font-semibold text-emerald-300" : "bg-white/[0.03] text-gray-300"
        }`}
      >
        <span className={`truncate ${!teamBName ? "text-gray-500 italic" : ""}`}>
          {teamBDisplay}
        </span>
        {isCompleted && (
          <span className="text-xs font-bold ml-2 text-white">{fixturesWonByTeamB ?? 0}</span>
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
