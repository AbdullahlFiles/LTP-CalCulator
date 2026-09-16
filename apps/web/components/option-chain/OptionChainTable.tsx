"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ComputedContract } from "@/lib/marketData";
import { formatNumber } from "@/lib/format";
import type { SortDirection, SortMetric, ViewMode } from "./types";

interface Row {
  strike: number;
  ce: ComputedContract | undefined;
  pe: ComputedContract | undefined;
}

function pairByStrike(contracts: ComputedContract[]): Row[] {
  const byStrike = new Map<number, Row>();
  for (const c of contracts) {
    const row = byStrike.get(c.strike) ?? { strike: c.strike, ce: undefined, pe: undefined };
    if (c.optionType === "CE") row.ce = c;
    else row.pe = c;
    byStrike.set(c.strike, row);
  }
  return Array.from(byStrike.values());
}

function sortValue(row: Row, metric: SortMetric): number {
  switch (metric) {
    case "strike":
      return row.strike;
    case "callOi":
      return row.ce?.oi ?? -Infinity;
    case "putOi":
      return row.pe?.oi ?? -Infinity;
    case "callVolume":
      return row.ce?.volume ?? -Infinity;
    case "putVolume":
      return row.pe?.volume ?? -Infinity;
    case "callOiChange":
      return row.ce?.oiChange.change ?? -Infinity;
    case "putOiChange":
      return row.pe?.oiChange.change ?? -Infinity;
  }
}

const MONEYNESS_ROW_STYLES: Record<string, string> = {
  ATM: "bg-amber-50 dark:bg-amber-950/30",
  ITM: "bg-blue-50/50 dark:bg-blue-950/20",
  OTM: "",
};

export interface OptionChainTableProps {
  contracts: ComputedContract[];
  mode: ViewMode;
  atmStrike: number | null;
  strikeRange: number | "all";
  search: string;
  sortMetric: SortMetric;
  sortDirection: SortDirection;
  unusualStrikes: Set<number>;
}

export function OptionChainTable({
  contracts,
  mode,
  atmStrike,
  strikeRange,
  search,
  sortMetric,
  sortDirection,
  unusualStrikes,
}: OptionChainTableProps) {
  const allRows = useMemo(() => pairByStrike(contracts), [contracts]);

  const rows = useMemo(() => {
    let filtered = allRows;

    if (strikeRange !== "all" && atmStrike !== null) {
      const strikes = allRows.map((r) => r.strike).sort((a, b) => a - b);
      const atmIndex = strikes.indexOf(atmStrike);
      if (atmIndex !== -1) {
        const lo = strikes[Math.max(0, atmIndex - strikeRange)];
        const hi = strikes[Math.min(strikes.length - 1, atmIndex + strikeRange)];
        filtered = filtered.filter((r) => r.strike >= lo && r.strike <= hi);
      }
    }

    if (search.trim() !== "") {
      filtered = filtered.filter((r) => r.strike.toString().includes(search.trim()));
    }

    const sorted = [...filtered].sort((a, b) => {
      const diff = sortValue(a, sortMetric) - sortValue(b, sortMetric);
      return sortDirection === "asc" ? diff : -diff;
    });

    return sorted;
  }, [allRows, strikeRange, atmStrike, search, sortMetric, sortDirection]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = mode === "power" ? 32 : 40;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  const showGreeksAndBidAsk = mode === "power";
  const showFullMetrics = mode !== "beginner";

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="grid grid-cols-[1fr_auto_1fr] bg-neutral-50 text-xs font-medium text-neutral-500 dark:bg-neutral-900">
        <div className="py-2 text-center">CALLS</div>
        <div className="py-2 text-center">STRIKE</div>
        <div className="py-2 text-center">PUTS</div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] border-t border-neutral-200 text-[11px] text-neutral-500 dark:border-neutral-800">
        <HeaderCells side="ce" showFullMetrics={showFullMetrics} showGreeksAndBidAsk={showGreeksAndBidAsk} />
        <div className="px-2 py-1 text-center">·</div>
        <HeaderCells side="pe" showFullMetrics={showFullMetrics} showGreeksAndBidAsk={showGreeksAndBidAsk} />
      </div>

      <div ref={parentRef} className="max-h-[520px] overflow-auto" role="table" aria-label="Option chain">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No strikes match the current filter.
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const isAtm = row.strike === atmStrike;
              const isUnusual = unusualStrikes.has(row.strike);
              return (
                <div
                  key={row.strike}
                  role="row"
                  className={`absolute left-0 top-0 grid w-full grid-cols-[1fr_auto_1fr] items-center border-b border-neutral-100 text-xs dark:border-neutral-900 ${
                    isAtm ? MONEYNESS_ROW_STYLES.ATM : ""
                  }`}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ContractCells
                    contract={row.ce}
                    side="ce"
                    showFullMetrics={showFullMetrics}
                    showGreeksAndBidAsk={showGreeksAndBidAsk}
                  />
                  <div className="flex items-center justify-center gap-1 px-2 py-1 text-center font-medium">
                    {row.strike}
                    {isAtm && (
                      <span className="rounded bg-amber-200 px-1 text-[9px] font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                        ATM
                      </span>
                    )}
                    {isUnusual && (
                      <span
                        title="Unusual volume or OI change vs. the rest of this chain"
                        className="rounded bg-purple-200 px-1 text-[9px] font-semibold text-purple-900 dark:bg-purple-800 dark:text-purple-100"
                      >
                        !
                      </span>
                    )}
                  </div>
                  <ContractCells
                    contract={row.pe}
                    side="pe"
                    showFullMetrics={showFullMetrics}
                    showGreeksAndBidAsk={showGreeksAndBidAsk}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderCells({
  side,
  showFullMetrics,
  showGreeksAndBidAsk,
}: {
  side: "ce" | "pe";
  showFullMetrics: boolean;
  showGreeksAndBidAsk: boolean;
}) {
  const beginnerLabels = ["OI", "Chg%", "LTP"];
  const advancedLabels = ["OI", "ΔOI", "Vol", "IV", "LTP", "Chg%"];
  const powerLabels = ["OI", "ΔOI", "Vol", "IV", "Δ", "B/A", "LTP", "Chg%"];
  const labels = showGreeksAndBidAsk
    ? powerLabels
    : showFullMetrics
      ? advancedLabels
      : beginnerLabels;
  const ordered = side === "ce" ? [...labels].reverse() : labels;
  return (
    <div className="grid gap-1 px-2 py-1" style={gridColumnsStyle(labels.length)}>
      {ordered.map((label, i) => (
        <div key={`${label}-${i}`} className="text-right">
          {label}
        </div>
      ))}
    </div>
  );
}

/**
 * Tailwind's build-time scanner can't see a class name assembled at
 * runtime (e.g. `grid-cols-${count}`), so the column count here — which
 * varies with view mode (3/6/8 columns) — is set via an inline style
 * instead of a dynamic `grid-cols-N` class.
 */
function gridColumnsStyle(count: number): React.CSSProperties {
  return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
}

function ContractCells({
  contract,
  side,
  showFullMetrics,
  showGreeksAndBidAsk,
}: {
  contract: ComputedContract | undefined;
  side: "ce" | "pe";
  showFullMetrics: boolean;
  showGreeksAndBidAsk: boolean;
}) {
  if (!contract) {
    const count = showGreeksAndBidAsk ? 8 : showFullMetrics ? 6 : 3;
    return (
      <div className="grid gap-1 px-2 py-1 text-neutral-300" style={gridColumnsStyle(count)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="text-right">
            —
          </div>
        ))}
      </div>
    );
  }

  const changeColor =
    contract.ltpChange.change === null
      ? ""
      : contract.ltpChange.change > 0
        ? "text-green-600 dark:text-green-400"
        : contract.ltpChange.change < 0
          ? "text-red-600 dark:text-red-400"
          : "";

  const cells: React.ReactNode[] = [];
  cells.push(<span key="oi">{formatNumber(contract.oi, 0)}</span>);
  if (showFullMetrics) {
    cells.push(<span key="doi">{formatNumber(contract.oiChange.change, 0)}</span>);
    cells.push(<span key="vol">{formatNumber(contract.volume, 0)}</span>);
    cells.push(<span key="iv">{contract.iv !== null ? `${formatNumber(contract.iv, 1)}%` : "—"}</span>);
  }
  if (showGreeksAndBidAsk) {
    cells.push(<span key="delta">{formatNumber(contract.greeks?.delta ?? null, 2)}</span>);
    cells.push(
      <span key="ba" className="whitespace-nowrap">
        {formatNumber(contract.bid, 1)}/{formatNumber(contract.ask, 1)}
      </span>,
    );
  }
  cells.push(<span key="ltp">{formatNumber(contract.ltp)}</span>);
  cells.push(
    <span key="chg" className={changeColor}>
      {contract.ltpChange.percentChange !== null
        ? `${formatNumber(contract.ltpChange.percentChange, 1)}%`
        : "—"}
    </span>,
  );

  const ordered = side === "ce" ? [...cells].reverse() : cells;

  return (
    <div className="grid gap-1 px-2 py-1" style={gridColumnsStyle(cells.length)}>
      {ordered.map((cell, i) => (
        <div key={i} className="text-right tabular-nums">
          {cell}
        </div>
      ))}
    </div>
  );
}
