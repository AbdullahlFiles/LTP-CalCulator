import type { ComputedOptionChain } from "@/lib/marketData";
import { formatNumber } from "@/lib/format";
import type { ViewMode } from "./types";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-xs font-medium text-neutral-500">{title}</div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}

function LevelList({ levels }: { levels: { strike: number; oi: number }[] }) {
  if (levels.length === 0) return <div className="text-neutral-400">No data</div>;
  return (
    <ul className="space-y-1">
      {levels.map((l) => (
        <li key={l.strike} className="flex justify-between">
          <span>{l.strike}</span>
          <span className="text-neutral-500">{formatNumber(l.oi, 0)} OI</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticalPanels({
  chain,
  mode,
}: {
  chain: ComputedOptionChain;
  mode: ViewMode;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="text-xs font-medium text-neutral-500">Market summary</div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{chain.marketSummary.headline}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
          {chain.marketSummary.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="PCR (Put/Call OI)">
          <span className="text-xl font-semibold">{formatNumber(chain.pcr)}</span>
        </Card>
        <Card title="Max Pain">
          <span className="text-xl font-semibold">{formatNumber(chain.maxPain, 0)}</span>
        </Card>
        <Card title="ATM Strike">
          <span className="text-xl font-semibold">{formatNumber(chain.atmStrike, 0)}</span>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Resistance (highest Call OI)">
          <LevelList levels={chain.supportResistance.resistance} />
        </Card>
        <Card title="Support (highest Put OI)">
          <LevelList levels={chain.supportResistance.support} />
        </Card>
      </div>

      {mode !== "beginner" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Important strikes">
            {chain.importantStrikes.length === 0 ? (
              <div className="text-neutral-400">No data</div>
            ) : (
              <ul className="space-y-1">
                {chain.importantStrikes.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {s.strike} <span className="text-neutral-400">({s.reason.replace(/-/g, " ")})</span>
                    </span>
                    <span className="text-neutral-500">{formatNumber(s.value, 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Unusual activity">
            {chain.unusualActivity.length === 0 ? (
              <div className="text-neutral-400">Nothing unusual relative to this chain right now.</div>
            ) : (
              <ul className="space-y-1">
                {chain.unusualActivity.map((u, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {u.strike} {u.optionType}{" "}
                      <span className="text-neutral-400">({u.reason.replace(/-/g, " ")})</span>
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">{formatNumber(u.value, 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
