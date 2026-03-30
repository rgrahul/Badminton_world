"use client"

import { useEffect, useMemo, useState } from "react"
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
  /** Ensures the current captain appears in the list before `/api/players` loads or when they are off-roster but valid (e.g. auction mode). */
  captainPreview?: { id: string; name: string } | null
}

export function TeamCaptainSelect({
  mode = "roster",
  selectedPlayerIds,
  value,
  onChange,
  disabled,
  id = "team-captain",
  captainPreview = null,
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

  const optionsWithCaptain = useMemo(() => {
    if (value && captainPreview?.id === value && !options.some((p) => p.id === value)) {
      return [...options, { id: captainPreview.id, name: captainPreview.name }].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      )
    }
    return options
  }, [options, value, captainPreview])

  const v =
    value && optionsWithCaptain.some((p) => p.id === value) ? value : "__none__"

  const emptyOptions = optionsWithCaptain.length === 0
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
        disabled={disabled || (emptyOptions && !value)}
      >
        <SelectTrigger id={id} className="border-2 border-amber-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No captain</SelectItem>
          {optionsWithCaptain.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {mode === "allPlayers" ?
          "The captain counts toward the tournament squad total (male/female/kid). Roster can be completed later via auction. Captains are excluded from the auction pool."
        : "Pick the captain from this roster — they count as one of the squad spots. Captains are excluded from the auction pool."}
      </p>
    </div>
  )
}
