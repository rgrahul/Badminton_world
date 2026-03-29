import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/** Target composition (required*) matches create-team form; roster is empty until the auction / manual adds. */
interface AblTeamRow {
  name: string
  logoUrl: string
  /** Optional: must match an existing `Player.email` (case-insensitive). */
  captainEmail?: string
}

// ABL 2026 Teams — logoUrl: /public paths or any Google Drive link.
// Drive files must be shared as "Anyone with the link" (Viewer) so the site can show them.
// Supported Drive forms: .../file/d/FILE_ID/view, .../open?id=FILE_ID, .../uc?export=view&id=FILE_ID,
// or store only the FILE_ID. The app converts these to thumbnail URLs for reliable <img> display.
const ABL_TEAMS: AblTeamRow[] = [
  {
    name: "Backhand Brigade",
    logoUrl: "1rlOih8rU5vVqlJO6GYheGKEgzXnkKgUf",
    // captainEmail: "captain@yourclub.com",
  },
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

/** Declared squad size + composition; roster empty until auction / manual adds (matches create API with skipCompositionValidation). */
const AUCTION_MODE_TEAM_SIZE = 11
const AUCTION_MODE_REQUIRED_MALE = 9
const AUCTION_MODE_REQUIRED_FEMALE = 2
const AUCTION_MODE_REQUIRED_KID = 0

async function main() {
  console.log("🏸 Seeding ABL 2026 Tournament...\n")

  // ──────────────────────────────────────────────
  // Step 1: Create Tournament
  // ──────────────────────────────────────────────
  console.log("Step 1: Creating ABL 2026 tournament...")

  const tournament = await prisma.tournament.create({
    data: {
      name: "ABL 2026",
      titlePhoto:
        "https://drive.google.com/file/d/1mYTKrW4VeYsN0CNY868yoVdKbMXOW_mj/view?usp=sharing",
      description: "Asia Badminton League 2026 - A premium 12-team league-knockout tournament.",
      dateFrom: new Date("2026-05-01"),
      dateTo: new Date("2026-06-30"),
      organizerName: "ABL Organizing Committee",
      organizerEmail: "info@abl2026.in",
      organizerPhone: "+91 9404420049",
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
  // Step 2: 12 teams — same as “Players added via Auction” (empty roster, targets only)
  // ──────────────────────────────────────────────
  console.log("Step 2: Creating 12 teams (players added via auction)...")

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
        playersAddedViaAuction: true,
        teamSize: AUCTION_MODE_TEAM_SIZE,
        requiredMale: AUCTION_MODE_REQUIRED_MALE,
        requiredFemale: AUCTION_MODE_REQUIRED_FEMALE,
        requiredKid: AUCTION_MODE_REQUIRED_KID,
      },
      create: {
        name: teamInfo.name,
        logoUrl: teamInfo.logoUrl,
        tournamentId: tournament.id,
        teamSize: AUCTION_MODE_TEAM_SIZE,
        requiredMale: AUCTION_MODE_REQUIRED_MALE,
        requiredFemale: AUCTION_MODE_REQUIRED_FEMALE,
        requiredKid: AUCTION_MODE_REQUIRED_KID,
        playersAddedViaAuction: true,
      },
    })

    teams.push({ id: team.id, name: team.name })
    console.log(`  ✅ ${team.name}`)

    const email = teamInfo.captainEmail?.trim()
    if (email) {
      const captain = await prisma.player.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      })
      if (!captain) {
        console.warn(`  ⚠️  No player with email "${email}" — captain not set for ${teamInfo.name}`)
      } else {
        await prisma.team.update({
          where: { id: team.id },
          data: { captainId: captain.id },
        })
        console.log(`     👤 Captain: ${captain.name} (${captain.email})`)
      }
    }
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
  console.log(`  Teams:       ${teams.length} (playersAddedViaAuction)`)
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
