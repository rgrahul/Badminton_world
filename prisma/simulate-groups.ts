import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── Score simulation helpers ──

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Simulate a single set. Returns { scoreA, scoreB, winningSide }.
 * pointsToWin=15, deuceCap=20
 */
function simulateSet(pointsToWin: number, deuceCap: number): { scoreA: number; scoreB: number; winningSide: "A" | "B" } {
  const winnerSide: "A" | "B" = Math.random() < 0.5 ? "A" : "B"

  // 70% normal win, 30% deuce scenario
  const isDeuce = Math.random() < 0.3

  let winnerScore: number
  let loserScore: number

  if (isDeuce) {
    // Deuce: both reach pointsToWin-1 (14), then fight to 2 ahead or deuceCap
    const extraPoints = randomInt(0, Math.floor((deuceCap - pointsToWin) / 2))
    winnerScore = pointsToWin + extraPoints
    loserScore = winnerScore - 2
    // Cap at deuceCap
    if (winnerScore > deuceCap) {
      winnerScore = deuceCap
      loserScore = deuceCap - 2
    }
  } else {
    winnerScore = pointsToWin
    loserScore = randomInt(Math.max(0, pointsToWin - 10), pointsToWin - 2)
  }

  return {
    scoreA: winnerSide === "A" ? winnerScore : loserScore,
    scoreB: winnerSide === "B" ? winnerScore : loserScore,
    winningSide: winnerSide,
  }
}

/**
 * Simulate a full match (best of N sets). Returns sets data and match winner.
 */
function simulateMatch(setsCount: number, pointsToWin: number, deuceCap: number) {
  const setsToWin = Math.ceil(setsCount / 2)
  const sets: { setNumber: number; scoreA: number; scoreB: number; winningSide: "A" | "B" }[] = []
  let setsWonA = 0
  let setsWonB = 0
  let setNum = 1

  while (setsWonA < setsToWin && setsWonB < setsToWin) {
    const set = simulateSet(pointsToWin, deuceCap)
    sets.push({ setNumber: setNum, ...set })
    if (set.winningSide === "A") setsWonA++
    else setsWonB++
    setNum++
  }

  return {
    sets,
    setsWonBySideA: setsWonA,
    setsWonBySideB: setsWonB,
    winningSide: setsWonA > setsWonB ? "A" as const : "B" as const,
  }
}

// ── Fixture type helpers ──

type PlayerInfo = { id: string; name: string; category: string }

function isDoubles(fixtureType: string): boolean {
  return fixtureType.includes("DOUBLES")
}

function getMatchType(fixtureType: string): "SINGLES" | "DOUBLES" {
  return isDoubles(fixtureType) ? "DOUBLES" : "SINGLES"
}

function pickPlayers(
  fixtureType: string,
  teamAPlayers: PlayerInfo[],
  teamBPlayers: PlayerInfo[],
) {
  const males = (players: PlayerInfo[]) => players.filter((p) => p.category === "MALE")
  const females = (players: PlayerInfo[]) => players.filter((p) => p.category === "FEMALE")

  let aPool: PlayerInfo[]
  let bPool: PlayerInfo[]

  switch (fixtureType) {
    case "MEN_DOUBLES":
    case "MEN_SINGLES":
      aPool = males(teamAPlayers)
      bPool = males(teamBPlayers)
      break
    case "WOMEN_DOUBLES":
      aPool = females(teamAPlayers)
      bPool = females(teamBPlayers)
      break
    case "MIXED_DOUBLES":
      // 1 male + 1 female per side
      const aMales = males(teamAPlayers)
      const aFemales = females(teamAPlayers)
      const bMales = males(teamBPlayers)
      const bFemales = females(teamBPlayers)
      return {
        sideAPlayer1: aMales[randomInt(0, aMales.length - 1)]?.name ?? "Player A1",
        sideAPlayer2: aFemales[randomInt(0, aFemales.length - 1)]?.name ?? "Player A2",
        sideBPlayer1: bMales[randomInt(0, bMales.length - 1)]?.name ?? "Player B1",
        sideBPlayer2: bFemales[randomInt(0, bFemales.length - 1)]?.name ?? "Player B2",
        type: "DOUBLES" as const,
      }
    default:
      aPool = males(teamAPlayers)
      bPool = males(teamBPlayers)
  }

  const needTwo = isDoubles(fixtureType)

  const a1 = aPool[randomInt(0, aPool.length - 1)]
  const b1 = bPool[randomInt(0, bPool.length - 1)]

  if (needTwo) {
    const a2 = aPool.filter((p) => p.id !== a1?.id)[randomInt(0, Math.max(0, aPool.length - 2))]
    const b2 = bPool.filter((p) => p.id !== b1?.id)[randomInt(0, Math.max(0, bPool.length - 2))]
    return {
      sideAPlayer1: a1?.name ?? "Player A1",
      sideAPlayer2: a2?.name ?? "Player A2",
      sideBPlayer1: b1?.name ?? "Player B1",
      sideBPlayer2: b2?.name ?? "Player B2",
      type: "DOUBLES" as const,
    }
  }

  return {
    sideAPlayer1: a1?.name ?? "Player A1",
    sideAPlayer2: undefined,
    sideBPlayer1: b1?.name ?? "Player B1",
    sideBPlayer2: undefined,
    type: "SINGLES" as const,
  }
}

// ── Main simulation ──

async function main() {
  console.log("🏸 Simulating all group stage matches...\n")

  // Find the tournament
  const tournament = await prisma.tournament.findFirst({
    where: { name: "Premier Badminton League 2026" },
  })

  if (!tournament) {
    throw new Error("Tournament 'Premier Badminton League 2026' not found. Run seed-tournament.ts first.")
  }

  console.log(`Tournament: ${tournament.name} (${tournament.id})`)
  console.log(`Scoring: best of ${tournament.defaultSetsCount}, ${tournament.defaultPointsToWin} pts, deuce cap ${tournament.defaultDeuceCap}\n`)

  // Fetch all group-stage team matches with their fixtures and team players
  const teamMatches = await prisma.teamMatch.findMany({
    where: {
      tournamentId: tournament.id,
      groupId: { not: null },
    },
    include: {
      teamA: {
        include: {
          players: { include: { player: true } },
        },
      },
      teamB: {
        include: {
          players: { include: { player: true } },
        },
      },
      fixtures: {
        orderBy: { fixtureNumber: "asc" },
      },
      group: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  console.log(`Found ${teamMatches.length} group-stage matches to simulate.\n`)

  let matchNum = 0

  for (const tm of teamMatches) {
    matchNum++
    const pointsToWin = tm.pointsToWin
    const deuceCap = tm.deuceCap
    const setsCount = tm.setsCount

    const teamAPlayers: PlayerInfo[] = tm.teamA.players.map((tp) => ({
      id: tp.player.id,
      name: tp.player.name,
      category: tp.category,
    }))
    const teamBPlayers: PlayerInfo[] = tm.teamB.players.map((tp) => ({
      id: tp.player.id,
      name: tp.player.name,
      category: tp.category,
    }))

    let fixturesWonA = 0
    let fixturesWonB = 0
    let totalPointsA = 0
    let totalPointsB = 0

    for (const fixture of tm.fixtures) {
      const players = pickPlayers(fixture.fixtureType, teamAPlayers, teamBPlayers)
      const result = simulateMatch(setsCount, pointsToWin, deuceCap)

      // Create the Match and its sets in a transaction
      await prisma.$transaction(async (tx) => {
        const match = await tx.match.create({
          data: {
            name: `${tm.name} - ${fixture.fixtureType.replace(/_/g, " ")} #${fixture.fixtureNumber}`,
            type: players.type,
            status: "COMPLETED",
            setsCount,
            pointsToWin,
            deuceCap,
            sideAPlayer1: players.sideAPlayer1,
            sideAPlayer2: players.sideAPlayer2,
            sideBPlayer1: players.sideBPlayer1,
            sideBPlayer2: players.sideBPlayer2,
            currentSetNumber: result.sets.length,
            setsWonBySideA: result.setsWonBySideA,
            setsWonBySideB: result.setsWonBySideB,
            winningSide: result.winningSide,
            tournamentId: tournament.id,
            startedAt: new Date(),
            completedAt: new Date(),
            sets: {
              create: result.sets.map((s) => ({
                setNumber: s.setNumber,
                scoreA: s.scoreA,
                scoreB: s.scoreB,
                winningSide: s.winningSide,
                completedAt: new Date(),
              })),
            },
          },
        })

        // Link fixture to match
        await tx.fixture.update({
          where: { id: fixture.id },
          data: { matchId: match.id },
        })
      })

      if (result.winningSide === "A") fixturesWonA++
      else fixturesWonB++

      for (const s of result.sets) {
        totalPointsA += s.scoreA
        totalPointsB += s.scoreB
      }
    }

    // Determine team match winner
    let winningTeamId: string | null = null
    if (fixturesWonA > fixturesWonB) {
      winningTeamId = tm.teamAId
    } else if (fixturesWonB > fixturesWonA) {
      winningTeamId = tm.teamBId
    } else {
      // Tied on fixtures, use point differential
      if (totalPointsA > totalPointsB) winningTeamId = tm.teamAId
      else if (totalPointsB > totalPointsA) winningTeamId = tm.teamBId
    }

    // Update team match result
    await prisma.teamMatch.update({
      where: { id: tm.id },
      data: {
        fixturesWonByTeamA: fixturesWonA,
        fixturesWonByTeamB: fixturesWonB,
        totalPointsTeamA: totalPointsA,
        totalPointsTeamB: totalPointsB,
        winningTeamId,
        status: "COMPLETED",
      },
    })

    const winnerName = winningTeamId === tm.teamAId ? tm.teamA.name : winningTeamId === tm.teamBId ? tm.teamB.name : "DRAW"
    process.stdout.write(`  [${matchNum.toString().padStart(2)}/${teamMatches.length}] ${tm.group?.name}: ${tm.teamA.name} vs ${tm.teamB.name}  →  ${fixturesWonA}-${fixturesWonB} (${winnerName})\n`)
  }

  // ── Compute Group Standings ──

  console.log("\n═══════════════════════════════════════════════════════")
  console.log("  GROUP STANDINGS")
  console.log("═══════════════════════════════════════════════════════\n")

  const groups = await prisma.tournamentGroup.findMany({
    where: { tournamentId: tournament.id },
    include: {
      groupTeams: { include: { team: true }, orderBy: { seedOrder: "asc" } },
      teamMatches: {
        where: { status: "COMPLETED" },
        select: {
          teamAId: true,
          teamBId: true,
          fixturesWonByTeamA: true,
          fixturesWonByTeamB: true,
          totalPointsTeamA: true,
          totalPointsTeamB: true,
          winningTeamId: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  const allGroupStandings: { teamId: string; teamName: string; groupIndex: number; position: number }[][] = []

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    const stats: Record<string, {
      teamId: string; teamName: string; played: number; won: number; lost: number; drawn: number;
      fixturesWon: number; fixturesLost: number; pointsFor: number; pointsAgainst: number;
    }> = {}

    for (const gt of group.groupTeams) {
      stats[gt.teamId] = {
        teamId: gt.teamId, teamName: gt.team.name, played: 0, won: 0, lost: 0, drawn: 0,
        fixturesWon: 0, fixturesLost: 0, pointsFor: 0, pointsAgainst: 0,
      }
    }

    for (const tm of group.teamMatches) {
      const a = stats[tm.teamAId]
      const b = stats[tm.teamBId]
      if (!a || !b) continue
      a.played++; b.played++
      a.fixturesWon += tm.fixturesWonByTeamA; a.fixturesLost += tm.fixturesWonByTeamB
      b.fixturesWon += tm.fixturesWonByTeamB; b.fixturesLost += tm.fixturesWonByTeamA
      a.pointsFor += tm.totalPointsTeamA; a.pointsAgainst += tm.totalPointsTeamB
      b.pointsFor += tm.totalPointsTeamB; b.pointsAgainst += tm.totalPointsTeamA
      if (tm.winningTeamId === tm.teamAId) { a.won++; b.lost++ }
      else if (tm.winningTeamId === tm.teamBId) { b.won++; a.lost++ }
      else { a.drawn++; b.drawn++ }
    }

    const sorted = Object.values(stats).sort((a, b) => {
      const ptsA = a.won * 2 + a.drawn; const ptsB = b.won * 2 + b.drawn
      if (ptsB !== ptsA) return ptsB - ptsA
      const diffA = a.pointsFor - a.pointsAgainst; const diffB = b.pointsFor - b.pointsAgainst
      if (diffB !== diffA) return diffB - diffA
      return b.pointsFor - a.pointsFor
    })

    console.log(`  ${group.name}`)
    console.log(`  ${"#".padEnd(3)} ${"Team".padEnd(22)} ${"P".padStart(3)} ${"W".padStart(3)} ${"L".padStart(3)} ${"D".padStart(3)} ${"FW".padStart(4)} ${"FL".padStart(4)} ${"PF".padStart(6)} ${"PA".padStart(6)} ${"Pts".padStart(4)}`)
    console.log(`  ${"─".repeat(65)}`)

    const groupStandings: { teamId: string; teamName: string; groupIndex: number; position: number }[] = []

    sorted.forEach((s, i) => {
      const pts = s.won * 2 + s.drawn
      const qualify = i < (tournament.qualifyPerGroup ?? 4) ? " ✅" : ""
      console.log(`  ${(i + 1).toString().padEnd(3)} ${s.teamName.padEnd(22)} ${s.played.toString().padStart(3)} ${s.won.toString().padStart(3)} ${s.lost.toString().padStart(3)} ${s.drawn.toString().padStart(3)} ${s.fixturesWon.toString().padStart(4)} ${s.fixturesLost.toString().padStart(4)} ${s.pointsFor.toString().padStart(6)} ${s.pointsAgainst.toString().padStart(6)} ${pts.toString().padStart(4)}${qualify}`)
      groupStandings.push({ teamId: s.teamId, teamName: s.teamName, groupIndex: gi, position: i + 1 })
    })

    allGroupStandings.push(groupStandings)
    console.log()
  }

  // ── Show knockout qualifiers ──

  const qualifyPerGroup = tournament.qualifyPerGroup ?? 4

  console.log("═══════════════════════════════════════════════════════")
  console.log("  KNOCKOUT QUALIFIERS (Top " + qualifyPerGroup + " per group)")
  console.log("═══════════════════════════════════════════════════════\n")

  for (let gi = 0; gi < allGroupStandings.length; gi++) {
    const groupName = groups[gi].name
    const qualifiers = allGroupStandings[gi].filter((s) => s.position <= qualifyPerGroup)
    console.log(`  ${groupName}:`)
    for (const q of qualifiers) {
      console.log(`    #${q.position} ${q.teamName}`)
    }
    console.log()
  }

  // ── Generate knockout bracket and seed teams ──

  console.log("═══════════════════════════════════════════════════════")
  console.log("  KNOCKOUT BRACKET SEEDING")
  console.log("═══════════════════════════════════════════════════════\n")

  // Use crossGroupSeeding logic directly
  const qualifiers: { teamId: string; teamName: string; groupIndex: number; position: number }[] = []
  for (let pos = 1; pos <= qualifyPerGroup; pos++) {
    for (const group of allGroupStandings) {
      const team = group.find((s) => s.position === pos)
      if (team) qualifiers.push(team)
    }
  }

  const totalKnockoutTeams = qualifiers.length

  // bracketSize helper
  let bSize = 2
  while (bSize < totalKnockoutTeams) bSize *= 2

  // Top half vs bottom half, bottom reversed
  const topHalf = qualifiers.slice(0, qualifiers.length / 2)
  const bottomHalf = [...qualifiers.slice(qualifiers.length / 2)].reverse()

  console.log(`  ${totalKnockoutTeams} teams → ${bSize / 2} first-round matches (bracket size ${bSize})\n`)

  for (let i = 0; i < topHalf.length; i++) {
    const top = topHalf[i]
    const bottom = bottomHalf[i]
    const gA = groups[top.groupIndex].name
    const gB = bottom ? groups[bottom.groupIndex].name : "BYE"
    console.log(`  QF-${i + 1}:  ${top.teamName.padEnd(22)} (${gA} #${top.position})  vs  ${bottom ? bottom.teamName.padEnd(22) : "BYE".padEnd(22)} (${gB}${bottom ? ` #${bottom.position}` : ""})`)
  }

  console.log("\n✅ Simulation complete! Open the tournament in the browser to see results.")
}

main()
  .catch((e) => {
    console.error("Simulation error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
