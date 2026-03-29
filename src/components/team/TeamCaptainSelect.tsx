"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  selectedPlayerIds: string[]
  value: string | null
  onChange: (captainId: string | null) => void
  disabled?: boolean
  id?: string
}

export function TeamCaptainSelect({
  selectedPlayerIds,
  value,
  onChange,
  disabled,
  id = "team-captain",
}: Props) {
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/players?limit=500")
        const data = await res.json()
        if (!cancelled && res.ok && data.data?.players) {
          setPlayers(
            data.data.players.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
          )
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const roster = selectedPlayerIds
    .map((pid) => players.find((p) => p.id === pid))
    .filter((p): p is { id: string; name: string } => Boolean(p))

  const v = value && roster.some((p) => p.id === value) ? value : "__none__"

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-amber-800 font-semibold">
        Team captain
      </Label>
      <Select
        value={v}
        onValueChange={(s) => onChange(s === "__none__" ? null : s)}
        disabled={disabled || roster.length === 0}
      >
        <SelectTrigger id={id} className="border-2 border-amber-200">
          <SelectValue placeholder={roster.length === 0 ? "Select players first" : "No captain"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No captain</SelectItem>
          {roster.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Captains are not included in the auction player pool for this tournament.
      </p>
    </div>
  )
}
