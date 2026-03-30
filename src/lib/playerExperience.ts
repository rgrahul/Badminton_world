import { z } from "zod"

export const EXPERIENCE_MAX_LEN = 2000

/** Free-text experience; accepts legacy numeric JSON as string. Empty → null. */
export const optionalExperienceSchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined
    if (v === null) return null
    const s = typeof v === "number" && !Number.isNaN(v) ? String(v) : String(v).trim()
    if (s === "") return null
    return s.length > EXPERIENCE_MAX_LEN ? s.slice(0, EXPERIENCE_MAX_LEN) : s
  })
