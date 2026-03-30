"use client"

import { useState, useEffect } from "react"

import { useRouter } from "next/navigation"

import { Header } from "@/components/layout/Header"

import { Button } from "@/components/ui/button"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import type { SkillCategory } from "@prisma/client"
import { SkillCategorySelect } from "@/components/player/SkillCategorySelect"
import { Textarea } from "@/components/ui/textarea"
import { EXPERIENCE_MAX_LEN } from "@/lib/playerExperience"
import { LAST_PLAYED_MAX_LEN } from "@/lib/playerLastPlayed"

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  experience?: string | null
  lastPlayed?: string | null
  skillCategory?: SkillCategory | null
  profilePhoto?: string | null
}

export default function EditPlayerPage({ params }: { params: { playerId: string } }) {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    age: "",
    gender: "",
    experience: "",
    lastPlayed: "",
    skillCategory: null as SkillCategory | null,
    profilePhoto: "",
  })
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    fetchPlayer()
  }, [params.playerId])

  const fetchPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${params.playerId}`)
      const data = await response.json()

      if (response.ok) {
        const player: Player = data.data.player
        setFormData({
          name: player.name,
          email: player.email || "",
          mobileNumber: player.mobileNumber || "",
          age: player.age?.toString() || "",
          gender: player.gender || "",
          experience: player.experience ?? "",
          lastPlayed: player.lastPlayed ?? "",
          skillCategory: player.skillCategory ?? null,
          profilePhoto: player.profilePhoto || "",
        })
        setPreviewUrl(player.profilePhoto || "")
      }
    } catch (error) {
      console.error("Fetch player error:", error)
      alert("Failed to load player", "Error")
    } finally {
      setLoading(false)
    }
  }

  const convertGoogleDriveUrl = (url: string): string => {
    // Handle various Google Drive URL formats
    // Extract FILE_ID from different Google Drive URL patterns

    // Format 1: https://drive.google.com/file/d/FILE_ID/view...
    let match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      // Use thumbnail format which works better for embedding
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    }

    // Format 2: https://drive.google.com/open?id=FILE_ID
    match = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    }

    // Format 3: https://drive.google.com/uc?export=...&id=FILE_ID
    match = url.match(/drive\.google\.com\/uc\?.*[&?]id=([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    }

    // Format 4: Extract just the ID if pasted
    match = url.match(/^([a-zA-Z0-9_-]{25,})$/)
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
    }

    // If not a Google Drive URL, return as-is
    return url
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file", "Invalid File")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB", "File Too Large")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData({ ...formData, profilePhoto: base64String })
      setPreviewUrl(base64String)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert("Player name is required", "Validation Error")
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data with proper types
      const playerData: any = {
        name: formData.name,
        email: formData.email || null,
        mobileNumber: formData.mobileNumber || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        experience:
          formData.experience.trim() === "" ? null : formData.experience.trim().slice(0, EXPERIENCE_MAX_LEN),
        lastPlayed:
          formData.lastPlayed.trim() === "" ? null : formData.lastPlayed.trim().slice(0, LAST_PLAYED_MAX_LEN),
        skillCategory: formData.skillCategory,
        profilePhoto: formData.profilePhoto || null,
      }

      const response = await fetch(`/api/players/${params.playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerData),
      })

      if (response.ok) {
        router.push(`/players/${params.playerId}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update player", "Error")
      }
    } catch (error) {
      console.error("Update player error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading player...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <span className="text-4xl">✏️</span>
              Edit Player
            </CardTitle>
            <CardDescription className="text-base text-gray-600 font-medium">Update player profile information</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name - Required */}
              <div className="space-y-2 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <Label htmlFor="name" className="text-yellow-800 font-bold flex items-center gap-1">
                  <span>✨</span> Player Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter player name"
                  required
                  className="border-2 focus:border-yellow-500"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-800 flex items-center gap-2 text-lg">
                  <span>📞</span> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-700 font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
                      className="border-2 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-blue-700 font-semibold">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="+1234567890"
                      className="border-2 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-bold text-green-800 flex items-center gap-2 text-lg">
                  <span>🎂</span> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-green-700 font-semibold">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="border-2 focus:border-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-green-700 font-semibold">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="border-2 focus:border-green-500">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">👨 Male</SelectItem>
                        <SelectItem value="FEMALE">👩 Female</SelectItem>
                        <SelectItem value="OTHER">🧑 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Experience and Rating */}
              <div className="space-y-4 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-800 flex items-center gap-2 text-lg">
                  <span>⭐</span> Experience and skill level
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="experience" className="text-purple-700 font-semibold">
                      Experience
                    </Label>
                    <Textarea
                      id="experience"
                      value={formData.experience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experience: e.target.value.slice(0, EXPERIENCE_MAX_LEN),
                        })
                      }
                      placeholder="e.g. 5+ years club play, state junior 2019"
                      maxLength={EXPERIENCE_MAX_LEN}
                      rows={3}
                      className="border-2 focus:border-purple-500 resize-y min-h-[80px]"
                    />
                    <p className="text-xs text-purple-600">Free text, up to {EXPERIENCE_MAX_LEN} characters.</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="lastPlayed" className="text-purple-700 font-semibold">
                      Last played (badminton)
                    </Label>
                    <Textarea
                      id="lastPlayed"
                      value={formData.lastPlayed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lastPlayed: e.target.value.slice(0, LAST_PLAYED_MAX_LEN),
                        })
                      }
                      placeholder="e.g. March 2025, Sunday league"
                      maxLength={LAST_PLAYED_MAX_LEN}
                      rows={2}
                      className="border-2 focus:border-purple-500 resize-y min-h-[64px]"
                    />
                    <p className="text-xs text-purple-600">Optional. When they last played, up to {LAST_PLAYED_MAX_LEN} characters.</p>
                  </div>

                  <SkillCategorySelect
                    id="skillCategory"
                    value={formData.skillCategory}
                    onChange={(v) => setFormData({ ...formData, skillCategory: v })}
                  />
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <Label className="text-gray-800 font-bold flex items-center gap-1">
                  <span>📷</span> Profile Photo
                </Label>

                {/* Photo Preview */}
                {previewUrl && !imageError && (
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-200 shadow-lg">
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                      />
                    </div>
                  </div>
                )}
                {imageError && previewUrl && (
                  <div className="flex justify-center">
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      ⚠️ Unable to load image. Please check the URL or try uploading a file instead.
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="space-y-2">
                  <Input
                    id="profilePhotoFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="border-2 focus:border-gray-500"
                  />
                  <p className="text-xs text-gray-600 font-medium">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF, WebP
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    💡 Tip: For Google Drive, make sure the file is set to "Anyone with the link can view"
                  </p>
                </div>

                {/* Or URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="profilePhoto" className="text-sm text-gray-700">
                    Or enter photo URL or Google Drive File ID
                  </Label>
                  <Input
                    id="profilePhoto"
                    value={formData.profilePhoto.startsWith("data:") ? "" : formData.profilePhoto}
                    onChange={(e) => {
                      const url = e.target.value
                      const convertedUrl = convertGoogleDriveUrl(url)
                      setFormData({ ...formData, profilePhoto: convertedUrl })
                      setPreviewUrl(convertedUrl)
                      setImageError(false)
                    }}
                    placeholder="URL, Google Drive link, or just the File ID"
                    className="border-2 focus:border-gray-500"
                  />
                  {formData.profilePhoto && formData.profilePhoto.includes('drive.google.com') && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                      ℹ️ Using: <code className="bg-white px-1 py-0.5 rounded text-xs">{formData.profilePhoto}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/players/${params.playerId}`)}
                  className="flex-1 border-2 hover:bg-gray-50 font-semibold"
                >
                  ❌ Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-bold">
                  {isSubmitting ? "Updating... ⏳" : "✅ Update Player"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
