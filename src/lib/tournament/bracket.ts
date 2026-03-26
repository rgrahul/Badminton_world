type KnockoutRoundType =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "FINAL"

export interface BracketSlot {
  round: KnockoutRoundType
  matchNumber: number
  teamASourceMatchNumber?: number // match number in previous round feeding teamA
  teamBSourceMatchNumber?: number // match number in previous round feeding teamB
  teamASourceLabel?: string
  teamBSourceLabel?: string
}

export interface Seeding {
  matchNumber: number // first-round match number
  slot: "A" | "B"
  teamId: string
  label?: string
}

const ROUND_ORDER: KnockoutRoundType[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
]

/**
 * Returns the smallest power of 2 >= teamCount
 */
export function bracketSize(teamCount: number): number {
  let size = 2
  while (size < teamCount) {
    size *= 2
  }
  return size
}

/**
 * Returns the ordered list of rounds needed for a given team count.
 */
export function getRounds(teamCount: number): KnockoutRoundType[] {
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

/**
 * Build the bracket skeleton with source references.
 * matchNumber is 1-indexed per round.
 */
export function generateBracketStructure(teamCount: number): BracketSlot[] {
  const rounds = getRounds(teamCount)
  const slots: BracketSlot[] = []

  let matchesInRound = bracketSize(teamCount) / 2

  for (let r = 0; r < rounds.length; r++) {
    const round = rounds[r]
    const prevRound = r > 0 ? rounds[r - 1] : null

    for (let m = 1; m <= matchesInRound; m++) {
      const slot: BracketSlot = {
        round,
        matchNumber: m,
      }

      if (prevRound) {
        // Each match in this round is fed by two matches in previous round
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

function formatRoundShort(round: KnockoutRoundType): string {
  switch (round) {
    case "ROUND_OF_32": return "R32"
    case "ROUND_OF_16": return "R16"
    case "QUARTER_FINAL": return "QF"
    case "SEMI_FINAL": return "SF"
    case "FINAL": return "F"
  }
}

export interface GroupStanding {
  teamId: string
  teamName: string
  groupIndex: number // 0-based
  position: number // 1-based within group
}

/**
 * Cross-group seeding: A1 vs B2, B1 vs A2 pattern.
 * For more groups, distributes seeds to avoid same-group clashes in first round.
 */
export function crossGroupSeeding(
  groupStandings: GroupStanding[][],
  qualifyPerGroup: number
): Seeding[] {
  const seedings: Seeding[] = []
  const qualifiers: GroupStanding[] = []

  // Collect all qualifiers ordered by position then group
  for (let pos = 1; pos <= qualifyPerGroup; pos++) {
    for (const group of groupStandings) {
      const team = group.find((s) => s.position === pos)
      if (team) qualifiers.push(team)
    }
  }

  const totalTeams = qualifiers.length
  const size = bracketSize(totalTeams)
  const firstRoundMatches = size / 2

  // Standard seeding: place qualifiers into bracket slots
  // Top seeds (position 1) vs bottom seeds (last position)
  // Using a simple cross-group pattern:
  // Match 1: Group A #1 vs Group B #2 (or last qualifier)
  // Match 2: Group B #1 vs Group A #2
  // etc.
  const numGroups = groupStandings.length

  if (numGroups === 2 && qualifyPerGroup <= 2) {
    // Simple A1 vs B2, B1 vs A2
    const a1 = groupStandings[0].find((s) => s.position === 1)
    const a2 = groupStandings[0].find((s) => s.position === 2)
    const b1 = groupStandings[1].find((s) => s.position === 1)
    const b2 = groupStandings[1].find((s) => s.position === 2)

    if (a1 && b2) {
      seedings.push({ matchNumber: 1, slot: "A", teamId: a1.teamId, label: `Group ${String.fromCharCode(65 + a1.groupIndex)} #1` })
      seedings.push({ matchNumber: 1, slot: "B", teamId: b2.teamId, label: `Group ${String.fromCharCode(65 + b2.groupIndex)} #2` })
    }
    if (b1 && a2) {
      seedings.push({ matchNumber: 2, slot: "A", teamId: b1.teamId, label: `Group ${String.fromCharCode(65 + b1.groupIndex)} #1` })
      seedings.push({ matchNumber: 2, slot: "B", teamId: a2.teamId, label: `Group ${String.fromCharCode(65 + a2.groupIndex)} #2` })
    }
  } else {
    // General case: interleave top seeds vs bottom seeds
    // Sort qualifiers: #1 seeds first (by group order), then #2 seeds, etc.
    const topHalf: GroupStanding[] = []
    const bottomHalf: GroupStanding[] = []

    for (let i = 0; i < qualifiers.length; i++) {
      if (i < qualifiers.length / 2) {
        topHalf.push(qualifiers[i])
      } else {
        bottomHalf.push(qualifiers[i])
      }
    }

    // Reverse bottom half for cross seeding
    bottomHalf.reverse()

    for (let i = 0; i < Math.min(firstRoundMatches, topHalf.length); i++) {
      const top = topHalf[i]
      const bottom = bottomHalf[i]

      if (top) {
        seedings.push({
          matchNumber: i + 1,
          slot: "A",
          teamId: top.teamId,
          label: `Group ${String.fromCharCode(65 + top.groupIndex)} #${top.position}`,
        })
      }
      if (bottom) {
        seedings.push({
          matchNumber: i + 1,
          slot: "B",
          teamId: bottom.teamId,
          label: `Group ${String.fromCharCode(65 + bottom.groupIndex)} #${bottom.position}`,
        })
      }
    }
  }

  return seedings
}
