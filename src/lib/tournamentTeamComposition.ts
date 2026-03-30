/** Roster targets stored on `Tournament` for every team in the event. */
export type TournamentTeamComposition = {
  teamRequiredMale: number
  teamRequiredFemale: number
  teamRequiredKid: number
}

export function compositionTeamSize(c: TournamentTeamComposition): number {
  return c.teamRequiredMale + c.teamRequiredFemale + c.teamRequiredKid
}

export function compositionRulesFromTournament(c: TournamentTeamComposition) {
  return {
    requiredMale: c.teamRequiredMale,
    requiredFemale: c.teamRequiredFemale,
    requiredKid: c.teamRequiredKid,
  }
}
