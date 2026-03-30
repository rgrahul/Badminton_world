"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import * as XLSX from "xlsx"
import type { SkillCategory } from "@prisma/client"
import { parseSkillCategory } from "@/lib/skillCategory"
import { SkillCategoryBadge } from "@/components/player/SkillCategoryBadge"

interface ImportRow {
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  experience?: string | null
  lastPlayed?: string | null
  skillCategory?: SkillCategory | null
  profilePhoto?: string | null
  basePrice: number
}

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (players: ImportRow[]) => void
  importing: boolean
}

const COL_MAP: Record<string, string[]> = {
  name: ["name", "player name", "player", "full name"],
  gender: ["gender", "sex"],
  age: ["age"],
  email: ["email", "email address"],
  mobileNumber: ["mobile", "phone", "mobile number", "contact"],
  skillCategory: ["skill", "skill rating", "rating", "level", "skill category", "skill level"],
  experience: ["experience", "years of experience", "exp", "years"],
  lastPlayed: ["last played", "last played badminton", "last play", "lastplayed"],
  profilePhoto: ["photo", "photo url", "image", "profile photo"],
  basePrice: ["base price", "baseprice", "starting price", "price"],
}

function autoMapColumn(header: string): string | null {
  const normalized = header.toLowerCase().trim()
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    if (aliases.includes(normalized)) return field
  }
  return null
}

function normalizeGender(val: string | undefined | null): string | null {
  if (!val) return null
  const lower = val.toString().toLowerCase().trim()
  if (lower === "m" || lower === "male") return "MALE"
  if (lower === "f" || lower === "female") return "FEMALE"
  return "OTHER"
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "Name",
      "Gender",
      "Age",
      "Email",
      "Mobile Number",
      "Skill level",
      "Experience",
      "Last played",
      "Base Price",
    ],
    ["John Doe", "Male", 28, "john@example.com", "9876543210", "Intermediate+", "5+ yrs club", "March 2025", 50000],
    ["Jane Smith", "Female", 25, "jane@example.com", "9876543211", "Advanced", "3 years league", "2 weeks ago", 60000],
  ])
  XLSX.utils.book_append_sheet(wb, ws, "Players")
  XLSX.writeFile(wb, "auction_players_template.xlsx")
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImport,
  importing,
}: ExcelImportDialogProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [defaultBasePrice, setDefaultBasePrice] = useState("0")

  const reset = () => {
    setStep("upload")
    setRows([])
    setRawHeaders([])
    setFileName("")
  }

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        if (json.length === 0) return

        const headers = Object.keys(json[0])
        setRawHeaders(headers)

        // Map columns
        const colMapping: Record<string, string> = {}
        for (const h of headers) {
          const mapped = autoMapColumn(h)
          if (mapped) colMapping[h] = mapped
        }

        // Build rows
        const basePriceDefault = parseInt(defaultBasePrice) || 0
        const mapped: ImportRow[] = json
          .map((row) => {
            const get = (field: string) => {
              const col = Object.entries(colMapping).find(([, v]) => v === field)?.[0]
              return col ? row[col] : undefined
            }

            const name = get("name")
            if (!name || typeof name !== "string" || !name.trim()) return null

            return {
              name: String(name).trim(),
              email: get("email") ? String(get("email")) : null,
              mobileNumber: get("mobileNumber") ? String(get("mobileNumber")) : null,
              age: get("age") ? parseInt(String(get("age"))) || null : null,
              gender: normalizeGender(get("gender") as string),
              experience: (() => {
                const v = get("experience")
                if (v === undefined || v === null) return null
                const s = String(v).trim()
                return s === "" ? null : s
              })(),
              lastPlayed: (() => {
                const v = get("lastPlayed")
                if (v === undefined || v === null) return null
                const s = String(v).trim()
                return s === "" ? null : s
              })(),
              skillCategory: parseSkillCategory(get("skillCategory")),
              profilePhoto: get("profilePhoto") ? String(get("profilePhoto")) : null,
              basePrice: get("basePrice")
                ? parseFloat(String(get("basePrice"))) || basePriceDefault
                : basePriceDefault,
            }
          })
          .filter(Boolean) as ImportRow[]

        setRows(mapped)
        setStep("preview")
      }
      reader.readAsArrayBuffer(file)
    },
    [defaultBasePrice]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Players from Excel/CSV</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with player data. Columns will be auto-mapped.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Default Base Price:</label>
              <Input
                type="number"
                value={defaultBasePrice}
                onChange={(e) => setDefaultBasePrice(e.target.value)}
                className="w-32"
              />
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.accept = ".xlsx,.xls,.csv"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFile(file)
                }
                input.click()
              }}
            >
              <div className="text-3xl mb-3">📁</div>
              <p className="text-sm text-muted-foreground">
                Drop your Excel/CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports .xlsx, .xls, .csv
              </p>
            </div>
            <div className="text-center">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <span className="font-medium">{fileName}</span>
                {" — "}
                <span className="text-muted-foreground">{rows.length} players found</span>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Choose another file
              </Button>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Gender</th>
                    <th className="px-3 py-2 text-left font-medium">Age</th>
                    <th className="px-3 py-2 text-left font-medium">Skill</th>
                    <th className="px-3 py-2 text-right font-medium">Base Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-1.5 font-medium">{r.name}</td>
                      <td className="px-3 py-1.5">{r.gender || "—"}</td>
                      <td className="px-3 py-1.5">{r.age || "—"}</td>
                      <td className="px-3 py-1.5">
                        {r.skillCategory ? (
                          <SkillCategoryBadge category={r.skillCategory} size="sm" />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">{r.basePrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "preview" && (
            <Button
              onClick={() => onImport(rows)}
              disabled={rows.length === 0 || importing}
            >
              {importing ? "Importing..." : `Import ${rows.length} Players`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
