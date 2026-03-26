"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

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

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
}

interface AddPlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlayerAdded: (player: Player) => void
  initialName?: string
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  onPlayerAdded,
  initialName,
}: AddPlayerDialogProps) {
  const { alert } = useAlertDialog()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: initialName || "",
    email: "",
    mobileNumber: "",
    age: "",
    gender: "",
    yearsOfExperience: "",
    skillRating: "",
  })

  // Reset form when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        name: "",
        email: "",
        mobileNumber: "",
        age: "",
        gender: "",
        yearsOfExperience: "",
        skillRating: "",
      })
    } else if (initialName) {
      setFormData((prev) => ({ ...prev, name: initialName }))
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert("Player name is required")
      return
    }

    try {
      setIsSubmitting(true)

      const playerData: any = {
        name: formData.name,
        email: formData.email || null,
        mobileNumber: formData.mobileNumber || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        skillRating: formData.skillRating ? parseInt(formData.skillRating) : null,
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
        onPlayerAdded(data.data.player)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create player")
      }
    } catch (error) {
      console.error("Create player error:", error)
      alert("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>Create a new player profile quickly</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="dialog-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dialog-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter player name"
              required
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-email">Email</Label>
              <Input
                id="dialog-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="player@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-mobileNumber">Mobile Number</Label>
              <Input
                id="dialog-mobileNumber"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-age">Age</Label>
              <Input
                id="dialog-age"
                type="number"
                min="1"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
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

          {/* Experience and Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-yearsOfExperience">Years of Experience</Label>
              <Input
                id="dialog-yearsOfExperience"
                type="number"
                min="0"
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-skillRating">Skill Rating (1-100)</Label>
              <Input
                id="dialog-skillRating"
                type="number"
                min="1"
                max="100"
                value={formData.skillRating}
                onChange={(e) => setFormData({ ...formData, skillRating: e.target.value })}
                placeholder="75"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Player"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
