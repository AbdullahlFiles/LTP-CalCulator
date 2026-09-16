import { prisma } from "@ltp/db";

/**
 * Multiple named watchlists are modeled in the schema for future
 * extensibility, but Phase 8 scopes the UI/API to a single default
 * watchlist per user — a natural Premium feature (more watchlists, per
 * docs/phase-0/07-free-vs-premium-strategy.md) to introduce later, not a
 * gap in this phase.
 */
export async function getOrCreateDefaultWatchlist(userId: string) {
  const existing = await prisma.watchlist.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return prisma.watchlist.create({ data: { userId, name: "My Watchlist" } });
}
