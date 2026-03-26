import { derivePlayerCategory } from "@/lib/constants"

export type TeamMatchFormat = {
  menDoublesCount: number
  womenDoublesCount: number
  mixedDoublesCount: number
  menSinglesCount: number
  womenSinglesCount: number
  kidsSinglesCount: number
  kidsDoublesCount: number
}

export type TeamPlayer = {
  playerId: string
  category: string
  player: {
    id: string
    name: string
    age: number | null
    gender: string | null
  }
}

export function getRequiredPlayerBreakdown(
  format: TeamMatchFormat,
  category: "ADULT" | "KIDS",
  genderRestriction?: boolean | null
): { male: number; female: number; kids: number; total: number } {
  if (category === "ADULT") {
    const male =
      format.menDoublesCount * 2 +
      format.menSinglesCount +
      format.mixedDoublesCount
    const female =
      format.womenDoublesCount * 2 +
      format.womenSinglesCount +
      format.mixedDoublesCount
    return { male, female, kids: 0, total: male + female }
  }

  // KIDS category
  if (genderRestriction) {
    // Gender-restricted kids: same logic as adult but with kid-age players
    const male =
      format.menDoublesCount * 2 +
      format.menSinglesCount +
      format.mixedDoublesCount
    const female =
      format.womenDoublesCount * 2 +
      format.womenSinglesCount +
      format.mixedDoublesCount
    return { male, female, kids: male + female, total: male + female }
  }

  // KIDS no gender restriction
  const kids = format.kidsSinglesCount + format.kidsDoublesCount * 2
  return { male: 0, female: 0, kids, total: kids }
}

export function validateTeamEligibility(
  teamPlayers: TeamPlayer[],
  format: TeamMatchFormat,
  category: "ADULT" | "KIDS",
  genderRestriction?: boolean | null,
  allowPlayerReuse?: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Derive categories for each player
  const playerCategories = teamPlayers.map((tp) => ({
    ...tp,
    derivedCategory: derivePlayerCategory(tp.player.age, tp.player.gender),
  }))

  if (category === "ADULT") {
    const males = playerCategories.filter((p) => p.derivedCategory === "MALE")
    const females = playerCategories.filter((p) => p.derivedCategory === "FEMALE")

    let requiredMales: number
    let requiredFemales: number

    if (allowPlayerReuse) {
      // With reuse, only need enough for the largest single fixture
      const maleNeeds: number[] = []
      if (format.menDoublesCount > 0) maleNeeds.push(2)
      if (format.menSinglesCount > 0) maleNeeds.push(1)
      if (format.mixedDoublesCount > 0) maleNeeds.push(1)
      requiredMales = maleNeeds.length > 0 ? Math.max(...maleNeeds) : 0

      const femaleNeeds: number[] = []
      if (format.womenDoublesCount > 0) femaleNeeds.push(2)
      if (format.womenSinglesCount > 0) femaleNeeds.push(1)
      if (format.mixedDoublesCount > 0) femaleNeeds.push(1)
      requiredFemales = femaleNeeds.length > 0 ? Math.max(...femaleNeeds) : 0
    } else {
      requiredMales =
        format.menDoublesCount * 2 +
        format.menSinglesCount +
        format.mixedDoublesCount
      requiredFemales =
        format.womenDoublesCount * 2 +
        format.womenSinglesCount +
        format.mixedDoublesCount
    }

    if (males.length < requiredMales) {
      errors.push(
        `Not enough male players. Need ${requiredMales}, have ${males.length}`
      )
    }
    if (females.length < requiredFemales) {
      errors.push(
        `Not enough female players. Need ${requiredFemales}, have ${females.length}`
      )
    }
  } else if (category === "KIDS" && genderRestriction) {
    // Kids with gender restriction — filter only KID-age players, then check by gender
    const kids = playerCategories.filter((p) => p.derivedCategory === "KID")
    const kidMales = kids.filter((p) => p.player.gender === "MALE")
    const kidFemales = kids.filter((p) => p.player.gender === "FEMALE")

    let requiredMales: number
    let requiredFemales: number

    if (allowPlayerReuse) {
      const maleNeeds: number[] = []
      if (format.menDoublesCount > 0) maleNeeds.push(2)
      if (format.menSinglesCount > 0) maleNeeds.push(1)
      if (format.mixedDoublesCount > 0) maleNeeds.push(1)
      requiredMales = maleNeeds.length > 0 ? Math.max(...maleNeeds) : 0

      const femaleNeeds: number[] = []
      if (format.womenDoublesCount > 0) femaleNeeds.push(2)
      if (format.womenSinglesCount > 0) femaleNeeds.push(1)
      if (format.mixedDoublesCount > 0) femaleNeeds.push(1)
      requiredFemales = femaleNeeds.length > 0 ? Math.max(...femaleNeeds) : 0
    } else {
      requiredMales =
        format.menDoublesCount * 2 +
        format.menSinglesCount +
        format.mixedDoublesCount
      requiredFemales =
        format.womenDoublesCount * 2 +
        format.womenSinglesCount +
        format.mixedDoublesCount
    }

    if (kidMales.length < requiredMales) {
      errors.push(
        `Not enough male kid players. Need ${requiredMales}, have ${kidMales.length}`
      )
    }
    if (kidFemales.length < requiredFemales) {
      errors.push(
        `Not enough female kid players. Need ${requiredFemales}, have ${kidFemales.length}`
      )
    }
  } else {
    // KIDS no gender restriction
    const kids = playerCategories.filter((p) => p.derivedCategory === "KID")
    let requiredKids: number

    if (allowPlayerReuse) {
      const kidNeeds: number[] = []
      if (format.kidsDoublesCount > 0) kidNeeds.push(2)
      if (format.kidsSinglesCount > 0) kidNeeds.push(1)
      requiredKids = kidNeeds.length > 0 ? Math.max(...kidNeeds) : 0
    } else {
      requiredKids = format.kidsSinglesCount + format.kidsDoublesCount * 2
    }

    if (kids.length < requiredKids) {
      errors.push(
        `Not enough kid players. Need ${requiredKids}, have ${kids.length}`
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

export function isDoublesFixture(fixtureType: string): boolean {
  return [
    "MEN_DOUBLES",
    "WOMEN_DOUBLES",
    "MIXED_DOUBLES",
    "KIDS_DOUBLES",
  ].includes(fixtureType)
}

export function getFixtureRequirements(fixtureType: string): {
  playersPerTeam: number
  label: string
  genderRequirement: string | null
} {
  const doubles = isDoublesFixture(fixtureType)
  const playersPerTeam = doubles ? 2 : 1

  const map: Record<string, { label: string; genderRequirement: string | null }> = {
    MEN_DOUBLES: { label: "Men's Doubles", genderRequirement: "MALE" },
    WOMEN_DOUBLES: { label: "Women's Doubles", genderRequirement: "FEMALE" },
    MIXED_DOUBLES: { label: "Mixed Doubles", genderRequirement: "MIXED" },
    MEN_SINGLES: { label: "Men's Singles", genderRequirement: "MALE" },
    WOMEN_SINGLES: { label: "Women's Singles", genderRequirement: "FEMALE" },
    KIDS_SINGLES: { label: "Kids Singles", genderRequirement: null },
    KIDS_DOUBLES: { label: "Kids Doubles", genderRequirement: null },
  }

  return { playersPerTeam, ...map[fixtureType] }
}

// Get the required gender for a player slot in a fixture type
// For MIXED_DOUBLES: player1 = MALE, player2 = FEMALE
function getRequiredGender(
  fixtureType: string,
  slot: "player1" | "player2"
): string | null {
  switch (fixtureType) {
    case "MEN_DOUBLES":
    case "MEN_SINGLES":
      return "MALE"
    case "WOMEN_DOUBLES":
    case "WOMEN_SINGLES":
      return "FEMALE"
    case "MIXED_DOUBLES":
      return slot === "player1" ? "MALE" : "FEMALE"
    default:
      return null // KIDS_SINGLES, KIDS_DOUBLES — no gender requirement
  }
}

export function validateFixtureAssignment(
  fixtureType: string,
  teamAPlayer1Id: string | null,
  teamAPlayer2Id: string | null,
  teamBPlayer1Id: string | null,
  teamBPlayer2Id: string | null,
  teamAPlayers: TeamPlayer[],
  teamBPlayers: TeamPlayer[],
  existingAssignments: {
    fixtureId: string
    teamAPlayer1Id: string | null
    teamAPlayer2Id: string | null
    teamBPlayer1Id: string | null
    teamBPlayer2Id: string | null
  }[],
  currentFixtureId: string,
  category?: "ADULT" | "KIDS",
  genderRestriction?: boolean | null,
  allowPlayerReuse?: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const doubles = isDoublesFixture(fixtureType)

  // Check required players provided
  if (!teamAPlayer1Id) errors.push("Team A Player 1 is required")
  if (!teamBPlayer1Id) errors.push("Team B Player 1 is required")
  if (doubles) {
    if (!teamAPlayer2Id) errors.push("Team A Player 2 is required for doubles")
    if (!teamBPlayer2Id) errors.push("Team B Player 2 is required for doubles")
  }

  if (errors.length > 0) return { valid: false, errors }

  // Check players belong to correct teams
  const teamAPlayerMap = new Map(teamAPlayers.map((p) => [p.playerId, p]))
  const teamBPlayerMap = new Map(teamBPlayers.map((p) => [p.playerId, p]))

  const assignedTeamA = [teamAPlayer1Id, teamAPlayer2Id].filter(Boolean) as string[]
  const assignedTeamB = [teamBPlayer1Id, teamBPlayer2Id].filter(Boolean) as string[]

  for (const pid of assignedTeamA) {
    if (!teamAPlayerMap.has(pid)) {
      errors.push(`Player ${pid} does not belong to Team A`)
    }
  }
  for (const pid of assignedTeamB) {
    if (!teamBPlayerMap.has(pid)) {
      errors.push(`Player ${pid} does not belong to Team B`)
    }
  }

  // Gender validation
  // ADULT: always enforce. KIDS: only if genderRestriction is true.
  const enforceGender =
    category === "ADULT" || (category === "KIDS" && genderRestriction === true)

  if (enforceGender) {
    const checkGender = (
      playerId: string | null,
      playerMap: Map<string, TeamPlayer>,
      slot: "player1" | "player2",
      teamLabel: string
    ) => {
      if (!playerId) return
      const tp = playerMap.get(playerId)
      if (!tp) return
      const requiredGender = getRequiredGender(fixtureType, slot)
      if (requiredGender && tp.player.gender !== requiredGender) {
        errors.push(
          `${teamLabel} ${slot === "player1" ? "Player 1" : "Player 2"} must be ${requiredGender} for ${fixtureType.replace(/_/g, " ")}, but ${tp.player.name} is ${tp.player.gender || "unknown"}`
        )
      }
    }

    checkGender(teamAPlayer1Id, teamAPlayerMap, "player1", "Team A")
    checkGender(teamAPlayer2Id, teamAPlayerMap, "player2", "Team A")
    checkGender(teamBPlayer1Id, teamBPlayerMap, "player1", "Team B")
    checkGender(teamBPlayer2Id, teamBPlayerMap, "player2", "Team B")
  }

  // Check for duplicate assignments in other fixtures (skip if player reuse is allowed)
  if (!allowPlayerReuse) {
    const otherFixtures = existingAssignments.filter((f) => f.fixtureId !== currentFixtureId)
    const allAssignedPlayerIds = new Set<string>()
    for (const f of otherFixtures) {
      if (f.teamAPlayer1Id) allAssignedPlayerIds.add(f.teamAPlayer1Id)
      if (f.teamAPlayer2Id) allAssignedPlayerIds.add(f.teamAPlayer2Id)
      if (f.teamBPlayer1Id) allAssignedPlayerIds.add(f.teamBPlayer1Id)
      if (f.teamBPlayer2Id) allAssignedPlayerIds.add(f.teamBPlayer2Id)
    }

    for (const pid of [...assignedTeamA, ...assignedTeamB]) {
      if (allAssignedPlayerIds.has(pid)) {
        errors.push(`Player ${pid} is already assigned to another fixture`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
