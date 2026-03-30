/**
 * Tiered bid steps for live auction UI.
 * - Below 20,000: +1,000
 * - 20,000–39,999: +2,000
 * - 40,000 and above: +5,000
 */
export function getAuctionBidIncrement(currentBid: number): number {
  if (currentBid < 20_000) return 1_000
  if (currentBid < 40_000) return 2_000
  return 5_000
}
