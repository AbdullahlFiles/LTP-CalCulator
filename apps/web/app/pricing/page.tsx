import type { Metadata } from "next";
import { getLimits } from "@ltp/entitlements";
import { buildMetadata } from "@/lib/seo";
import { UpgradeButton } from "@/components/billing/UpgradeButton";

export const metadata: Metadata = buildMetadata({
  title: "Pricing — Free vs Premium | NSE Options Intelligence",
  description:
    "The free plan stays genuinely useful: live option chain, LTP calculator, PCR, Max Pain, and AI insights. Premium adds deeper history, more alerts, and higher limits.",
  path: "/pricing",
});

const FEATURES: { label: string; free: string; premium: string }[] = [
  { label: "LTP Calculator & Option Chain", free: "Full access", premium: "Full access" },
  { label: "PCR, Max Pain, support/resistance", free: "Full access", premium: "Full access" },
  { label: "AI Insights panel", free: "Included", premium: "Included, higher daily limit" },
  { label: "Watchlist items", free: "Up to 10", premium: "Up to 100" },
  { label: "Active alerts", free: "Up to 5", premium: "Up to 50" },
  { label: "Historical chart window", free: "7 days", premium: "365 days" },
];

export default function PricingPage() {
  const free = getLimits("FREE");
  const premium = getLimits("PREMIUM");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Pricing</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The free plan is designed to stay genuinely useful — Premium adds depth and higher limits,
        not core functionality. See{" "}
        <code>docs/phase-0/07-free-vs-premium-strategy.md</code> for the reasoning behind where this
        line is drawn.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-lg font-semibold">Free</div>
          <div className="text-2xl font-bold">₹0</div>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {FEATURES.map((f) => (
              <li key={f.label}>
                {f.label}: {f.free}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border-2 border-neutral-900 p-4 dark:border-white">
          <div className="text-lg font-semibold">Premium</div>
          <div className="text-2xl font-bold">Contact for pricing</div>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {FEATURES.map((f) => (
              <li key={f.label}>
                {f.label}: {f.premium}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <UpgradeButton />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>About the Upgrade button:</strong> no real payment processor is configured in this
        environment (no Stripe account exists here, and the project rule is never to fabricate
        payment credentials). Clicking Upgrade directly sets your plan for demo/testing purposes —
        it does not charge any money, and it will not work at all if this app is ever run with{" "}
        <code>NODE_ENV=production</code> without a real <code>STRIPE_SECRET_KEY</code> configured.
        See <code>docs/phase-11/README.md</code>.
      </div>
      <p className="mt-2 text-xs text-neutral-400">
        Free plan limits: {free.maxWatchlistItems} watchlist items, {free.maxActiveAlerts} active
        alerts. Premium: {premium.maxWatchlistItems} watchlist items, {premium.maxActiveAlerts} active
        alerts. These are initial defaults (docs/phase-0/07), not finalized pricing-tier numbers.
      </p>
    </main>
  );
}
