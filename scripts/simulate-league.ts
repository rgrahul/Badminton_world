/**
 * Simulate all league team matches for a tournament,
 * then generate knockout bracket and simulate knockout.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const tournamentId = process.argv[2]
  if (!tournamentId) {
    console.error("Usage: npx tsx simulate_league.ts <tournamentId>")
    process.exit(1)
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { players: { include: { player: true } } } },
    },
  })

  if (!tournament) {
    console.error("Tournament not found")
    process.exit(1)
  }

  console.log(`\n🏸 Simulating league for: ${tournament.name}\n`)

  // Get all team matches (league matches)
  const teamMatches = await prisma.teamMatch.findMany({
    where: { tournamentId, status: { not: "COMPLETED" } },
    include: {
      teamA: { include: { players: { include: { player: true } } } },
      teamB: { include: { players: { include: { player: true } } } },
      fixtures: { include: { match: true }, orderBy: { fixtureNumber: "asc" } },
      group: true,
    },
    orderBy: { createdAt: "asc" },
  })

  console.log(`Found ${teamMatches.length} team matches to simulate\n`)

  for (const tm of teamMatches) {
    let fixturesWonA = 0
    let fixturesWonB = 0
    let totalPtsA = 0
    let totalPtsB = 0

    for (const fixture of tm.fixtures) {
      const isDoubles = ["MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "KIDS_DOUBLES"].includes(fixture.fixtureType)
      const setsToWin = Math.ceil(tm.setsCount / 2)

      // Pick random winner
      const winner: "A" | "B" = Math.random() < 0.5 ? "A" : "B"

      // Assign players if needed
      if (!fixture.teamAPlayer1Id) {
        await assignPlayers(fixture.id, fixture.fixtureType, tm.teamA, tm.teamB, isDoubles)
      }

      const updatedFixture = await prisma.fixture.findUnique({ where: { id: fixture.id } })
      if (!updatedFixture || !updatedFixture.teamAPlayer1Id) continue

      // Create match with sets
      let matchId = fixture.matchId
      if (!matchId) {
        const match = await prisma.$transaction(async (tx) => {
          const m = await tx.match.create({
            data: {
              name: `${formatFixtureType(fixture.fixtureType)} #${fixture.fixtureNumber}`,
              type: isDoubles ? "DOUBLES" : "SINGLES",
              status: "COMPLETED",
              setsCount: tm.setsCount,
              pointsToWin: tm.pointsToWin,
              deuceCap: tm.deuceCap,
              sideAPlayer1: updatedFixture.teamAPlayer1Id!,
              sideAPlayer2: updatedFixture.teamAPlayer2Id,
              sideBPlayer1: updatedFixture.teamBPlayer1Id!,
              sideBPlayer2: updatedFixture.teamBPlayer2Id,
              tournamentId,
              winningSide: winner,
              setsWonBySideA: 0,
              setsWonBySideB: 0,
              currentSetNumber: 1,
              startedAt: new Date(),
              completedAt: new Date(),
            },
          })

          // Generate realistic sets
          let setsWonA = 0
          let setsWonB = 0
          const totalSets = setsToWin + Math.floor(Math.random() * setsToWin)
          const actualSets = Math.min(totalSets, tm.setsCount)

          for (let s = 1; s <= actualSets; s++) {
            let setWinner: "A" | "B"
            if (setsWonA === setsToWin) break
            if (setsWonB === setsToWin) break

            if (s === actualSets || (setsWonA === setsToWin - 1 && winner === "A") || (setsWonB === setsToWin - 1 && winner === "B")) {
              setWinner = winner
            } else {
              setWinner = Math.random() < 0.5 ? "A" : "B"
            }

            const loserScore = Math.floor(Math.random() * (tm.pointsToWin - 5)) + 3
            const scoreA = setWinner === "A" ? tm.pointsToWin : loserScore
            const scoreB = setWinner === "B" ? tm.pointsToWin : loserScore

            await tx.set.create({
              data: {
                matchId: m.id,
                setNumber: s,
                scoreA,
                scoreB,
                winningSide: setWinner,
                completedAt: new Date(),
              },
            })

            totalPtsA += scoreA
            totalPtsB += scoreB
            if (setWinner === "A") setsWonA++
            else setsWonB++
          }

          await tx.match.update({
            where: { id: m.id },
            data: { setsWonBySideA: setsWonA, setsWonBySideB: setsWonB, currentSetNumber: setsWonA + setsWonB },
          })

          await tx.fixture.update({
            where: { id: fixture.id },
            data: { matchId: m.id },
          })

          return m
        })
        matchId = match.id
      }

      if (winner === "A") fixturesWonA++
      else fixturesWonB++
    }

    // Determine winner
    let winningTeamId: string | null = null
    if (fixturesWonA > fixturesWonB) winningTeamId = tm.teamAId
    else if (fixturesWonB > fixturesWonA) winningTeamId = tm.teamBId
    else if (totalPtsA > totalPtsB) winningTeamId = tm.teamAId
    else if (totalPtsB > totalPtsA) winningTeamId = tm.teamBId
    else winningTeamId = tm.teamAId

    await prisma.teamMatch.update({
      where: { id: tm.id },
      data: {
        status: "COMPLETED",
        fixturesWonByTeamA: fixturesWonA,
        fixturesWonByTeamB: fixturesWonB,
        totalPointsTeamA: totalPtsA,
        totalPointsTeamB: totalPtsB,
        winningTeamId,
      },
    })

    const winnerName = winningTeamId === tm.teamAId ? tm.teamA.name : tm.teamB.name
    const groupLabel = tm.group ? `[${tm.group.name}] ` : ""
    console.log(`  ${groupLabel}${tm.teamA.name} vs ${tm.teamB.name}  →  ${fixturesWonA}-${fixturesWonB}  🏆 ${winnerName}`)
  }

  console.log(`\n✅ All ${teamMatches.length} league matches completed!`)
}

async function assignPlayers(
  fixtureId: string,
  fixtureType: string,
  teamA: { players: { player: { id: string; gender: string | null } }[] },
  teamB: { players: { player: { id: string; gender: string | null } }[] },
  isDoubles: boolean,
) {
  const getPlayers = (team: typeof teamA, type: string) => {
    const players = team.players.map((tp) => tp.player)
    if (type === "MEN_DOUBLES" || type === "MEN_SINGLES") return players.filter((p) => p.gender === "MALE")
    if (type === "WOMEN_DOUBLES" || type === "WOMEN_SINGLES") return players.filter((p) => p.gender === "FEMALE")
    if (type === "KIDS_SINGLES" || type === "KIDS_DOUBLES") return players // kids are already in the team
    return players
  }

  let aPlayers = getPlayers(teamA, fixtureType)
  let bPlayers = getPlayers(teamB, fixtureType)
  if (aPlayers.length === 0) aPlayers = teamA.players.map((tp) => tp.player)
  if (bPlayers.length === 0) bPlayers = teamB.players.map((tp) => tp.player)
  if (aPlayers.length === 0 || bPlayers.length === 0) return

  // Shuffle for randomness
  aPlayers.sort(() => Math.random() - 0.5)
  bPlayers.sort(() => Math.random() - 0.5)

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      teamAPlayer1Id: aPlayers[0].id,
      teamAPlayer2Id: isDoubles && aPlayers.length > 1 ? aPlayers[1].id : null,
      teamBPlayer1Id: bPlayers[0].id,
      teamBPlayer2Id: isDoubles && bPlayers.length > 1 ? bPlayers[1].id : null,
    },
  })
}

function formatFixtureType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
