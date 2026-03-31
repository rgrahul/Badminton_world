"use client"

import { useState } from "react"
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

export default function NewPlayerPage() {
  const router = useRouter()
  const { alert } = useAlertDialog()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    age: "",
    gender: "",
    yearsOfExperience: "",
    skillRating: "",
    profilePhoto: "",
  })
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [imageError, setImageError] = useState(false)

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
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        skillRating: formData.skillRating ? parseInt(formData.skillRating) : null,
        profilePhoto: formData.profilePhoto || null,
      }

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(playerData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/players/${data.data.player.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create player", "Error")
      }
    } catch (error) {
      console.error("Create player error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl">
        <Card className="border-white/10 bg-white/[0.03] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-black text-white">
              Add New Player
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-400 font-medium">Create a new player profile</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name - Required */}
              <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
                <Label htmlFor="name" className="text-gray-300 font-bold flex items-center gap-1">
                  Player Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter player name"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4 bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-cyan-400 flex items-center gap-2 text-lg">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300 font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-gray-300 font-semibold">Mobile Number</Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      placeholder="+1234567890"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-lg">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-gray-300 font-semibold">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-gray-300 font-semibold">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Experience and Rating */}
              <div className="space-y-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-purple-400 flex items-center gap-2 text-lg">
                  Experience and Rating
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience" className="text-gray-300 font-semibold">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={(e) =>
                        setFormData({ ...formData, yearsOfExperience: e.target.value })
                      }
                      placeholder="5"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skillRating" className="text-gray-300 font-semibold">Skill Rating (1-100)</Label>
                    <Input
                      id="skillRating"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.skillRating}
                      onChange={(e) => setFormData({ ...formData, skillRating: e.target.value })}
                      placeholder="75"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-4 rounded-lg">
                <Label className="text-white font-bold flex items-center gap-1">
                  Profile Photo
                </Label>

                {/* Photo Preview */}
                {previewUrl && !imageError && (
                  <div className="flex justify-center">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-lg">
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
                    <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      Unable to load image. Please check the URL or try uploading a file instead.
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400 font-medium">
                    Upload an image file (max 5MB). Supported formats: JPG, PNG, GIF, WebP
                  </p>
                  <p className="text-xs text-gray-500 italic">
                    Tip: For Google Drive, make sure the file is set to "Anyone with the link can view"
                  </p>
                </div>

                {/* Or URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="profilePhoto" className="text-sm text-gray-300">
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                  {formData.profilePhoto && formData.profilePhoto.includes('drive.google.com') && (
                    <div className="text-xs text-cyan-400 bg-cyan-500/10 p-2 rounded border border-cyan-500/20">
                      Using: <code className="bg-white/10 px-1 py-0.5 rounded text-xs">{formData.profilePhoto}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/players")} className="flex-1 border border-white/10 hover:bg-white/5 text-gray-300 font-semibold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-lg hover:shadow-xl transition-all">
                  {isSubmitting ? "Creating..." : "Create Player"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
