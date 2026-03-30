import { z } from "zod"

export const KEY_STRENGTH_MAX_LEN = 500

/** Optional free text: key strength or shot; empty → null. */
export const optionalKeyStrengthSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined
    if (v === null) return null
    const s = String(v).trim()
    if (s === "") return null
    return s.length > KEY_STRENGTH_MAX_LEN ? s.slice(0, KEY_STRENGTH_MAX_LEN) : s
  })
