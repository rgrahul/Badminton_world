"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TeamRow {
  name: string
  budget: string
}

interface AuctionTeamSetupProps {
  teams: TeamRow[]
  onChange: (teams: TeamRow[]) => void
}

export function AuctionTeamSetup({ teams, onChange }: AuctionTeamSetupProps) {
  const addTeam = () => {
    onChange([...teams, { name: "", budget: "800000" }])
  }

  const removeTeam = (index: number) => {
    onChange(teams.filter((_, i) => i !== index))
  }

  const updateTeam = (index: number, field: keyof TeamRow, value: string) => {
    const updated = [...teams]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Teams ({teams.length})</Label>
        <Button type="button" variant="outline" size="sm" onClick={addTeam}>
          + Add Team
        </Button>
      </div>

      <div className="space-y-2">
        {teams.map((team, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder={`Team ${i + 1} name`}
              value={team.name}
              onChange={(e) => updateTeam(i, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Budget"
              value={team.budget}
              onChange={(e) => updateTeam(i, "budget", e.target.value)}
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeTeam(i)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
            >
              X
            </Button>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No teams added yet. Click &quot;+ Add Team&quot; to start.
        </p>
      )}
    </div>
  )
}
