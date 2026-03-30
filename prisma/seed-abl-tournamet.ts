import { PrismaClient } from "@prisma/client"
import { derivePlayerCategory } from "@/lib/constants"
import fs from "fs"
import path from "path"
import { date } from "zod"

const prisma = new PrismaClient()

interface RegisteredPlayer {
  Timestamp: string
  "Full Name": string
  Category: string
  "Profile Photo (will be used for auction)": string
  "Email Address": string
  "Mobile Number": string
  "Self-Assessed Skill Rating (Our Society level)": string
  "Years/months of playing experience": string
}

interface AblTeamRow {
  name: string
  logoUrl: string
  captainEmail?: string
}

// ──────────────────────────────────────────────
// ABL 2026 Teams Configuration
// ──────────────────────────────────────────────
const ABL_TEAMS: AblTeamRow[] = [
  {
    name: "Backhand Brigade",
    logoUrl: "1rlOih8rU5vVqlJO6GYheGKEgzXnkKgUf",
    captainEmail: "subbiahperi@gmail.com",
  },
  {
    name: "Club Shakti",
    logoUrl: "1lpV226kcptyHktYjOMATDzGAntSSu0Tp",
    captainEmail: "anandgshenoy@gmail.com",
  },
  {
    name: "Court Commanders",
    logoUrl: "1vK97tcF64Q7Uat9yGEHe5dfKUiSvk7WF",
    captainEmail: "priyadarshi.menon@gmail.com",
  },
  {
    name: "Assetz Endless Rally",
    logoUrl: "https://drive.google.com/file/d/1rlOih8rU5vVqlJO6GYheGKEgzXnkKgUf/view?usp=sharing",
    captainEmail: "varunkatikitala@gmail.com",
  },
  {
    name: "Mavericks 63",
    logoUrl: "https://drive.google.com/file/d/1W06aih38tScagABJWxK1oP7aHSTlERmc/view?usp=sharing",
    captainEmail: "sharon.mavrick@gmail.com",
  },
  {
    name: "Dhurandhar Smash Squad",
    logoUrl: "https://drive.google.com/file/d/1NMYNGXl242f6f5p0dKw7rrULfNw57ke2/view?usp=sharing",
    captainEmail: "avi.vaishali.jain@gmail.com",
  },
  {
    name: "Netflicks & Kill",
    logoUrl: "https://drive.google.com/file/d/1VnA9XjMbzWeYpt6AI_5F25SW1Dgp0-BO/view?usp=sharing",
    captainEmail: "ankit.purohit991@gmail.com",
  },
  {
    name: "Shuttle Strikers",
    logoUrl: "https://drive.google.com/file/d/19KvLPn9F1WXVsEbdzF1fjFB8v0isP5SX/view?usp=sharing",
    captainEmail: "Kumarrajeev35@gmail.com",
  },
  {
    name: "Smash Syndicate",
    logoUrl: "https://drive.google.com/file/d/1uj2aP89NzgFfOxCi444UwZjsgXkWYer8/view?usp=sharing",
    captainEmail: "prankurtewari@gmail.com",
  },
  {
    name: "Supersonic",
    logoUrl: "https://drive.google.com/file/d/1Y9GFsyD2Nr-G0TlbBp_9OXnKfk9WARem/view?usp=sharing",
    captainEmail: "gaurav9126@gmail.com",
  },
  {
    name: "Assetz Challengers",
    logoUrl: "https://drive.google.com/uc?export=view&id=1DEXzgjOcAUenMAfOYYQqMFMy_pU_qH6z",
    captainEmail: "venkateshprabhu2@gmail.com",
  },
  {
    name: "Big Dawgs",
    logoUrl: "https://drive.google.com/file/d/1xpYtaTy9NQMpXboqrN9L82wxXBaPojVA/view?usp=sharing",
    captainEmail: "prathapmenon7943@gmail.com",
  },
]

const AUCTION_MODE_REQUIRED_MALE = 9
const AUCTION_MODE_REQUIRED_FEMALE = 2
const AUCTION_MODE_REQUIRED_KID = 0

// ──────────────────────────────────────────────
// CSV Parser
// ──────────────────────────────────────────────
function parseCSV(content: string): RegisteredPlayer[] {
  const lines = content.split("\n")
  const headers = lines[0].split(",")

  const records: RegisteredPlayer[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line with quoted field support
    const fields: string[] = []
    let currentField = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        fields.push(currentField.replace(/^"|"$/g, "").trim())
        currentField = ""
      } else {
        currentField += char
      }
    }
    fields.push(currentField.replace(/^"|"$/g, "").trim())

    // Map fields to headers
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header.trim()] = fields[index] || ""
    })

    records.push(record as unknown as RegisteredPlayer)
  }

  return records
}

// ──────────────────────────────────────────────
// Main Seed Function
// ──────────────────────────────────────────────
async function main() {
  console.log("🏸 Seeding ABL 2026 Tournament with Players and Teams...\n")

  try {
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
        teamRequiredMale: AUCTION_MODE_REQUIRED_MALE,
        teamRequiredFemale: AUCTION_MODE_REQUIRED_FEMALE,
        teamRequiredKid: AUCTION_MODE_REQUIRED_KID,
      },
    })

    console.log(`   ✅ Tournament created: ${tournament.name} (${tournament.id})\n`)

    // ──────────────────────────────────────────────
    // Step 2: Add Players to Tournament
    // ──────────────────────────────────────────────
    console.log("Step 2: Adding registered players to tournament...")

    // Read CSV file
    const csvPath = path.join(__dirname, "../docs/registered-players.csv")
    const fileContent = fs.readFileSync(csvPath, "utf-8")
    const records = parseCSV(fileContent)
    console.log(`   📋 Found ${records.length} players in CSV`)

    // Get all players from database
    const allPlayers = await prisma.player.findMany()
    console.log(`   📊 Found ${allPlayers.length} total players in database`)

    // Add players to tournament
    let addedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const player of allPlayers) {
      try {
        // Check if already exists
        const existing = await prisma.tournamentPlayer.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId: tournament.id,
              playerId: player.id,
            },
          },
        })

        if (existing) {
          skippedCount++
          continue
        }

        // Create new tournament player record
        await prisma.tournamentPlayer.create({
          data: {
            tournamentId: tournament.id,
            playerId: player.id,
          },
        })

        addedCount++
      } catch (err) {
        errors.push(
          `Error adding ${player.name}: ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    console.log(`   ✅ Added ${addedCount} players to tournament`)
    console.log(`   ℹ️  Skipped ${skippedCount} already registered`)

    if (errors.length > 0) {
      console.log(`\n   ⚠️  Errors encountered:`)
      errors.forEach((err) => console.log(`      - ${err}`))
    }

    const tournamentPlayerCount = await prisma.tournamentPlayer.count({
      where: { tournamentId: tournament.id },
    })
    console.log(`   🎯 Tournament now has ${tournamentPlayerCount} registered players\n`)

    // ──────────────────────────────────────────────
    // Step 3: Create 12 Teams
    // ──────────────────────────────────────────────
    console.log("Step 3: Creating 12 teams...")

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
        },
        create: {
          name: teamInfo.name,
          logoUrl: teamInfo.logoUrl,
          tournamentId: tournament.id,
          playersAddedViaAuction: true,
        },
      })

      teams.push({ id: team.id, name: team.name })
      console.log(`   ✅ ${team.name}`)

      const email = teamInfo.captainEmail?.trim()
      if (email) {
        const captain = await prisma.player.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        })
        if (!captain) {
          console.warn(
            `   ⚠️  No player with email "${email}" — captain not set for ${teamInfo.name}`
          )
        } else {
          const category = derivePlayerCategory(captain.age, captain.gender)
          await prisma.team.update({
            where: { id: team.id },
            data: { captainId: captain.id },
          })

          await prisma.teamPlayer.upsert({
            where: {
              teamId_playerId: {
                teamId: team.id,
                playerId: captain.id,
              },
            },
            update: { category },
            create: {
              teamId: team.id,
              playerId: captain.id,
              category,
            },
          })

          await prisma.tournamentPlayer.createMany({
            data: { tournamentId: tournament.id, playerId: captain.id },
            skipDuplicates: true,
          })

          console.log(`      👤 Captain: ${captain.name} (${captain.email})`)
        }
      }
    }

    console.log()

    // ──────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════════")
    console.log("  ✨ SEED COMPLETE - ABL 2026")
    console.log("═══════════════════════════════════════════════════════")
    console.log(`  Tournament:        ${tournament.name}`)
    console.log(`  Tournament ID:     ${tournament.id}`)
    console.log(`  Tournament Players: ${tournamentPlayerCount}`)
    console.log(`  Teams:             ${teams.length}`)
    console.log("═══════════════════════════════════════════════════════\n")
  } catch (error) {
    console.error("Error during seeding:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
