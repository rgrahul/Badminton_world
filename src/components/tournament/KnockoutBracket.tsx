"use client"

import { BracketMatchCard } from "./BracketMatchCard"

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

interface KnockoutBracketProps {
  matches: KnockoutMatchData[]
  tournamentId: string
}

const ROUND_ORDER = ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "FINAL"]
const ROUND_LABELS: Record<string, string> = {
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTER_FINAL: "Quarter Finals",
  SEMI_FINAL: "Semi Finals",
  FINAL: "Final",
}

export function KnockoutBracket({ matches, tournamentId }: KnockoutBracketProps) {
  // Group matches by round
  const roundGroups: Record<string, KnockoutMatchData[]> = {}
  for (const match of matches) {
    if (!roundGroups[match.round]) roundGroups[match.round] = []
    roundGroups[match.round].push(match)
  }

  // Sort rounds in bracket order
  const rounds = ROUND_ORDER.filter((r) => roundGroups[r])

  if (rounds.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No bracket generated yet.</p>
  }

  // Check for champion
  const finalMatches = roundGroups["FINAL"]
  const champion = finalMatches?.[0]?.winnerTeam

  return (
    <div className="space-y-6">
      {champion && (
        <div className="text-center py-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
          <div className="text-3xl mb-1">🏆</div>
          <div className="text-lg font-bold text-yellow-800">Champion: {champion.name}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-8 min-w-max px-4 py-4">
          {rounds.map((round, roundIndex) => {
            const roundMatches = roundGroups[round].sort(
              (a, b) => a.matchNumber - b.matchNumber
            )

            return (
              <div key={round} className="flex flex-col items-center">
                <div className="text-sm font-semibold text-muted-foreground mb-4">
                  {ROUND_LABELS[round] || round}
                </div>
                <div
                  className="flex flex-col justify-around flex-1"
                  style={{ gap: `${Math.pow(2, roundIndex) * 1}rem` }}
                >
                  {roundMatches.map((match) => (
                    <BracketMatchCard
                      key={match.id}
                      tournamentId={tournamentId}
                      teamAName={match.teamA?.name}
                      teamBName={match.teamB?.name}
                      teamASourceLabel={match.teamASourceLabel || undefined}
                      teamBSourceLabel={match.teamBSourceLabel || undefined}
                      winnerTeamId={match.winnerTeamId}
                      teamAId={match.teamAId}
                      teamBId={match.teamBId}
                      teamMatchId={match.teamMatch?.id || match.teamMatchId}
                      teamMatchStatus={match.teamMatch?.status}
                      fixturesWonByTeamA={match.teamMatch?.fixturesWonByTeamA}
                      fixturesWonByTeamB={match.teamMatch?.fixturesWonByTeamB}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
