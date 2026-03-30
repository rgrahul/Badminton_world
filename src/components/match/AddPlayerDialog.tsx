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
    experience: "",
    lastPlayed: "",
    skillCategory: null as SkillCategory | null,
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
        experience: "",
        lastPlayed: "",
        skillCategory: null,
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
        experience:
          formData.experience.trim() === "" ? null : formData.experience.trim().slice(0, EXPERIENCE_MAX_LEN),
        lastPlayed:
          formData.lastPlayed.trim() === "" ? null : formData.lastPlayed.trim().slice(0, LAST_PLAYED_MAX_LEN),
        skillCategory: formData.skillCategory,
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dialog-experience">Experience</Label>
              <Textarea
                id="dialog-experience"
                value={formData.experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience: e.target.value.slice(0, EXPERIENCE_MAX_LEN),
                  })
                }
                placeholder="e.g. 5+ years club"
                maxLength={EXPERIENCE_MAX_LEN}
                rows={2}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dialog-lastPlayed">Last played (badminton)</Label>
              <Textarea
                id="dialog-lastPlayed"
                value={formData.lastPlayed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastPlayed: e.target.value.slice(0, LAST_PLAYED_MAX_LEN),
                  })
                }
                placeholder="e.g. March 2025"
                maxLength={LAST_PLAYED_MAX_LEN}
                rows={2}
              />
            </div>

            <SkillCategorySelect
              id="dialog-skillCategory"
              label="Skill level"
              labelClassName=""
              triggerClassName=""
              value={formData.skillCategory}
              onChange={(v) => setFormData({ ...formData, skillCategory: v })}
            />
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
