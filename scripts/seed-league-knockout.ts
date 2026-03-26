/**
 * Seed script: Creates a LEAGUE_KNOCKOUT tournament with 16 teams (4 groups of 4),
 * top 2 per group qualify to knockout (8 teams -> QF -> SF -> Final).
 * Same config: 3M+1F per team, 1 men doubles + 1 men singles + 1 women singles,
 * 1 set, 5 points to win.
 *
 * Reuses existing players if available, otherwise creates new ones.
 *
 * Run with: npx tsx scripts/seed-league-knockout.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const TOURNAMENT_NAME = "League & Knockout Championship 2026"

const TEAM_NAMES = [
  "Titans",
  "Warriors",
  "Falcons",
  "Dragons",
  "Sharks",
  "Phoenix",
  "Wolves",
  "Eagles",
  "Panthers",
  "Stallions",
  "Ravens",
  "Cobras",
  "Vipers",
  "Hawks",
  "Lions",
  "Bulls",
]

const GROUP_NAMES = ["Group A", "Group B", "Group C", "Group D"]
const TEAMS_PER_GROUP = 4
const QUALIFY_PER_GROUP = 2
const NUM_GROUPS = 4

const TOURNAMENT_DEFAULTS = {
  defaultMenDoubles: 1,
  defaultWomenDoubles: 0,
  defaultMixedDoubles: 0,
  defaultMenSingles: 1,
  defaultWomenSingles: 1,
  defaultKidsSingles: 0,
  defaultKidsDoubles: 0,
  defaultSetsCount: 1,
  defaultPointsToWin: 5,
  defaultDeuceCap: 10,
}

// Round-robin helper
function generateRoundRobinPairings(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  return pairs
}

// Fixture type mapping
const FORMAT_TO_FIXTURE_TYPE: Record<string, string> = {
  menDoubles: "MEN_DOUBLES",
  menSingles: "MEN_SINGLES",
  womenSingles: "WOMEN_SINGLES",
}

async function main() {
  console.log(`=== Seeding ${TOURNAMENT_NAME} ===\n`)

  // ── Step 1: Get or create players ────────────────────────────────────

  console.log("Step 1: Getting or creating 64 players...")

  // Check for existing players from the knockout seed
  let malePlayers = await prisma.player.findMany({
    where: { name: { startsWith: "Player M" }, gender: "MALE" },
    orderBy: { name: "asc" },
    take: 48,
  })

  let femalePlayers = await prisma.player.findMany({
    where: { name: { startsWith: "Player F" }, gender: "FEMALE" },
    orderBy: { name: "asc" },
    take: 16,
  })

  if (malePlayers.length < 48) {
    console.log("  Creating new male players...")
    const offset = malePlayers.length
    for (let i = offset + 1; i <= 48; i++) {
      const p = await prisma.player.create({
        data: { name: `Player M${i}`, gender: "MALE", age: 25 },
      })
      malePlayers.push(p)
    }
  }

  if (femalePlayers.length < 16) {
    console.log("  Creating new female players...")
    const offset = femalePlayers.length
    for (let i = offset + 1; i <= 16; i++) {
      const p = await prisma.player.create({
        data: { name: `Player F${i}`, gender: "FEMALE", age: 23 },
      })
      femalePlayers.push(p)
    }
  }

  // Sort by name properly for consistent assignment
  malePlayers.sort((a, b) => {
    const numA = parseInt(a.name.replace("Player M", ""))
    const numB = parseInt(b.name.replace("Player M", ""))
    return numA - numB
  })
  femalePlayers.sort((a, b) => {
    const numA = parseInt(a.name.replace("Player F", ""))
    const numB = parseInt(b.name.replace("Player F", ""))
    return numA - numB
  })

  console.log(`  Using ${malePlayers.length} male + ${femalePlayers.length} female players`)

  // ── Step 2: Create Tournament ────────────────────────────────────────

  console.log("\nStep 2: Creating tournament...")

  const tournament = await prisma.tournament.create({
    data: {
      name: TOURNAMENT_NAME,
      description: "16 teams in 4 groups, top 2 per group advance to knockout bracket",
      dateFrom: new Date("2026-03-01"),
      dateTo: new Date("2026-03-20"),
      organizerName: "Tournament Admin",
      organizerEmail: "admin@league2026.com",
      venue: "National Badminton Center",
      city: "New Delhi",
      category: "Open",
      requiresTeams: true,
      format: "LEAGUE_KNOCKOUT",
      status: "UPCOMING",
      numberOfGroups: NUM_GROUPS,
      qualifyPerGroup: QUALIFY_PER_GROUP,
      ...TOURNAMENT_DEFAULTS,
    },
  })

  console.log(`  Tournament "${tournament.name}" created (id: ${tournament.id})`)
  console.log(`  Format: LEAGUE_KNOCKOUT (${NUM_GROUPS} groups, top ${QUALIFY_PER_GROUP} qualify)`)

  // ── Step 3: Create 16 Teams ──────────────────────────────────────────

  console.log("\nStep 3: Creating 16 teams with player assignments...")

  const teams: { id: string; name: string }[] = []
  for (let t = 0; t < TEAM_NAMES.length; t++) {
    const teamName = TEAM_NAMES[t]

    const team = await prisma.team.create({
      data: {
        name: teamName,
        tournamentId: tournament.id,
        teamSize: 4,
        requiredMale: 3,
        requiredFemale: 1,
        requiredKid: 0,
      },
    })

    // Assign 3 male players
    const maleStart = t * 3
    for (let m = 0; m < 3; m++) {
      await prisma.teamPlayer.create({
        data: {
          teamId: team.id,
          playerId: malePlayers[maleStart + m].id,
          category: "MALE",
        },
      })
    }

    // Assign 1 female player
    await prisma.teamPlayer.create({
      data: {
        teamId: team.id,
        playerId: femalePlayers[t].id,
        category: "FEMALE",
      },
    })

    teams.push({ id: team.id, name: team.name })
    console.log(
      `  ${teamName}: Males [M${maleStart + 1}, M${maleStart + 2}, M${maleStart + 3}], Female [F${t + 1}]`
    )
  }

  // ── Step 4: Create Groups & Assign Teams ─────────────────────────────

  console.log("\nStep 4: Creating 4 groups and assigning teams...")

  const groups: { id: string; name: string; teamIds: string[] }[] = []

  for (let g = 0; g < NUM_GROUPS; g++) {
    const group = await prisma.tournamentGroup.create({
      data: {
        tournamentId: tournament.id,
        name: GROUP_NAMES[g],
        sortOrder: g,
      },
    })

    const groupTeamIds: string[] = []
    for (let t = 0; t < TEAMS_PER_GROUP; t++) {
      const teamIndex = g * TEAMS_PER_GROUP + t
      const team = teams[teamIndex]

      await prisma.groupTeam.create({
        data: {
          groupId: group.id,
          teamId: team.id,
          seedOrder: t + 1,
        },
      })

      groupTeamIds.push(team.id)
    }

    groups.push({ id: group.id, name: group.name, teamIds: groupTeamIds })

    const teamNames = groupTeamIds.map((id) => teams.find((t) => t.id === id)!.name)
    console.log(`  ${GROUP_NAMES[g]}: ${teamNames.join(", ")}`)
  }

  // ── Step 5: Generate Round-Robin League Matches ──────────────────────

  console.log("\nStep 5: Generating round-robin league matches...")

  let totalLeagueMatches = 0
  const teamNameMap: Record<string, string> = {}
  for (const t of teams) teamNameMap[t.id] = t.name

  for (const group of groups) {
    const pairings = generateRoundRobinPairings(group.teamIds)

    for (const [teamAId, teamBId] of pairings) {
      const matchName = `${group.name}: ${teamNameMap[teamAId]} vs ${teamNameMap[teamBId]}`

      const teamMatch = await prisma.teamMatch.create({
        data: {
          name: matchName,
          tournamentId: tournament.id,
          teamAId,
          teamBId,
          category: "ADULT",
          groupId: group.id,
          menDoublesCount: TOURNAMENT_DEFAULTS.defaultMenDoubles,
          womenDoublesCount: 0,
          mixedDoublesCount: 0,
          menSinglesCount: TOURNAMENT_DEFAULTS.defaultMenSingles,
          womenSinglesCount: TOURNAMENT_DEFAULTS.defaultWomenSingles,
          kidsSinglesCount: 0,
          kidsDoublesCount: 0,
          setsCount: TOURNAMENT_DEFAULTS.defaultSetsCount,
          pointsToWin: TOURNAMENT_DEFAULTS.defaultPointsToWin,
          deuceCap: TOURNAMENT_DEFAULTS.defaultDeuceCap,
        },
      })

      // Create fixtures
      let fixtureNumber = 1
      const fixtureData: { teamMatchId: string; fixtureNumber: number; fixtureType: any }[] = []

      for (const [field, fixtureType] of Object.entries(FORMAT_TO_FIXTURE_TYPE)) {
        const countMap: Record<string, number> = {
          menDoubles: TOURNAMENT_DEFAULTS.defaultMenDoubles,
          menSingles: TOURNAMENT_DEFAULTS.defaultMenSingles,
          womenSingles: TOURNAMENT_DEFAULTS.defaultWomenSingles,
        }
        const count = countMap[field] ?? 0
        for (let i = 0; i < count; i++) {
          fixtureData.push({
            teamMatchId: teamMatch.id,
            fixtureNumber: fixtureNumber++,
            fixtureType,
          })
        }
      }

      if (fixtureData.length > 0) {
        await prisma.fixture.createMany({ data: fixtureData })
      }

      totalLeagueMatches++
    }

    const pairCount = pairings.length
    console.log(`  ${group.name}: ${pairCount} matches (${TEAMS_PER_GROUP} teams, round-robin)`)
  }

  console.log(`  Total league matches created: ${totalLeagueMatches}`)

  // ── Summary ──────────────────────────────────────────────────────────

  console.log("\n=== Seed Complete ===")
  console.log(`Tournament:       ${tournament.name} (${tournament.id})`)
  console.log(`Format:           LEAGUE_KNOCKOUT`)
  console.log(`Teams:            ${teams.length}`)
  console.log(`Groups:           ${NUM_GROUPS} (${TEAMS_PER_GROUP} teams each)`)
  console.log(`Qualify/Group:    ${QUALIFY_PER_GROUP} (total ${NUM_GROUPS * QUALIFY_PER_GROUP} qualifiers)`)
  console.log(`League Matches:   ${totalLeagueMatches} (${totalLeagueMatches * 3} fixtures)`)
  console.log(`Match Format:     1 Men Doubles + 1 Men Singles + 1 Women Singles`)
  console.log(`Scoring:          1 set, 5 pts to win, deuce cap 10`)
  console.log(`\nKnockout bracket will be generated after all league matches are completed.`)
  console.log(`Use the "Generate Bracket" button on the tournament page.`)

  console.log("\nGroup breakdown:")
  for (const group of groups) {
    const teamNames = group.teamIds.map((id) => teamNameMap[id])
    console.log(`  ${group.name}: ${teamNames.join(", ")}`)
  }

  console.log("\nDone!")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
