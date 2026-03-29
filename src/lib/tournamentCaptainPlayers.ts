import { prisma } from "@/lib/db/client"

/** Player IDs designated as team captains for this tournament (excluded from auction pool). */
export async function getTournamentCaptainPlayerIds(tournamentId: string): Promise<string[]> {
  const rows = await prisma.team.findMany({
    where: { tournamentId, captainId: { not: null } },
    select: { captainId: true },
  })
  return rows.map((r) => r.captainId!).filter(Boolean)
}
