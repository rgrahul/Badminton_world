"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useAlertDialog } from "@/hooks/useAlertDialog"
import { useRole } from "@/hooks/useRole"
import type { SkillCategory } from "@prisma/client"
import { skillCategoryLabel } from "@/lib/skillCategory"

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  experience?: string | null
  lastPlayed?: string | null
  skillCategory?: string | null
  profilePhoto?: string | null
  createdAt: string
  updatedAt: string
}

export default function PlayerDetailPage({ params }: { params: { playerId: string } }) {
  const router = useRouter()
  const { isAdmin, canManage } = useRole()
  const { alert, confirm, confirmDelete } = useAlertDialog()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPlayer()
  }, [params.playerId])

  const fetchPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${params.playerId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch player")
      }

      setPlayer(data.data.player)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmDelete("Are you sure you want to delete this player?")
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/players/${params.playerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/players")
      } else {
        alert("Failed to delete player", "Error")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("An error occurred", "Error")
    } finally {
      setIsDeleting(false)
    }
  }

  const getGenderBadge = (gender?: string | null) => {
    if (!gender) return null
    const colors = {
      MALE: "bg-blue-100 text-blue-800",
      FEMALE: "bg-pink-100 text-pink-800",
      OTHER: "bg-purple-100 text-purple-800",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colors[gender as keyof typeof colors]
        }`}
      >
        {gender}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading player...</div>
        </main>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Player not found"}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/players")}>
            ← Back to Players
          </Button>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/players/${player.id}/edit`} className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full" size="sm">
                  ✏️ Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" className="flex-1 sm:flex-initial" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "⏳ Deleting..." : "🗑️ Delete"}
              </Button>
            </div>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <PlayerAvatar name={player.name} photoUrl={player.profilePhoto} size="xl" />
                <div>
                  <CardTitle className="text-xl sm:text-2xl">{player.name}</CardTitle>
                  {player.gender && <div className="mt-2">{getGenderBadge(player.gender)}</div>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information — visible to admins only */}
            {isAdmin ? (
              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {player.email ? (
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{player.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="text-muted-foreground italic">Not provided</div>
                    </div>
                  )}
                  {player.mobileNumber ? (
                    <div>
                      <div className="text-sm text-muted-foreground">Mobile Number</div>
                      <div className="font-medium">{player.mobileNumber}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-muted-foreground">Mobile Number</div>
                      <div className="text-muted-foreground italic">Not provided</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground">
                Contact information is only visible to administrators.
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Age</div>
                  <div className="font-medium">{player.age ?? "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gender</div>
                  <div className="font-medium">{player.gender ?? "N/A"}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">Experience</div>
                  <div className="font-medium whitespace-pre-wrap break-words text-sm">
                    {player.experience?.trim() ? player.experience : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Skill level</div>
                  <div className="font-medium">
                    {skillCategoryLabel(player.skillCategory as SkillCategory | null) || "N/A"}
                  </div>
                </div>
              </div>
              <div className="mt-4 min-w-0">
                <div className="text-sm text-muted-foreground">Last played (badminton)</div>
                <div className="font-medium whitespace-pre-wrap break-words text-sm">
                  {player.lastPlayed?.trim() ? player.lastPlayed : "N/A"}
                </div>
              </div>
            </div>


            {/* Timestamps */}
            <div>
              <h3 className="font-semibold mb-3">Timestamps</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(player.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(player.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
