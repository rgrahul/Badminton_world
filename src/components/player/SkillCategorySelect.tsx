"use client"

import type { SkillCategory } from "@prisma/client"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SKILL_CATEGORY_VALUES, SKILL_CATEGORY_LABELS } from "@/lib/skillCategory"

type Props = {
  id?: string
  label?: string
  labelClassName?: string
  triggerClassName?: string
  value: SkillCategory | "" | null | undefined
  onChange: (v: SkillCategory | null) => void
  disabled?: boolean
  className?: string
}

export function SkillCategorySelect({
  id,
  label = "Skill level",
  labelClassName = "text-purple-700 font-semibold",
  triggerClassName = "border-2 focus:border-purple-500",
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const v = value === null || value === undefined || value === "" ? "__none__" : value
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label ? (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      ) : null}
      <Select
        value={v}
        onValueChange={(s) => onChange(s === "__none__" ? null : (s as SkillCategory))}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Not set</SelectItem>
          {SKILL_CATEGORY_VALUES.map((key) => (
            <SelectItem key={key} value={key}>
              {SKILL_CATEGORY_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
