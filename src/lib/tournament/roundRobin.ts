/**
 * Generate all round-robin pairings for a list of team IDs.
 * Returns N*(N-1)/2 unique pairs.
 */
export function generateRoundRobinPairings(teamIds: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  return pairs
}
