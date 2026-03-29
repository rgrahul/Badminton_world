import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ABL 2026 Teams — logoUrl: /public paths or any Google Drive link.
// Drive files must be shared as "Anyone with the link" (Viewer) so the site can show them.
// Supported Drive forms: .../file/d/FILE_ID/view, .../open?id=FILE_ID, .../uc?export=view&id=FILE_ID,
// or store only the FILE_ID. The app converts these to thumbnail URLs for reliable <img> display.
const ABL_TEAMS = [
  { name: "Backhand Brigade", logoUrl: "1rlOih8rU5vVqlJO6GYheGKEgzXnkKgUf" },
  { name: "Club Shakti", logoUrl: "1lpV226kcptyHktYjOMATDzGAntSSu0Tp" },
  {
    name: "Court Commanders",
    logoUrl: "https://drive.google.com/file/d/1vK97tcF64Q7Uat9yGEHe5dfKUiSvk7WF/view?usp=sharing",
  },
  {
    name: "Assetz Endless Rally",
    logoUrl: "https://drive.google.com/file/d/1rlOih8rU5vVqlJO6GYheGKEgzXnkKgUf/view?usp=sharing",
  },
  {
    name: "Mavericks 63",
    logoUrl: "https://drive.google.com/file/d/1W06aih38tScagABJWxK1oP7aHSTlERmc/view?usp=sharing",
  },
  {
    name: "Dhurandhar Smash Squad",
    logoUrl: "https://drive.google.com/file/d/1NMYNGXl242f6f5p0dKw7rrULfNw57ke2/view?usp=sharing",
  },
  {
    name: "Netflicks & Kill",
    logoUrl: "https://drive.google.com/file/d/1VnA9XjMbzWeYpt6AI_5F25SW1Dgp0-BO/view?usp=sharing",
  },
  {
    name: "Shuttle Strikers",
    logoUrl: "https://drive.google.com/file/d/19KvLPn9F1WXVsEbdzF1fjFB8v0isP5SX/view?usp=sharing",
  },
  {
    name: "Smash Syndicate",
    logoUrl: "https://drive.google.com/file/d/1uj2aP89NzgFfOxCi444UwZjsgXkWYer8/view?usp=sharing",
  },
  {
    name: "Supersonic",
    logoUrl: "https://drive.google.com/file/d/1Y9GFsyD2Nr-G0TlbBp_9OXnKfk9WARem/view?usp=sharing",
  },
  {
    name: "Assetz Challengers",
    logoUrl: "https://drive.google.com/uc?export=view&id=1DEXzgjOcAUenMAfOYYQqMFMy_pU_qH6z",
  },
  {
    name: "Big Dawgs",
    logoUrl: "https://drive.google.com/file/d/1xpYtaTy9NQMpXboqrN9L82wxXBaPojVA/view?usp=sharing",
  },
]

async function main() {
  console.log("🏸 Seeding ABL 2026 Tournament...\n")

  // ──────────────────────────────────────────────
  // Step 1: Create Tournament
  // ──────────────────────────────────────────────
  console.log("Step 1: Creating ABL 2026 tournament...")

  const tournament = await prisma.tournament.create({
    data: {
      name: "ABL 2026",
      description: "Asia Badminton League 2026 - A premium 12-team league-knockout tournament.",
      dateFrom: new Date("2026-05-01"),
      dateTo: new Date("2026-06-30"),
      organizerName: "Asia Badminton League",
      organizerEmail: "info@abl2026.in",
      organizerPhone: "+91 9876543210",
      venue: "Assetz 63 Degree East Clubhouse",
      city: "Bangalore",
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
  // Step 2: Create 12 Teams with Logos (without players)
  // ──────────────────────────────────────────────
  console.log("Step 2: Creating 12 teams with logos...")

  const teams: { id: string; name: string }[] = []

  for (let t = 0; t < 12; t++) {
    const teamInfo = ABL_TEAMS[t]

    const team = await prisma.team.upsert({
      where: {
        name_tournamentId: {
          name: teamInfo.name,
          tournamentId: tournament.id,
        },
      },
      update: {
        logoUrl: teamInfo.logoUrl,
      },
      create: {
        name: teamInfo.name,
        logoUrl: teamInfo.logoUrl,
        tournamentId: tournament.id,
        teamSize: 11,
        requiredMale: 9,
        requiredFemale: 2,
        requiredKid: 0,
      },
    })

    teams.push({ id: team.id, name: team.name })
    console.log(`  ✅ ${team.name}`)
  }

  console.log()

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log("═══════════════════════════════════════")
  console.log("  SEED COMPLETE - ABL 2026")
  console.log("═══════════════════════════════════════")
  console.log(`  Tournament:  ${tournament.name}`)
  console.log(`  ID:          ${tournament.id}`)
  console.log(`  Teams:       ${teams.length}`)
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
