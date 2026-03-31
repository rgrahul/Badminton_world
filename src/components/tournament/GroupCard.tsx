"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GroupTeamInfo {
  teamId: string
  team: { id: string; name: string }
  seedOrder: number
}

interface Standing {
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

interface GroupCardProps {
  tournamentId: string
  groupName: string
  groupTeams: GroupTeamInfo[]
  standings: Standing[]
  qualifyCount: number
}

export function GroupCard({ tournamentId, groupName, groupTeams, standings, qualifyCount }: GroupCardProps) {
  const hasStandings = standings.some((s) => s.played > 0)

  // Use standings order if available, otherwise fall back to groupTeams order
  const orderedTeams = hasStandings
    ? standings.map((s, i) => ({
        teamId: s.teamId,
        teamName: s.teamName,
        isQualified: i < qualifyCount,
      }))
    : groupTeams.map((gt, i) => ({
        teamId: gt.teamId,
        teamName: gt.team.name,
        isQualified: false,
      }))

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">{groupName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {orderedTeams.map((t, i) => (
            <div
              key={t.teamId}
              className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 ${t.isQualified ? "bg-emerald-500/10" : ""}`}
            >
              <span className="text-sm font-medium text-gray-500 w-5">{i + 1}.</span>
              <Link
                href={`/tournaments/${tournamentId}/teams/${t.teamId}`}
                className="text-sm font-medium hover:underline text-emerald-400"
              >
                {t.teamName}
              </Link>
              {t.isQualified && (
                <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  Q
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
