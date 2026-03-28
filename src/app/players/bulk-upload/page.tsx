"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import * as XLSX from "xlsx"

interface ParsedPlayer {
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: "MALE" | "FEMALE" | "OTHER" | null
  yearsOfExperience?: number | null
  skillRating?: number | null
  profilePhoto?: string | null
}

export default function BulkUploadPage() {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedPlayers, setParsedPlayers] = useState<ParsedPlayer[]>([])
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(
    null
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
      setParsedPlayers([])
    }
  }

  const parseExcelFile = async (file: File): Promise<ParsedPlayer[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          const players: ParsedPlayer[] = jsonData.map((row: any) => {
            // Normalize gender value
            let gender: "MALE" | "FEMALE" | "OTHER" | null = null
            if (row.gender || row.Gender) {
              const genderValue = (row.gender || row.Gender).toString().toUpperCase()
              if (genderValue === "MALE" || genderValue === "M") gender = "MALE"
              else if (genderValue === "FEMALE" || genderValue === "F") gender = "FEMALE"
              else if (genderValue === "OTHER" || genderValue === "O") gender = "OTHER"
            }

            return {
              name: row.name || row.Name || "",
              email: row.email || row.Email || null,
              mobileNumber:
                row.mobileNumber || row.MobileNumber || row.mobile || row.Mobile || null,
              age: row.age || row.Age ? parseInt(row.age || row.Age) : null,
              gender,
              yearsOfExperience:
                row.yearsOfExperience || row.YearsOfExperience || row.experience || row.Experience
                  ? parseInt(
                      row.yearsOfExperience ||
                        row.YearsOfExperience ||
                        row.experience ||
                        row.Experience
                    )
                  : null,
              skillRating:
                row.skillRating || row.SkillRating || row.rating || row.Rating
                  ? parseInt(row.skillRating || row.SkillRating || row.rating || row.Rating)
                  : null,
              profilePhoto: row.profilePhoto || row.ProfilePhoto || row.photo || row.Photo || null,
            }
          })

          // Filter out rows without names
          const validPlayers = players.filter((p) => p.name && p.name.trim() !== "")

          resolve(validPlayers)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsBinaryString(file)
    })
  }

  const handleParseFile = async () => {
    if (!file) {
      alert("Please select a file first", "No File Selected")
      return
    }

    try {
      setIsProcessing(true)
      const players = await parseExcelFile(file)

      if (players.length === 0) {
        alert(
          "No valid players found in the file. Make sure the 'name' column is present.",
          "Parse Error"
        )
        return
      }

      setParsedPlayers(players)
      setUploadResult({
        success: true,
        message: `Successfully parsed ${players.length} players from the file`,
      })
    } catch (error) {
      console.error("Parse error:", error)
      alert("Failed to parse Excel file. Please check the file format.", "Parse Error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (parsedPlayers.length === 0) {
      alert("Please parse the file first", "No Data")
      return
    }

    try {
      setIsProcessing(true)

      const response = await fetch("/api/players/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ players: parsedPlayers }),
      })

      const data = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: data.data.message || `Successfully uploaded ${parsedPlayers.length} players`,
        })
        setTimeout(() => {
          router.push("/players")
        }, 2000)
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Failed to upload players",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadResult({
        success: false,
        message: "An error occurred during upload",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    // Create a sample template
    const template = [
      {
        name: "John Doe",
        email: "john@example.com",
        mobileNumber: "+1234567890",
        age: 25,
        gender: "MALE",
        yearsOfExperience: 5,
        skillRating: 75,
        profilePhoto: "",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        mobileNumber: "+0987654321",
        age: 28,
        gender: "FEMALE",
        yearsOfExperience: 7,
        skillRating: 85,
        profilePhoto: "",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Players")

    XLSX.writeFile(workbook, "players_template.xlsx")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/players")}>
            ← Back to Players
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Upload Players</CardTitle>
            <CardDescription>Upload an Excel file to add multiple players at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Download Template */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Download Template</h3>
                  <p className="text-sm text-blue-800">
                    Download a sample Excel template with the correct column format
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  📥 Download Template
                </Button>
              </div>
            </div>

            {/* File Format Instructions */}
            <div className="space-y-2">
              <h3 className="font-semibold">Required Excel Columns:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>
                  <strong>name</strong> (required) - Player name
                </li>
                <li>email (optional) - Valid email address</li>
                <li>mobileNumber (optional) - Mobile number</li>
                <li>age (optional) - Age as number</li>
                <li>gender (optional) - MALE, FEMALE, or OTHER</li>
                <li>yearsOfExperience (optional) - Years as number</li>
                <li>skillRating (optional) - Rating from 1-100</li>
                <li>profilePhoto (optional) - URL or base64 string</li>
              </ul>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Upload Excel File</Label>
              <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Parse Button */}
            <div>
              <Button onClick={handleParseFile} disabled={!file || isProcessing} className="w-full">
                {isProcessing ? "Processing..." : "Parse File"}
              </Button>
            </div>

            {/* Parsed Players Preview */}
            {parsedPlayers.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Preview ({parsedPlayers.length} players)</h3>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Mobile</th>
                        <th className="px-3 py-2 text-left">Age</th>
                        <th className="px-3 py-2 text-left">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPlayers.slice(0, 50).map((player, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{player.name}</td>
                          <td className="px-3 py-2 truncate max-w-[150px]">
                            {player.email || "-"}
                          </td>
                          <td className="px-3 py-2">{player.mobileNumber || "-"}</td>
                          <td className="px-3 py-2">{player.age || "-"}</td>
                          <td className="px-3 py-2">{player.gender || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedPlayers.length > 50 && (
                    <div className="text-center py-2 text-xs text-muted-foreground bg-gray-50">
                      Showing first 50 of {parsedPlayers.length} players
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Uploading..." : `Upload ${parsedPlayers.length} Players`}
                </Button>
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div
                className={`p-4 rounded-lg ${
                  uploadResult.success
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {uploadResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
