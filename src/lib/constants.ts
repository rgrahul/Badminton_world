export const KID_AGE_CUTOFF = 18

export type PlayerCategory = "MALE" | "FEMALE" | "KID"

export function derivePlayerCategory(
  age: number | null | undefined,
  gender: string | null | undefined
): PlayerCategory {
  if (age != null && age < KID_AGE_CUTOFF) {
    return "KID"
  }
  if (gender === "FEMALE") {
    return "FEMALE"
  }
  return "MALE"
}
