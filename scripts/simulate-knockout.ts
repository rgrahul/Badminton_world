/**
 * Simulate all knockout matches for a tournament.
 * Picks random winners for each fixture, completes team matches,
 * and advances winners through the bracket until a champion is crowned.
 *
 * Run with: npx tsx scripts/simulate-knockout.ts [tournamentId]
 *
 * If no tournamentId is provided, picks the first tournament that has
 * knockout matches.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ROUND_ORDER = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
] as const

async function main() {
  const tournamentId = process.argv[2]

  // Find the tournament
  let tournament
  if (tournamentId) {
    tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    })
    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`)
      process.exit(1)
    }
  } else {
    // Find a tournament with knockout matches
    const km = await prisma.knockoutMatch.findFirst({
      orderBy: { createdAt: "desc" },
      select: { tournamentId: true },
    })
    if (!km) {
      console.error("No knockout matches found in any tournament")
      process.exit(1)
    }
    tournament = await prisma.tournament.findUnique({
      where: { id: km.tournamentId },
    })
  }

  if (!tournament) {
    console.error("Tournament not found")
    process.exit(1)
  }

  console.log(`\n🏸 Simulating knockout for: ${tournament.name}\n`)

  // Process rounds in order
  for (const round of ROUND_ORDER) {
    const matches = await prisma.knockoutMatch.findMany({
      where: {
        tournamentId: tournament.id,
        round,
      },
      include: {
        teamA: {
          include: {
            players: {
              include: { player: true },
            },
          },
        },
        teamB: {
          include: {
            players: {
              include: { player: true },
            },
          },
        },
        teamMatch: {
          include: {
            fixtures: {
              include: { match: true },
            },
          },
        },
      },
      orderBy: { matchNumber: "asc" },
    })

    if (matches.length === 0) continue

    const roundLabel = formatRound(round)
    console.log(`\n━━━ ${roundLabel} (${matches.length} match${matches.length > 1 ? "es" : ""}) ━━━`)

    for (const km of matches) {
      // Skip if already completed
      if (km.winnerTeamId) {
        console.log(`  ✓ M${km.matchNumber}: already completed`)
        continue
      }

      // Skip if teams not yet known (shouldn't happen if we process in order)
      if (!km.teamAId || !km.teamBId || !km.teamA || !km.teamB) {
        console.log(`  ⏳ M${km.matchNumber}: waiting for teams`)
        continue
      }

      // 1. Create TeamMatch if not exists
      let teamMatch = km.teamMatch
      if (!teamMatch) {
        teamMatch = await createTeamMatchForKnockout(km, tournament)
        if (!teamMatch) {
          console.error(`  ✗ M${km.matchNumber}: failed to create team match`)
          continue
        }
      }

      // Reload teamMatch with fixtures
      const fullTeamMatch = await prisma.teamMatch.findUnique({
        where: { id: teamMatch.id },
        include: {
          fixtures: { include: { match: true }, orderBy: { fixtureNumber: "asc" } },
        },
      })
      if (!fullTeamMatch) continue

      // 2. Process each fixture
      let fixturesWonA = 0
      let fixturesWonB = 0
      let totalPtsA = 0
      let totalPtsB = 0

      for (const fixture of fullTeamMatch.fixtures) {
        const isDoubles = ["MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "KIDS_DOUBLES"].includes(fixture.fixtureType)
        const setsCount = fullTeamMatch.setsCount
        const pointsToWin = fullTeamMatch.pointsToWin

        // Pick a random winner for this fixture
        const winner: "A" | "B" = Math.random() < 0.5 ? "A" : "B"
        const setsToWin = Math.ceil(setsCount / 2)

        // Assign players if not already assigned
        if (!fixture.teamAPlayer1Id) {
          await assignPlayers(fixture.id, fixture.fixtureType, km.teamA!, km.teamB!)
        }

        // Reload fixture to get player ids
        const updatedFixture = await prisma.fixture.findUnique({
          where: { id: fixture.id },
        })
        if (!updatedFixture || !updatedFixture.teamAPlayer1Id) continue

        // Create or use existing match
        let matchId = fixture.matchId
        if (!matchId) {
          const matchType = isDoubles ? "DOUBLES" : "SINGLES"
          const match = await prisma.$transaction(async (tx) => {
            const m = await tx.match.create({
              data: {
                name: `${formatFixtureType(fixture.fixtureType)} #${fixture.fixtureNumber}`,
                type: matchType,
                status: "COMPLETED",
                setsCount: fullTeamMatch.setsCount,
                pointsToWin: fullTeamMatch.pointsToWin,
                deuceCap: fullTeamMatch.deuceCap,
                sideAPlayer1: updatedFixture.teamAPlayer1Id!,
                sideAPlayer2: updatedFixture.teamAPlayer2Id,
                sideBPlayer1: updatedFixture.teamBPlayer1Id!,
                sideBPlayer2: updatedFixture.teamBPlayer2Id,
                tournamentId: tournament!.id,
                winningSide: winner,
                setsWonBySideA: winner === "A" ? setsToWin : Math.max(0, setsToWin - 1 - Math.floor(Math.random() * setsToWin)),
                setsWonBySideB: winner === "B" ? setsToWin : Math.max(0, setsToWin - 1 - Math.floor(Math.random() * setsToWin)),
                currentSetNumber: setsCount,
                startedAt: new Date(),
                completedAt: new Date(),
              },
            })

            // Create sets
            const totalSets = winner === "A"
              ? m.setsWonBySideA + m.setsWonBySideB
              : m.setsWonBySideA + m.setsWonBySideB
            let setsWonA = 0
            let setsWonB = 0

            for (let s = 1; s <= totalSets; s++) {
              let setWinner: "A" | "B"
              if (setsWonA === setsToWin) {
                setWinner = "B"
              } else if (setsWonB === setsToWin) {
                setWinner = "A"
              } else if (s === totalSets) {
                setWinner = winner // last set goes to match winner
              } else {
                setWinner = Math.random() < 0.5 ? "A" : "B"
              }

              const loserScore = Math.floor(Math.random() * (pointsToWin - 5)) + 3
              const scoreA = setWinner === "A" ? pointsToWin : loserScore
              const scoreB = setWinner === "B" ? pointsToWin : loserScore

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

            // Update match with correct set counts
            await tx.match.update({
              where: { id: m.id },
              data: {
                setsWonBySideA: setsWonA,
                setsWonBySideB: setsWonB,
                currentSetNumber: totalSets,
              },
            })

            // Link fixture to match
            await tx.fixture.update({
              where: { id: fixture.id },
              data: { matchId: m.id },
            })

            return m
          })
          matchId = match.id
        } else if (fixture.match?.status === "COMPLETED") {
          // Already scored
          if (fixture.match.winningSide === "A") fixturesWonA++
          else if (fixture.match.winningSide === "B") fixturesWonB++
          continue
        }

        if (winner === "A") fixturesWonA++
        else fixturesWonB++
      }

      // 3. Determine team match winner
      let winningTeamId: string | null = null
      if (fixturesWonA > fixturesWonB) {
        winningTeamId = km.teamAId
      } else if (fixturesWonB > fixturesWonA) {
        winningTeamId = km.teamBId
      } else {
        // Tiebreak by total points
        if (totalPtsA > totalPtsB) winningTeamId = km.teamAId
        else if (totalPtsB > totalPtsA) winningTeamId = km.teamBId
        else winningTeamId = km.teamAId // Force a winner
      }

      // 4. Update TeamMatch as completed
      await prisma.teamMatch.update({
        where: { id: fullTeamMatch.id },
        data: {
          status: "COMPLETED",
          fixturesWonByTeamA: fixturesWonA,
          fixturesWonByTeamB: fixturesWonB,
          totalPointsTeamA: totalPtsA,
          totalPointsTeamB: totalPtsB,
          winningTeamId,
        },
      })

      // 5. Advance winner in knockout bracket
      await prisma.knockoutMatch.update({
        where: { id: km.id },
        data: { winnerTeamId: winningTeamId },
      })

      // Fill next-round slots
      const nextMatches = await prisma.knockoutMatch.findMany({
        where: {
          tournamentId: tournament!.id,
          OR: [
            { teamASourceMatchId: km.id },
            { teamBSourceMatchId: km.id },
          ],
        },
      })

      for (const nextMatch of nextMatches) {
        const updateData: Record<string, string> = {}
        if (nextMatch.teamASourceMatchId === km.id) updateData.teamAId = winningTeamId!
        if (nextMatch.teamBSourceMatchId === km.id) updateData.teamBId = winningTeamId!

        await prisma.knockoutMatch.update({
          where: { id: nextMatch.id },
          data: updateData,
        })
      }

      const winnerName = winningTeamId === km.teamAId ? km.teamA!.name : km.teamB!.name
      console.log(
        `  M${km.matchNumber}: ${km.teamA!.name} vs ${km.teamB!.name}  →  ${fixturesWonA}-${fixturesWonB}  🏆 ${winnerName}`
      )
    }
  }

  // Print final result
  const finalMatch = await prisma.knockoutMatch.findFirst({
    where: { tournamentId: tournament.id, round: "FINAL" },
    include: { winnerTeam: true },
  })

  if (finalMatch?.winnerTeam) {
    console.log(`\n${"═".repeat(50)}`)
    console.log(`  🏆 CHAMPION: ${finalMatch.winnerTeam.name}`)
    console.log(`${"═".repeat(50)}\n`)
  } else {
    // Try the last round that exists
    const lastKm = await prisma.knockoutMatch.findFirst({
      where: { tournamentId: tournament.id, winnerTeamId: { not: null } },
      orderBy: [{ round: "desc" }, { matchNumber: "desc" }],
      include: { winnerTeam: true },
    })
    if (lastKm?.winnerTeam) {
      console.log(`\n${"═".repeat(50)}`)
      console.log(`  🏆 CHAMPION: ${lastKm.winnerTeam.name}`)
      console.log(`${"═".repeat(50)}\n`)
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createTeamMatchForKnockout(
  km: { id: string; teamAId: string | null; teamBId: string | null; matchNumber: number; round: string; teamA: { name: string } | null; teamB: { name: string } | null },
  tournament: { id: string; defaultMenDoubles: number | null; defaultWomenDoubles: number | null; defaultMixedDoubles: number | null; defaultMenSingles: number | null; defaultWomenSingles: number | null; defaultKidsSingles: number | null; defaultKidsDoubles: number | null; defaultSetsCount: number | null; defaultPointsToWin: number | null; defaultDeuceCap: number | null }
) {
  if (!km.teamAId || !km.teamBId) return null

  const roundLabel = formatRound(km.round)
  const name = `${roundLabel} M${km.matchNumber}: ${km.teamA?.name} vs ${km.teamB?.name}`

  return prisma.$transaction(async (tx) => {
    const teamMatch = await tx.teamMatch.create({
      data: {
        name,
        tournamentId: tournament.id,
        teamAId: km.teamAId!,
        teamBId: km.teamBId!,
        category: "ADULT",
        menDoublesCount: tournament.defaultMenDoubles ?? 0,
        womenDoublesCount: tournament.defaultWomenDoubles ?? 0,
        mixedDoublesCount: tournament.defaultMixedDoubles ?? 0,
        menSinglesCount: tournament.defaultMenSingles ?? 0,
        womenSinglesCount: tournament.defaultWomenSingles ?? 0,
        kidsSinglesCount: tournament.defaultKidsSingles ?? 0,
        kidsDoublesCount: tournament.defaultKidsDoubles ?? 0,
        setsCount: tournament.defaultSetsCount ?? 3,
        pointsToWin: tournament.defaultPointsToWin ?? 21,
        deuceCap: tournament.defaultDeuceCap ?? 30,
      },
    })

    // Auto-generate fixtures
    const FORMAT_MAP: Record<string, string> = {
      menDoublesCount: "MEN_DOUBLES",
      womenDoublesCount: "WOMEN_DOUBLES",
      mixedDoublesCount: "MIXED_DOUBLES",
      menSinglesCount: "MEN_SINGLES",
      womenSinglesCount: "WOMEN_SINGLES",
      kidsSinglesCount: "KIDS_SINGLES",
      kidsDoublesCount: "KIDS_DOUBLES",
    }

    const countMap: Record<string, number> = {
      menDoublesCount: tournament.defaultMenDoubles ?? 0,
      womenDoublesCount: tournament.defaultWomenDoubles ?? 0,
      mixedDoublesCount: tournament.defaultMixedDoubles ?? 0,
      menSinglesCount: tournament.defaultMenSingles ?? 0,
      womenSinglesCount: tournament.defaultWomenSingles ?? 0,
      kidsSinglesCount: tournament.defaultKidsSingles ?? 0,
      kidsDoublesCount: tournament.defaultKidsDoubles ?? 0,
    }

    let fixtureNumber = 1
    const fixtureCreates: { teamMatchId: string; fixtureNumber: number; fixtureType: any }[] = []

    for (const [field, fixtureType] of Object.entries(FORMAT_MAP)) {
      const count = countMap[field] ?? 0
      for (let i = 0; i < count; i++) {
        fixtureCreates.push({
          teamMatchId: teamMatch.id,
          fixtureNumber: fixtureNumber++,
          fixtureType,
        })
      }
    }

    if (fixtureCreates.length > 0) {
      await tx.fixture.createMany({ data: fixtureCreates })
    }

    // Link knockout match to team match
    await tx.knockoutMatch.update({
      where: { id: km.id },
      data: { teamMatchId: teamMatch.id },
    })

    return teamMatch
  })
}

async function assignPlayers(
  fixtureId: string,
  fixtureType: string,
  teamA: { players: { player: { id: string; gender: string } }[] },
  teamB: { players: { player: { id: string; gender: string } }[] },
) {
  const isDoubles = ["MEN_DOUBLES", "WOMEN_DOUBLES", "MIXED_DOUBLES", "KIDS_DOUBLES"].includes(fixtureType)

  // Pick players based on fixture type
  const getPlayers = (team: typeof teamA, type: string) => {
    const players = team.players.map((tp) => tp.player)
    if (type === "MEN_DOUBLES" || type === "MEN_SINGLES") {
      return players.filter((p) => p.gender === "MALE")
    }
    if (type === "WOMEN_DOUBLES" || type === "WOMEN_SINGLES") {
      return players.filter((p) => p.gender === "FEMALE")
    }
    if (type === "MIXED_DOUBLES") {
      return players // use any
    }
    return players
  }

  const teamAPlayers = getPlayers(teamA, fixtureType)
  const teamBPlayers = getPlayers(teamB, fixtureType)

  // Fallback to any players if gender filter yields nothing
  const aPlayers = teamAPlayers.length > 0 ? teamAPlayers : teamA.players.map((tp) => tp.player)
  const bPlayers = teamBPlayers.length > 0 ? teamBPlayers : teamB.players.map((tp) => tp.player)

  if (aPlayers.length === 0 || bPlayers.length === 0) return

  const data: Record<string, string | null> = {
    teamAPlayer1Id: aPlayers[0].id,
    teamAPlayer2Id: isDoubles && aPlayers.length > 1 ? aPlayers[1].id : null,
    teamBPlayer1Id: bPlayers[0].id,
    teamBPlayer2Id: isDoubles && bPlayers.length > 1 ? bPlayers[1].id : null,
  }

  await prisma.fixture.update({
    where: { id: fixtureId },
    data,
  })
}

function formatRound(round: string): string {
  switch (round) {
    case "ROUND_OF_32": return "Round of 32"
    case "ROUND_OF_16": return "Round of 16"
    case "QUARTER_FINAL": return "Quarter Final"
    case "SEMI_FINAL": return "Semi Final"
    case "FINAL": return "Final"
    default: return round
  }
}

function formatFixtureType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
