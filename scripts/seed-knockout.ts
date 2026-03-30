/**
 * Seed script: Creates a KNOCKOUT_ONLY tournament with 16 teams, 64 players,
 * generates the knockout bracket, and auto-creates TeamMatch + Fixture records
 * for first-round matches.
 *
 * Run with: npx tsx scripts/seed-knockout.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── Constants ───────────────────────────────────────────────────────────────

const TOURNAMENT_NAME = "Knockout Championship 2026"

const TEAM_NAMES = [
  "Team Alpha",
  "Team Bravo",
  "Team Charlie",
  "Team Delta",
  "Team Echo",
  "Team Foxtrot",
  "Team Golf",
  "Team Hotel",
  "Team India",
  "Team Juliet",
  "Team Kilo",
  "Team Lima",
  "Team Mike",
  "Team November",
  "Team Oscar",
  "Team Papa",
] as const

const MALE_COUNT = 48
const FEMALE_COUNT = 16
const MALES_PER_TEAM = 3
const FEMALES_PER_TEAM = 1

// Tournament default match config
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

// Bracket generation types and helpers (inlined from src/lib/tournament/bracket.ts)
type KnockoutRoundType =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL"

interface BracketSlot {
  round: KnockoutRoundType
  matchNumber: number
  teamASourceMatchNumber?: number
  teamBSourceMatchNumber?: number
  teamASourceLabel?: string
  teamBSourceLabel?: string
}

const ROUND_ORDER: KnockoutRoundType[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
]

function bracketSize(teamCount: number): number {
  let size = 2
  while (size < teamCount) size *= 2
  return size
}

function getRounds(teamCount: number): KnockoutRoundType[] {
  const size = bracketSize(teamCount)
  const roundMap: Record<number, KnockoutRoundType> = {
    2: "FINAL",
    4: "SEMI_FINAL",
    8: "QUARTER_FINAL",
    16: "ROUND_OF_16",
    32: "ROUND_OF_32",
  }
  const firstRound = roundMap[size]
  if (!firstRound) return ["FINAL"]
  const startIdx = ROUND_ORDER.indexOf(firstRound)
  return ROUND_ORDER.slice(startIdx)
}

function formatRoundShort(round: KnockoutRoundType): string {
  switch (round) {
    case "ROUND_OF_32": return "R32"
    case "ROUND_OF_16": return "R16"
    case "QUARTER_FINAL": return "QF"
    case "SEMI_FINAL": return "SF"
    case "FINAL": return "F"
  }
}

function formatRoundLabel(round: string): string {
  switch (round) {
    case "ROUND_OF_32": return "Round of 32"
    case "ROUND_OF_16": return "Round of 16"
    case "QUARTER_FINAL": return "Quarter Final"
    case "SEMI_FINAL": return "Semi Final"
    case "FINAL": return "Final"
    default: return round
  }
}

function generateBracketStructure(teamCount: number): BracketSlot[] {
  const rounds = getRounds(teamCount)
  const slots: BracketSlot[] = []
  let matchesInRound = bracketSize(teamCount) / 2

  for (let r = 0; r < rounds.length; r++) {
    const round = rounds[r]
    const prevRound = r > 0 ? rounds[r - 1] : null

    for (let m = 1; m <= matchesInRound; m++) {
      const slot: BracketSlot = { round, matchNumber: m }

      if (prevRound) {
        const sourceA = (m - 1) * 2 + 1
        const sourceB = (m - 1) * 2 + 2
        slot.teamASourceMatchNumber = sourceA
        slot.teamBSourceMatchNumber = sourceB
        const roundLabel = formatRoundShort(prevRound)
        slot.teamASourceLabel = `Winner ${roundLabel}-${sourceA}`
        slot.teamBSourceLabel = `Winner ${roundLabel}-${sourceB}`
      }

      slots.push(slot)
    }

    matchesInRound = matchesInRound / 2
  }

  return slots
}

// Fixture type mapping
const FORMAT_TO_FIXTURE_TYPE: Record<string, string> = {
  menDoubles: "MEN_DOUBLES",
  womenDoubles: "WOMEN_DOUBLES",
  mixedDoubles: "MIXED_DOUBLES",
  menSingles: "MEN_SINGLES",
  womenSingles: "WOMEN_SINGLES",
  kidsSingles: "KIDS_SINGLES",
  kidsDoubles: "KIDS_DOUBLES",
}

// ── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  console.log("=== Seeding Knockout Championship 2026 ===\n")

  // ── Step 1: Create 64 Players ──────────────────────────────────────────

  console.log("Step 1: Creating 64 players...")

  const malePlayers = []
  for (let i = 1; i <= MALE_COUNT; i++) {
    const player = await prisma.player.create({
      data: {
        name: `Player M${i}`,
        gender: "MALE",
      },
    })
    malePlayers.push(player)
  }

  const femalePlayers = []
  for (let i = 1; i <= FEMALE_COUNT; i++) {
    const player = await prisma.player.create({
      data: {
        name: `Player F${i}`,
        gender: "FEMALE",
      },
    })
    femalePlayers.push(player)
  }

  console.log(`  Created ${malePlayers.length} male players (Player M1 - Player M${MALE_COUNT})`)
  console.log(`  Created ${femalePlayers.length} female players (Player F1 - Player F${FEMALE_COUNT})`)

  // ── Step 2: Create Tournament ──────────────────────────────────────────

  console.log("\nStep 2: Creating tournament...")

  const tournament = await prisma.tournament.create({
    data: {
      name: TOURNAMENT_NAME,
      description: "A 16-team single elimination knockout tournament",
      dateFrom: new Date("2026-03-01"),
      dateTo: new Date("2026-03-15"),
      organizerName: "Tournament Admin",
      organizerEmail: "admin@knockout2026.com",
      venue: "Badminton Arena",
      city: "New Delhi",
      category: "Open",
      requiresTeams: true,
      format: "KNOCKOUT_ONLY",
      status: "UPCOMING",
      teamRequiredMale: MALES_PER_TEAM,
      teamRequiredFemale: FEMALES_PER_TEAM,
      teamRequiredKid: 0,
      ...TOURNAMENT_DEFAULTS,
    },
  })

  console.log(`  Tournament "${tournament.name}" created (id: ${tournament.id})`)

  // ── Step 3: Create 16 Teams with Player Assignments ────────────────────

  console.log("\nStep 3: Creating 16 teams with player assignments...")

  const teams: any[] = []
  for (let t = 0; t < TEAM_NAMES.length; t++) {
    const teamName = TEAM_NAMES[t]

    const team = await prisma.team.create({
      data: {
        name: teamName,
        tournamentId: tournament.id,
      },
    })

    // Assign 3 male players
    const maleStart = t * MALES_PER_TEAM
    for (let m = 0; m < MALES_PER_TEAM; m++) {
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

    teams.push(team)
    console.log(
      `  ${teamName}: Males [M${maleStart + 1}, M${maleStart + 2}, M${maleStart + 3}], Female [F${t + 1}]`
    )
  }

  // ── Step 4: Generate Knockout Bracket ──────────────────────────────────

  console.log("\nStep 4: Generating knockout bracket...")

  const teamCount = teams.length
  const slots = generateBracketStructure(teamCount)
  const rounds = getRounds(teamCount)
  const firstRound = rounds[0]

  const firstRoundSlots = slots.filter((s) => s.round === firstRound)
  const laterSlots = slots.filter((s) => s.round !== firstRound)

  // Use a transaction for bracket creation, seeding, and team match creation
  await prisma.$transaction(async (tx) => {
    // Create first-round KnockoutMatch entries
    const firstRoundMatches = []
    for (const slot of firstRoundSlots) {
      const km = await tx.knockoutMatch.create({
        data: {
          tournamentId: tournament.id,
          round: slot.round,
          matchNumber: slot.matchNumber,
        },
      })
      firstRoundMatches.push(km)
    }

    console.log(`  Created ${firstRoundMatches.length} first-round matches (${firstRound})`)

    // Create subsequent round matches, linking source matches
    let prevRoundMatches = firstRoundMatches
    for (let r = 1; r < rounds.length; r++) {
      const round = rounds[r]
      const roundSlots = laterSlots.filter((s) => s.round === round)
      const currentRoundMatches = []

      for (const slot of roundSlots) {
        const sourceA = prevRoundMatches.find(
          (m) => m.matchNumber === slot.teamASourceMatchNumber
        )
        const sourceB = prevRoundMatches.find(
          (m) => m.matchNumber === slot.teamBSourceMatchNumber
        )

        const km = await tx.knockoutMatch.create({
          data: {
            tournamentId: tournament.id,
            round: slot.round,
            matchNumber: slot.matchNumber,
            teamASourceMatchId: sourceA?.id,
            teamBSourceMatchId: sourceB?.id,
            teamASourceLabel: slot.teamASourceLabel,
            teamBSourceLabel: slot.teamBSourceLabel,
          },
        })
        currentRoundMatches.push(km)
      }

      console.log(`  Created ${currentRoundMatches.length} matches for ${round}`)
      prevRoundMatches = currentRoundMatches
    }

    // ── Step 5: Seed teams into first-round slots ────────────────────────

    console.log("\nStep 5: Seeding teams into first-round bracket slots...")

    // Pair teams sequentially: Team 0 vs Team 1, Team 2 vs Team 3, etc.
    for (let i = 0; i < teams.length; i++) {
      const matchNumber = Math.floor(i / 2) + 1
      const slot = i % 2 === 0 ? "A" : "B"
      const match = firstRoundMatches.find((m) => m.matchNumber === matchNumber)

      if (!match) continue

      const updateData: Record<string, string> = {}
      if (slot === "A") {
        updateData.teamAId = teams[i].id
      } else {
        updateData.teamBId = teams[i].id
      }

      await tx.knockoutMatch.update({
        where: { id: match.id },
        data: updateData,
      })
    }

    console.log("  Seeded all 16 teams into 8 first-round matches")

    // ── Step 6: Create TeamMatch + Fixtures for first-round matches ──────

    console.log("\nStep 6: Creating TeamMatch and Fixture records for first-round matches...")

    // Re-fetch first round matches with team assignments
    const seededMatches = await tx.knockoutMatch.findMany({
      where: {
        tournamentId: tournament.id,
        round: firstRound,
      },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
      orderBy: { matchNumber: "asc" },
    })

    for (const km of seededMatches) {
      if (!km.teamAId || !km.teamBId) continue

      const roundLabel = formatRoundLabel(km.round)
      const matchName = `${roundLabel} M${km.matchNumber}: ${km.teamA?.name} vs ${km.teamB?.name}`

      // Create TeamMatch
      const teamMatch = await tx.teamMatch.create({
        data: {
          name: matchName,
          tournamentId: tournament.id,
          teamAId: km.teamAId,
          teamBId: km.teamBId,
          category: "ADULT",
          menDoublesCount: TOURNAMENT_DEFAULTS.defaultMenDoubles,
          womenDoublesCount: TOURNAMENT_DEFAULTS.defaultWomenDoubles,
          mixedDoublesCount: TOURNAMENT_DEFAULTS.defaultMixedDoubles,
          menSinglesCount: TOURNAMENT_DEFAULTS.defaultMenSingles,
          womenSinglesCount: TOURNAMENT_DEFAULTS.defaultWomenSingles,
          kidsSinglesCount: TOURNAMENT_DEFAULTS.defaultKidsSingles,
          kidsDoublesCount: TOURNAMENT_DEFAULTS.defaultKidsDoubles,
          setsCount: TOURNAMENT_DEFAULTS.defaultSetsCount,
          pointsToWin: TOURNAMENT_DEFAULTS.defaultPointsToWin,
          deuceCap: TOURNAMENT_DEFAULTS.defaultDeuceCap,
        },
      })

      // Auto-generate fixtures based on default counts
      const fixtureCounts: { field: string; count: number }[] = [
        { field: "menDoubles", count: TOURNAMENT_DEFAULTS.defaultMenDoubles },
        { field: "womenDoubles", count: TOURNAMENT_DEFAULTS.defaultWomenDoubles },
        { field: "mixedDoubles", count: TOURNAMENT_DEFAULTS.defaultMixedDoubles },
        { field: "menSingles", count: TOURNAMENT_DEFAULTS.defaultMenSingles },
        { field: "womenSingles", count: TOURNAMENT_DEFAULTS.defaultWomenSingles },
        { field: "kidsSingles", count: TOURNAMENT_DEFAULTS.defaultKidsSingles },
        { field: "kidsDoubles", count: TOURNAMENT_DEFAULTS.defaultKidsDoubles },
      ]

      let fixtureNumber = 1
      const fixtureData: { teamMatchId: string; fixtureNumber: number; fixtureType: any }[] = []

      for (const { field, count } of fixtureCounts) {
        const fixtureType = FORMAT_TO_FIXTURE_TYPE[field]
        for (let i = 0; i < count; i++) {
          fixtureData.push({
            teamMatchId: teamMatch.id,
            fixtureNumber: fixtureNumber++,
            fixtureType,
          })
        }
      }

      if (fixtureData.length > 0) {
        await tx.fixture.createMany({ data: fixtureData })
      }

      // Link the knockout match to the team match
      await tx.knockoutMatch.update({
        where: { id: km.id },
        data: { teamMatchId: teamMatch.id },
      })

      console.log(
        `  ${matchName} -> TeamMatch created with ${fixtureData.length} fixtures (1 MEN_DOUBLES, 1 MEN_SINGLES, 1 WOMEN_SINGLES)`
      )
    }
  })

  // ── Summary ────────────────────────────────────────────────────────────

  console.log("\n=== Seed Complete ===")
  console.log(`Tournament:       ${tournament.name} (${tournament.id})`)
  console.log(`Format:           KNOCKOUT_ONLY`)
  console.log(`Players created:  ${MALE_COUNT + FEMALE_COUNT} (${MALE_COUNT} male, ${FEMALE_COUNT} female)`)
  console.log(`Teams created:    ${teams.length}`)

  // Print bracket summary
  const allKnockoutMatches = await prisma.knockoutMatch.findMany({
    where: { tournamentId: tournament.id },
    include: {
      teamA: { select: { name: true } },
      teamB: { select: { name: true } },
      teamMatch: { select: { id: true, name: true } },
    },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  })

  console.log(`\nBracket structure (${allKnockoutMatches.length} total matches):`)
  for (const km of allKnockoutMatches) {
    const teamA = km.teamA?.name ?? km.teamASourceLabel ?? "TBD"
    const teamB = km.teamB?.name ?? km.teamBSourceLabel ?? "TBD"
    const tmInfo = km.teamMatch ? ` [TeamMatch: ${km.teamMatch.id}]` : ""
    console.log(`  ${km.round} M${km.matchNumber}: ${teamA} vs ${teamB}${tmInfo}`)
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
