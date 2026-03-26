import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/client"
import { successResponse, errorResponse } from "@/lib/api/responses"
import { derivePlayerCategory } from "@/lib/constants"

export async function POST(
  request: NextRequest,
  { params }: { params: { auctionId: string } }
) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: params.auctionId },
      include: {
        teams: {
          include: {
            soldPlayers: {
              where: { status: "SOLD" },
              include: {
                player: { select: { id: true, name: true, age: true, gender: true } },
              },
            },
          },
        },
      },
    })

    if (!auction) {
      return errorResponse("Auction not found", 404)
    }

    if (!auction.tournamentId) {
      return errorResponse("Auction is not linked to a tournament")
    }

    // Check if tournament already has teams with matching auction team names
    const existingTeams = await prisma.team.findMany({
      where: { tournamentId: auction.tournamentId },
      select: { name: true },
    })
    const existingNames = new Set(existingTeams.map((t) => t.name))
    const conflicting = auction.teams.filter((at) => existingNames.has(at.name))
    if (conflicting.length > 0) {
      return errorResponse(
        `Tournament already has teams with these names: ${conflicting.map((t) => t.name).join(", ")}. Delete existing teams first or rename them.`
      )
    }

    const teamsWithPlayers = auction.teams.filter((t) => t.soldPlayers.length > 0)
    if (teamsWithPlayers.length === 0) {
      return errorResponse("No auction teams have sold players")
    }

    const tournamentId = auction.tournamentId

    const createdTeams = await prisma.$transaction(async (tx) => {
      // Collect all player IDs for TournamentPlayer registration
      const allPlayerIds = new Set<string>()
      for (const at of teamsWithPlayers) {
        for (const ap of at.soldPlayers) {
          allPlayerIds.add(ap.playerId)
        }
      }

      // Register all players as TournamentPlayers (skip duplicates)
      await tx.tournamentPlayer.createMany({
        data: Array.from(allPlayerIds).map((playerId) => ({
          tournamentId,
          playerId,
        })),
        skipDuplicates: true,
      })

      // Create each team with its players
      const teams = []
      for (const auctionTeam of teamsWithPlayers) {
        const players = auctionTeam.soldPlayers.map((ap) => ({
          playerId: ap.playerId,
          category: derivePlayerCategory(ap.player.age, ap.player.gender),
        }))

        const maleCount = players.filter((p) => p.category === "MALE").length
        const femaleCount = players.filter((p) => p.category === "FEMALE").length
        const kidCount = players.filter((p) => p.category === "KID").length

        const team = await tx.team.create({
          data: {
            name: auctionTeam.name,
            tournamentId,
            teamSize: players.length,
            requiredMale: maleCount,
            requiredFemale: femaleCount,
            requiredKid: kidCount,
            players: {
              create: players.map((p) => ({
                playerId: p.playerId,
                category: p.category,
              })),
            },
          },
          include: {
            players: { include: { player: true } },
            _count: { select: { players: true } },
          },
        })

        teams.push(team)
      }

      return teams
    })

    return successResponse({
      teams: createdTeams,
      count: createdTeams.length,
    }, 201)
  } catch (error) {
    console.error("Sync teams error:", error)
    return errorResponse("Failed to create tournament teams", 500)
  }
}
