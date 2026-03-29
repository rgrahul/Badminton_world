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
  /** When `roster`, only players already selected for the team. When `allPlayers`, full player directory (auction / empty roster). */
  mode?: "roster" | "allPlayers"
  selectedPlayerIds: string[]
  value: string | null
  onChange: (captainId: string | null) => void
  disabled?: boolean
  id?: string
}

export function TeamCaptainSelect({
  mode = "roster",
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

  const options =
    mode === "allPlayers" ?
      [...players].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    : roster

  const v = value && options.some((p) => p.id === value) ? value : "__none__"

  const emptyOptions = options.length === 0
  const placeholder =
    emptyOptions ?
      mode === "allPlayers" ?
        "Loading players…"
      : "Select players first"
    : "No captain"

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-amber-800 font-semibold">
        Team captain
      </Label>
      <Select
        value={v}
        onValueChange={(s) => onChange(s === "__none__" ? null : s)}
        disabled={disabled || emptyOptions}
      >
        <SelectTrigger id={id} className="border-2 border-amber-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No captain</SelectItem>
          {options.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {mode === "allPlayers" ?
          "Choose any player as captain (roster can be filled later via auction). Captains are not in the auction pool."
        : "Captain must be on this team’s roster. Captains are not in the auction pool for this tournament."}
      </p>
    </div>
  )
}
