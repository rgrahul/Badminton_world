"use client"

import type { SkillCategory } from "@prisma/client"
import { skillCategoryBadgeClassName, skillCategoryLabel } from "@/lib/skillCategory"

type Props = {
  category: SkillCategory | string | null | undefined
  size?: "sm" | "md"
  className?: string
}

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
}

export function SkillCategoryBadge({ category, size = "md", className = "" }: Props) {
  if (category == null || category === "") return null
  const c = category as SkillCategory
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${skillCategoryBadgeClassName(c)} ${className}`.trim()}
    >
      {skillCategoryLabel(c)}
    </span>
  )
}
