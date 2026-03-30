import { z } from "zod"

export const LAST_PLAYED_MAX_LEN = 500

/** Optional free text for when the player last played; empty → null. */
export const optionalLastPlayedSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined
    if (v === null) return null
    const s = String(v).trim()
    if (s === "") return null
    return s.length > LAST_PLAYED_MAX_LEN ? s.slice(0, LAST_PLAYED_MAX_LEN) : s
  })
