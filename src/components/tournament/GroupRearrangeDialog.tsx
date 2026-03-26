"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Group {
  id: string
  name: string
  groupTeams: {
    teamId: string
    team: { id: string; name: string }
  }[]
}

interface GroupRearrangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: Group[]
  tournamentId: string
  onSaved: () => void
}

export function GroupRearrangeDialog({
  open,
  onOpenChange,
  groups,
  tournamentId,
  onSaved,
}: GroupRearrangeDialogProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const group of groups) {
      for (const gt of group.groupTeams) {
        map[gt.teamId] = group.id
      }
    }
    return map
  })
  const [saving, setSaving] = useState(false)

  const allTeams = groups.flatMap((g) =>
    g.groupTeams.map((gt) => ({ teamId: gt.teamId, teamName: gt.team.name }))
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const assignmentArray = Object.entries(assignments).map(([teamId, groupId]) => ({
        teamId,
        groupId,
      }))

      const response = await fetch(
        `/api/tournaments/${tournamentId}/groups/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: assignmentArray }),
        }
      )

      if (response.ok) {
        onSaved()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Failed to save assignments:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rearrange Teams</DialogTitle>
          <DialogDescription>
            Assign each team to a group using the dropdown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {allTeams.map(({ teamId, teamName }) => (
            <div key={teamId} className="flex items-center justify-between gap-4">
              <span className="font-medium text-sm truncate flex-1">{teamName}</span>
              <select
                value={assignments[teamId] || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({ ...prev, [teamId]: e.target.value }))
                }
                className="px-3 py-1.5 border rounded-md text-sm bg-white"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
