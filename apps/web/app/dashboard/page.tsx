import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@ltp/db";
import { getOrCreateDefaultWatchlist } from "@/lib/getOrCreateDefaultWatchlist";
import { getLimits } from "@ltp/entitlements";
import Link from "next/link";
import { WatchlistPanel } from "@/components/dashboard/WatchlistPanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { CancelButton } from "@/components/billing/CancelButton";
import { NOINDEX_METADATA } from "@/lib/seo";

// User-specific page — must never be indexed (docs/phase-9/README.md).
export const metadata: Metadata = {
  title: "Dashboard — NSE Options Intelligence",
  ...NOINDEX_METADATA,
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, plan: true },
  });

  const watchlist = await getOrCreateDefaultWatchlist(user.id);
  const items = await prisma.watchlistItem.findMany({
    where: { watchlistId: watchlist.id },
    orderBy: { createdAt: "desc" },
  });

  const alerts = await prisma.alert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { triggers: { orderBy: { triggeredAt: "desc" }, take: 5 } },
  });

  const limits = getLimits(user.plan);

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
        <span>
          Signed in as {user.email} · Plan: {user.plan}
        </span>
        {user.plan === "FREE" ? (
          <Link href="/pricing" className="text-xs underline">
            Upgrade
          </Link>
        ) : (
          <CancelButton />
        )}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <WatchlistPanel initialItems={items} limit={limits.maxWatchlistItems} />
        <AlertsPanel initialAlerts={alerts} limit={limits.maxActiveAlerts} />
      </div>
    </main>
  );
}
