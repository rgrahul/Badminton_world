import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const GROUP_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const TEAM_NAMES = [
  "Shuttle Strikers",
  "Net Ninjas",
  "Smash Kings",
  "Rally Rockets",
  "Drop Shot Demons",
  "Court Crushers",
  "Feather Flyers",
  "Birdie Blazers",
  "Ace Avengers",
  "Clear Champions",
  "Drive Dynasty",
  "Lob Legends",
]

type FixtureTypeEnum =
  | "MEN_DOUBLES"
  | "WOMEN_DOUBLES"
  | "MIXED_DOUBLES"
  | "MEN_SINGLES"
  | "WOMEN_SINGLES"
  | "KIDS_SINGLES"
  | "KIDS_DOUBLES"

const FORMAT_TO_FIXTURE_TYPE: Record<string, FixtureTypeEnum> = {
  menDoublesCount: "MEN_DOUBLES",
  womenDoublesCount: "WOMEN_DOUBLES",
  mixedDoublesCount: "MIXED_DOUBLES",
  menSinglesCount: "MEN_SINGLES",
  womenSinglesCount: "WOMEN_SINGLES",
  kidsSinglesCount: "KIDS_SINGLES",
  kidsDoublesCount: "KIDS_DOUBLES",
}

function generateRoundRobinPairings(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  return pairs
}

async function main() {
  console.log("🏸 Seeding Premier Badminton League 2026...\n")

  // ──────────────────────────────────────────────
  // Step 1: Create Tournament
  // ──────────────────────────────────────────────
  console.log("Step 1: Creating tournament...")

  const tournament = await prisma.tournament.create({
    data: {
      name: "Premier Badminton League 2026",
      description: "A 12-team league-knockout tournament with round-robin group stage and knockout finals.",
      dateFrom: new Date("2026-04-01"),
      dateTo: new Date("2026-04-30"),
      organizerName: "Badminton Association",
      organizerEmail: "info@badmintonleague.com",
      organizerPhone: "+91 9876543210",
      venue: "National Badminton Stadium",
      city: "Hyderabad",
      category: "Open",
      requiresTeams: true,
      format: "LEAGUE_KNOCKOUT",
      status: "UPCOMING",
      numberOfGroups: 2,
      qualifyPerGroup: 4,
      defaultMenDoubles: 4,
      defaultWomenDoubles: 1,
      defaultMixedDoubles: 1,
      defaultMenSingles: 1,
      defaultWomenSingles: 0,
      defaultKidsSingles: 0,
      defaultKidsDoubles: 0,
      defaultSetsCount: 3,
      defaultPointsToWin: 15,
      defaultDeuceCap: 20,
    },
  })

  console.log(`  ✅ Tournament created: ${tournament.name} (${tournament.id})\n`)

  // ──────────────────────────────────────────────
  // Step 2: Fetch Players from global pool
  // ──────────────────────────────────────────────
  console.log("Step 2: Fetching players from global pool...")

  const males = await prisma.player.findMany({
    where: { gender: "MALE" },
    take: 108,
    orderBy: { createdAt: "asc" },
  })

  const females = await prisma.player.findMany({
    where: { gender: "FEMALE" },
    take: 24,
    orderBy: { createdAt: "asc" },
  })

  if (males.length < 108) {
    throw new Error(`Not enough male players: found ${males.length}, need 108`)
  }
  if (females.length < 24) {
    throw new Error(`Not enough female players: found ${females.length}, need 24`)
  }

  console.log(`  ✅ Found ${males.length} males and ${females.length} females\n`)

  // ──────────────────────────────────────────────
  // Step 3: Create 12 Teams (9M + 2F each)
  // ──────────────────────────────────────────────
  console.log("Step 3: Creating 12 teams...")

  const teams: { id: string; name: string }[] = []

  for (let t = 0; t < 12; t++) {
    const teamMales = males.slice(t * 9, (t + 1) * 9)
    const teamFemales = females.slice(t * 2, (t + 1) * 2)

    const team = await prisma.team.create({
      data: {
        name: TEAM_NAMES[t],
        tournamentId: tournament.id,
        teamSize: 11,
        requiredMale: 9,
        requiredFemale: 2,
        requiredKid: 0,
        players: {
          create: [
            ...teamMales.map((p) => ({
              playerId: p.id,
              category: "MALE" as const,
            })),
            ...teamFemales.map((p) => ({
              playerId: p.id,
              category: "FEMALE" as const,
            })),
          ],
        },
      },
    })

    teams.push({ id: team.id, name: team.name })
    console.log(`  ✅ ${team.name} (${teamMales.length}M + ${teamFemales.length}F)`)
  }

  console.log()

  // ──────────────────────────────────────────────
  // Step 4: Register all players as TournamentPlayers
  // ──────────────────────────────────────────────
  console.log("Step 4: Registering tournament players...")

  const allPlayerIds = [
    ...males.map((p) => p.id),
    ...females.map((p) => p.id),
  ]

  await prisma.tournamentPlayer.createMany({
    data: allPlayerIds.map((playerId) => ({
      tournamentId: tournament.id,
      playerId,
    })),
    skipDuplicates: true,
  })

  console.log(`  ✅ Registered ${allPlayerIds.length} tournament players\n`)

  // ──────────────────────────────────────────────
  // Step 5: Create 2 Groups and assign 6 teams each
  // ──────────────────────────────────────────────
  console.log("Step 5: Creating groups...")

  // Shuffle teams for random group assignment
  const shuffledTeams = [...teams]
  for (let i = shuffledTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]]
  }

  const groupCount = 2
  const groups: { id: string; name: string; teamIds: string[] }[] = []

  await prisma.$transaction(async (tx) => {
    for (let g = 0; g < groupCount; g++) {
      const group = await tx.tournamentGroup.create({
        data: {
          tournamentId: tournament.id,
          name: `Group ${GROUP_LETTERS[g]}`,
          sortOrder: g,
        },
      })

      const groupTeamIds: string[] = []
      const groupTeamCreates = []

      for (let t = 0; t < shuffledTeams.length; t++) {
        if (t % groupCount === g) {
          groupTeamCreates.push({
            groupId: group.id,
            teamId: shuffledTeams[t].id,
            seedOrder: Math.floor(t / groupCount) + 1,
          })
          groupTeamIds.push(shuffledTeams[t].id)
        }
      }

      await tx.groupTeam.createMany({ data: groupTeamCreates })

      groups.push({ id: group.id, name: group.name, teamIds: groupTeamIds })

      const teamNames = groupTeamCreates.map((gt) => {
        const team = shuffledTeams.find((st) => st.id === gt.teamId)
        return team?.name
      })
      console.log(`  ✅ ${group.name}: ${teamNames.join(", ")}`)
    }
  })

  console.log()

  // ──────────────────────────────────────────────
  // Step 6: Generate round-robin matches per group
  // ──────────────────────────────────────────────
  console.log("Step 6: Generating round-robin matches...")

  const matchFormat = {
    menDoublesCount: tournament.defaultMenDoubles ?? 0,
    womenDoublesCount: tournament.defaultWomenDoubles ?? 0,
    mixedDoublesCount: tournament.defaultMixedDoubles ?? 0,
    menSinglesCount: tournament.defaultMenSingles ?? 0,
    womenSinglesCount: tournament.defaultWomenSingles ?? 0,
    kidsSinglesCount: tournament.defaultKidsSingles ?? 0,
    kidsDoublesCount: tournament.defaultKidsDoubles ?? 0,
  }

  let totalMatches = 0

  // Build team name map
  const teamNameMap: Record<string, string> = {}
  for (const t of teams) {
    teamNameMap[t.id] = t.name
  }

  for (const group of groups) {
    const pairings = generateRoundRobinPairings(group.teamIds)

    for (const [teamAId, teamBId] of pairings) {
      const name = `${group.name}: ${teamNameMap[teamAId]} vs ${teamNameMap[teamBId]}`

      await prisma.$transaction(async (tx) => {
        const teamMatch = await tx.teamMatch.create({
          data: {
            name,
            tournamentId: tournament.id,
            teamAId,
            teamBId,
            category: "ADULT",
            allowPlayerReuse: true,
            menDoublesCount: matchFormat.menDoublesCount,
            womenDoublesCount: matchFormat.womenDoublesCount,
            mixedDoublesCount: matchFormat.mixedDoublesCount,
            menSinglesCount: matchFormat.menSinglesCount,
            womenSinglesCount: matchFormat.womenSinglesCount,
            kidsSinglesCount: matchFormat.kidsSinglesCount,
            kidsDoublesCount: matchFormat.kidsDoublesCount,
            setsCount: tournament.defaultSetsCount ?? 3,
            pointsToWin: tournament.defaultPointsToWin ?? 21,
            deuceCap: tournament.defaultDeuceCap ?? 30,
            groupId: group.id,
          },
        })

        // Auto-generate fixture records
        let fixtureNumber = 1
        const fixtureCreates: {
          teamMatchId: string
          fixtureNumber: number
          fixtureType: FixtureTypeEnum
        }[] = []

        for (const [field, fixtureType] of Object.entries(FORMAT_TO_FIXTURE_TYPE)) {
          const count = matchFormat[field as keyof typeof matchFormat] as number
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
      })

      totalMatches++
    }

    console.log(`  ✅ ${group.name}: ${pairings.length} matches (C(6,2) = 15)`)
  }

  console.log(`  Total: ${totalMatches} matches\n`)

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  const finalStats = await prisma.teamMatch.aggregate({
    where: { tournamentId: tournament.id },
    _count: true,
  })

  const fixtureCount = await prisma.fixture.count({
    where: { teamMatch: { tournamentId: tournament.id } },
  })

  const playerCount = await prisma.tournamentPlayer.count({
    where: { tournamentId: tournament.id },
  })

  console.log("═══════════════════════════════════════")
  console.log("  SEED COMPLETE")
  console.log("═══════════════════════════════════════")
  console.log(`  Tournament:  ${tournament.name}`)
  console.log(`  ID:          ${tournament.id}`)
  console.log(`  Teams:       ${teams.length}`)
  console.log(`  Groups:      ${groups.length}`)
  console.log(`  Players:     ${playerCount}`)
  console.log(`  Matches:     ${finalStats._count}`)
  console.log(`  Fixtures:    ${fixtureCount} (${fixtureCount / finalStats._count} per match)`)
  console.log("═══════════════════════════════════════\n")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
