import type { SkillCategory } from "@prisma/client"
import { z } from "zod"

export const SKILL_CATEGORY_VALUES = [
  "BEGINNER",
  "INTERMEDIATE",
  "INTERMEDIATE_PLUS",
  "ADVANCED",
] as const satisfies readonly SkillCategory[]

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  INTERMEDIATE_PLUS: "Intermediate+",
  ADVANCED: "Advanced",
}

export function skillCategoryLabel(value: SkillCategory | null | undefined): string {
  if (value == null) return ""
  return SKILL_CATEGORY_LABELS[value] ?? value
}

/** Tailwind bg/text for pills (pair with rounded-full, font-medium, etc.) */
export const SKILL_CATEGORY_BADGE_CLASSES: Record<SkillCategory, string> = {
  BEGINNER: "bg-teal-100 text-teal-900",
  INTERMEDIATE: "bg-sky-100 text-sky-900",
  INTERMEDIATE_PLUS: "bg-fuchsia-100 text-fuchsia-900",
  ADVANCED: "bg-amber-100 text-amber-950",
}

export function skillCategoryBadgeClassName(value: SkillCategory | null | undefined): string {
  if (value == null) return "bg-muted text-muted-foreground"
  return SKILL_CATEGORY_BADGE_CLASSES[value] ?? "bg-slate-100 text-slate-800"
}

/** UI filter on auction dashboards: all players or a specific tier */
export type SkillCategoryFilter = "ALL" | SkillCategory

export const SKILL_CATEGORY_FILTER_OPTIONS: SkillCategoryFilter[] = [
  "ALL",
  ...SKILL_CATEGORY_VALUES,
]

export function skillCategoryFilterLabel(value: SkillCategoryFilter): string {
  if (value === "ALL") return "All"
  return skillCategoryLabel(value)
}

export function matchesSkillCategoryFilter(
  filter: SkillCategoryFilter,
  skillCategory: SkillCategory | string | null | undefined
): boolean {
  if (filter === "ALL") return true
  return skillCategory === filter
}

const NORMALIZE = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")

/** Accepts Prisma enum strings or import labels like "Intermediate+". */
export function parseSkillCategory(raw: unknown): SkillCategory | null {
  if (raw === null || raw === undefined) return null
  const s = String(raw).trim()
  if (!s) return null
  const upper = s.toUpperCase().replace(/\s+/g, "_").replace(/\+/g, "_PLUS")
  if (upper === "INTERMEDIATE_PLUS" || upper === "INTERMEDIATE+") return "INTERMEDIATE_PLUS"
  if (SKILL_CATEGORY_VALUES.includes(upper as SkillCategory)) return upper as SkillCategory
  const n = NORMALIZE(s)
  if (n === "beginner") return "BEGINNER"
  if (n === "intermediate") return "INTERMEDIATE"
  if (n === "intermediate+" || n === "intermediate plus") return "INTERMEDIATE_PLUS"
  if (n === "advanced") return "ADVANCED"
  const nNum = parseInt(s, 10)
  if (!Number.isNaN(nNum)) {
    if (nNum <= 25) return "BEGINNER"
    if (nNum <= 50) return "INTERMEDIATE"
    if (nNum <= 75) return "INTERMEDIATE_PLUS"
    return "ADVANCED"
  }
  return null
}

/** For `z.enum([...])` in API routes */
export const SKILL_CATEGORY_ZOD_VALUES = [
  "BEGINNER",
  "INTERMEDIATE",
  "INTERMEDIATE_PLUS",
  "ADVANCED",
] as const

export const skillCategoryEnumSchema = z.enum(SKILL_CATEGORY_ZOD_VALUES)

/** Accepts enum strings, labels, or legacy 1–100 numbers from spreadsheets */
export const optionalImportedSkillCategorySchema = z
  .union([skillCategoryEnumSchema, z.string(), z.number()])
  .optional()
  .nullable()
  .transform((v) => parseSkillCategory(v))
