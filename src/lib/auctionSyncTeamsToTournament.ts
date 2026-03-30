import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/client"
import { derivePlayerCategory } from "@/lib/constants"

export type SyncAuctionTeamsResult =
  | { ok: true; teamsCreated: number; skippedDueToConflict?: boolean }
  | { ok: false; error: string }

type SyncOptions = {
  /** Use an existing transaction (e.g. auction PATCH). */
  tx?: Prisma.TransactionClient
  /** When true, error if no team has sold players (manual sync). When false, no-op is ok (auction complete). */
  requireSoldPlayers?: boolean
  /** When true and team names already exist, skip creating teams instead of failing (e.g. after manual sync). */
  skipOnTeamNameConflict?: boolean
}

/**
 * Creates tournament `Team` + `TeamPlayer` rows from auction sold players, and registers `TournamentPlayer`.
 */
export async function syncAuctionTeamsToTournament(
  auctionId: string,
  options: SyncOptions = {}
): Promise<SyncAuctionTeamsResult> {
  const { tx, requireSoldPlayers = true, skipOnTeamNameConflict = false } = options

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

    const existingTeams = await db.team.findMany({
      where: { tournamentId },
      select: { name: true },
    })
    const existingNames = new Set(existingTeams.map((t) => t.name))
    const conflicting = auction.teams.filter((at) => existingNames.has(at.name))
    if (conflicting.length > 0) {
      if (skipOnTeamNameConflict) {
        return { ok: true, teamsCreated: 0, skippedDueToConflict: true }
      }
      return {
        ok: false,
        error: `Tournament already has teams with these names: ${conflicting.map((t) => t.name).join(", ")}. Delete existing teams first or rename them.`,
      }
    }

    const teamsWithPlayers = auction.teams.filter((t) => t.soldPlayers.length > 0)
    if (teamsWithPlayers.length === 0) {
      if (requireSoldPlayers) {
        return { ok: false, error: "No auction teams have sold players" }
      }
      return { ok: true, teamsCreated: 0 }
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
    for (const auctionTeam of teamsWithPlayers) {
      const players = auctionTeam.soldPlayers.map((ap) => ({
        playerId: ap.playerId,
        category: derivePlayerCategory(ap.player.age, ap.player.gender),
      }))

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
    }

    return { ok: true, teamsCreated }
  }

  if (tx) {
    return run(tx)
  }

  return prisma.$transaction((innerTx) => run(innerTx))
}
