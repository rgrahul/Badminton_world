import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { derivePlayerCategory } from "@/lib/constants"

export type SyncAuctionTeamsResult =
  | { ok: true; teamsCreated: number; playersAddedToRosters: number }
  | { ok: false; error: string }

type SyncOptions = {
  /** Use an existing transaction (e.g. auction PATCH). */
  tx?: Prisma.TransactionClient
  /** When true, error if no team has sold players (manual sync). When false, no-op is ok (auction complete). */
  requireSoldPlayers?: boolean
}

/**
 * Registers sold players as `TournamentPlayer`, then for each auction bidding team with sales:
 * - If a tournament `Team` with the same name exists, adds missing `TeamPlayer` rows (merge).
 * - Otherwise creates a new tournament `Team` with those players.
 */
export async function syncAuctionTeamsToTournament(
  auctionId: string,
  options: SyncOptions = {}
): Promise<SyncAuctionTeamsResult> {
  const { tx, requireSoldPlayers = true } = options

  const run = async (db: Prisma.TransactionClient): Promise<SyncAuctionTeamsResult> => {
    const auction = await db.auction.findUnique({
      where: { id: auctionId },
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
      return { ok: false, error: "Auction not found" }
    }

    if (!auction.tournamentId) {
      return { ok: false, error: "Auction is not linked to a tournament" }
    }

    const tournamentId = auction.tournamentId

    const teamsWithPlayers = auction.teams.filter((t) => t.soldPlayers.length > 0)
    if (teamsWithPlayers.length === 0) {
      if (requireSoldPlayers) {
        return { ok: false, error: "No auction teams have sold players" }
      }
      return { ok: true, teamsCreated: 0, playersAddedToRosters: 0 }
    }

    const allPlayerIds = new Set<string>()
    for (const at of teamsWithPlayers) {
      for (const ap of at.soldPlayers) {
        allPlayerIds.add(ap.playerId)
      }
    }

    await db.tournamentPlayer.createMany({
      data: Array.from(allPlayerIds).map((playerId) => ({
        tournamentId,
        playerId,
      })),
      skipDuplicates: true,
    })

    let teamsCreated = 0
    let playersAddedToRosters = 0

    for (const auctionTeam of teamsWithPlayers) {
      const players = auctionTeam.soldPlayers.map((ap) => ({
        playerId: ap.playerId,
        category: derivePlayerCategory(ap.player.age, ap.player.gender),
      }))

      const existingTeam = await db.team.findFirst({
        where: { tournamentId, name: auctionTeam.name },
        include: { players: { select: { playerId: true } } },
      })

      if (existingTeam) {
        const already = new Set(existingTeam.players.map((p) => p.playerId))
        for (const p of players) {
          if (already.has(p.playerId)) continue
          await db.teamPlayer.create({
            data: {
              teamId: existingTeam.id,
              playerId: p.playerId,
              category: p.category,
            },
          })
          already.add(p.playerId)
          playersAddedToRosters += 1
        }
        await db.team.update({
          where: { id: existingTeam.id },
          data: { playersAddedViaAuction: true },
        })
      } else {
        await db.team.create({
          data: {
            name: auctionTeam.name,
            tournamentId,
            playersAddedViaAuction: true,
            players: {
              create: players.map((p) => ({
                playerId: p.playerId,
                category: p.category,
              })),
            },
          },
        })
        teamsCreated += 1
        playersAddedToRosters += players.length
      }
    }

    return { ok: true, teamsCreated, playersAddedToRosters }
  }

  if (tx) {
    return run(tx)
  }

  return prisma.$transaction((innerTx) => run(innerTx))
}
