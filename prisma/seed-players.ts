import { PrismaClient, SkillCategory, Gender } from "@prisma/client"
import fs from "fs"
import path from "path"
import { KEY_STRENGTH_MAX_LEN } from "../src/lib/playerKeyStrength"

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
  "Last Played": string
  "What is your key strength/shot that can turn a match in your favour?": string
}

/**
 * Simple CSV parser that handles quoted fields
 */
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

interface ParsedPlayer {
  name: string
  email: string | null
  mobileNumber: string | null
  gender: Gender | null
  skillCategory: SkillCategory | null
  experience: string | null
  lastPlayed: string | null
  keyStrength: string | null
  profilePhoto: string | null
}

/**
 * Parse skill category from string to enum
 */
function parseSkillCategory(skillStr: string | undefined): SkillCategory | null {
  if (!skillStr) return null

  const skill = skillStr.trim().toUpperCase()

  if (skill.includes("BEGINNER")) return "BEGINNER"
  if (skill.includes("INTERMEDIATE +") || skill.includes("INTERMEDIATE_PLUS"))
    return "INTERMEDIATE_PLUS"
  if (skill.includes("INTERMEDIATE")) return "INTERMEDIATE"
  if (skill.includes("ADVANCED")) return "ADVANCED"

  return null
}

/**
 * Get experience value as-is from CSV
 */
function getExperience(expStr: string | undefined): string | null {
  if (!expStr) return null
  return expStr.trim() || null
}

/**
 * Get last played value as-is from CSV
 */
function getLastPlayed(lastPlayedStr: string | undefined): string | null {
  if (!lastPlayedStr) return null
  return lastPlayedStr.trim() || null
}

const KEY_STRENGTH_CSV_COL =
  "What is your key strength/shot that can turn a match in your favour?" as const

/**
 * Key strength from CSV; trimmed and capped to match Player.keyStrength / API.
 */
function getKeyStrength(raw: string | undefined): string | null {
  if (!raw) return null
  const t = raw.trim()
  if (!t) return null
  return t.length > KEY_STRENGTH_MAX_LEN ? t.slice(0, KEY_STRENGTH_MAX_LEN) : t
}

/**
 * Parse gender from category field
 * Maps: "Mens (Age 18+ and above)" → MALE, "Womens" → FEMALE
 */
function parseGender(category: string | undefined): Gender | null {
  if (!category) return null

  const cat = category.trim().toUpperCase()

  // Check for WOMENS first to avoid matching "MENS" substring in "WOMENS"
  if (cat.includes("WOMENS")) {
    return "FEMALE"
  }

  if (cat.includes("MENS")) {
    return "MALE"
  }

  return null
}

async function main() {
  console.log("🏸 Seeding Players from registered-players.csv...\n")

  try {
    // Read CSV file
    const csvPath = path.join(__dirname, "../docs/registered-players.csv")
    const fileContent = fs.readFileSync(csvPath, "utf-8")

    // Parse CSV
    const records = parseCSV(fileContent)

    console.log(`📋 Found ${records.length} registered players\n`)

    // Parse and validate players
    const playersToInsert: ParsedPlayer[] = []
    const errors: Array<{ row: number; reason: string; data: Partial<RegisteredPlayer> }> = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]

      // Validate required field
      if (!row["Full Name"] || !row["Full Name"].trim()) {
        errors.push({
          row: i + 2, // +2 for header + 0-index
          reason: "Missing name",
          data: row,
        })
        continue
      }

      const parsedPlayer: ParsedPlayer = {
        name: row["Full Name"].trim(),
        email: row["Email Address"]?.trim() || null,
        mobileNumber: row["Mobile Number"]?.trim() || null,
        gender: parseGender(row.Category),
        skillCategory: parseSkillCategory(row["Self-Assessed Skill Rating (Our Society level)"]),
        experience: getExperience(row["Years/months of playing experience"]),
        lastPlayed: getLastPlayed(row["Last Played"]),
        keyStrength: getKeyStrength(row[KEY_STRENGTH_CSV_COL]),
        profilePhoto: row["Profile Photo (will be used for auction)"]?.trim() || null,
      }

      playersToInsert.push(parsedPlayer)
    }

    // Log validation errors if any
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} rows had issues:`)
      errors.forEach(({ row, reason }) => {
        console.log(`   Row ${row}: ${reason}`)
      })
      console.log()
    }

    console.log(`✅ Parsed ${playersToInsert.length} valid players\n`)

    // Insert players
    let createdCount = 0

    for (const player of playersToInsert) {
      try {
        // Create new player (allow duplicate emails)
        await prisma.player.create({
          data: {
            name: player.name,
            email: player.email,
            mobileNumber: player.mobileNumber,
            gender: player.gender,
            skillCategory: player.skillCategory,
            experience: player.experience,
            lastPlayed: player.lastPlayed,
            keyStrength: player.keyStrength,
            profilePhoto: player.profilePhoto,
          },
        })

        createdCount++
      } catch (err) {
        console.error(`Error inserting player ${player.name}:`, err)
      }
    }

    console.log(`📊 Database Results:`)
    console.log(`   Created: ${createdCount} new players`)
    console.log(`   Total: ${playersToInsert.length} players`)

    // Get total count in database
    const totalPlayers = await prisma.player.count()
    console.log(`\n🎯 Total players in database: ${totalPlayers}`)

    console.log("\n✨ Seed completed successfully!")
  } catch (error) {
    console.error("Error during seeding:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
