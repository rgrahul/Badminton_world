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

interface Player {
  id: string
  name: string
  email?: string | null
  mobileNumber?: string | null
  age?: number | null
  gender?: string | null
  yearsOfExperience?: number | null
  skillRating?: number | null
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
      MALE: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
      FEMALE: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
      OTHER: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
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
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">Loading player...</div>
        </main>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">{error || "Player not found"}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/players")} className="border border-white/10 hover:bg-white/5 text-gray-300">
            Back to Players
          </Button>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/players/${player.id}/edit`} className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full border border-white/10 hover:bg-white/5 text-gray-300" size="sm">
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" className="flex-1 sm:flex-initial" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          )}
        </div>

        <Card className="mb-6 border-white/10 bg-white/[0.03]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <PlayerAvatar name={player.name} photoUrl={player.profilePhoto} size="xl" />
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-white">{player.name}</CardTitle>
                  {player.gender && <div className="mt-2">{getGenderBadge(player.gender)}</div>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information -- visible to admins only */}
            {isAdmin ? (
              <div>
                <h3 className="font-semibold mb-3 text-white">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {player.email ? (
                    <div>
                      <div className="text-sm text-gray-400">Email</div>
                      <div className="font-medium text-white">{player.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-400">Email</div>
                      <div className="text-gray-500 italic">Not provided</div>
                    </div>
                  )}
                  {player.mobileNumber ? (
                    <div>
                      <div className="text-sm text-gray-400">Mobile Number</div>
                      <div className="font-medium text-white">{player.mobileNumber}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-400">Mobile Number</div>
                      <div className="text-gray-500 italic">Not provided</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-400">
                Contact information is only visible to administrators.
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="font-semibold mb-3 text-white">Personal Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Age</div>
                  <div className="font-medium text-white">{player.age ?? "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Gender</div>
                  <div className="font-medium text-white">{player.gender ?? "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Experience</div>
                  <div className="font-medium text-white">
                    {player.yearsOfExperience !== null && player.yearsOfExperience !== undefined
                      ? `${player.yearsOfExperience} years`
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Skill Rating</div>
                  <div className="font-medium text-white">
                    {player.skillRating ? `${player.skillRating}/100` : "N/A"}
                  </div>
                </div>
              </div>
            </div>


            {/* Timestamps */}
            <div>
              <h3 className="font-semibold mb-3 text-white">Timestamps</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-gray-300">{new Date(player.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="text-gray-300">{new Date(player.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
