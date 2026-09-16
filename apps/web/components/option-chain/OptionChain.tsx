"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComputedOptionChain } from "@/lib/marketData";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import { OptionChainTable } from "./OptionChainTable";
import { AnalyticalPanels } from "./Panels";
import { AiInsights } from "@/components/ai/AiInsights";
import { AddToWatchlistButton } from "@/components/watchlist/AddToWatchlistButton";
import type { SortDirection, SortMetric, ViewMode } from "./types";

const REFRESH_INTERVAL_MS = 5000;
const EXPIRIES = getMockExpiries();

const SORT_OPTIONS: { value: SortMetric; label: string }[] = [
  { value: "strike", label: "Strike" },
  { value: "callOi", label: "Call OI" },
  { value: "putOi", label: "Put OI" },
  { value: "callOiChange", label: "Call ΔOI" },
  { value: "putOiChange", label: "Put ΔOI" },
  { value: "callVolume", label: "Call Volume" },
  { value: "putVolume", label: "Put Volume" },
];

const STRIKE_RANGE_OPTIONS: { value: number | "all"; label: string }[] = [
  { value: 5, label: "±5 strikes" },
  { value: 10, label: "±10 strikes" },
  { value: 20, label: "±20 strikes" },
  { value: "all", label: "All strikes" },
];

export function OptionChain({ initialInstrument }: { initialInstrument?: string } = {}) {
  const [instrument, setInstrument] = useState(initialInstrument ?? INSTRUMENTS[0].symbol);
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const [mode, setMode] = useState<ViewMode>("advanced");
  const [strikeRange, setStrikeRange] = useState<number | "all">(10);
  const [search, setSearch] = useState("");
  const [sortMetric, setSortMetric] = useState<SortMetric>("strike");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [data, setData] = useState<ComputedOptionChain | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/option-chain?instrument=${instrument}&expiry=${expiry}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const chain: ComputedOptionChain = await res.json();
      setData(chain);
      setStatus("ready");
      setErrorMessage(null);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }, [instrument, expiry]);

  useEffect(() => {
    setStatus("loading");
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Beginner mode is intentionally constrained to a tight strike range and a
  // fixed sort, so a first-time user sees a short, readable table rather
  // than the full chain with every control exposed.
  useEffect(() => {
    if (mode === "beginner") {
      setStrikeRange(5);
      setSortMetric("strike");
      setSortDirection("asc");
    }
  }, [mode]);

  const unusualStrikes = useMemo(
    () => new Set((data?.unusualActivity ?? []).map((u) => u.strike)),
    [data],
  );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Option Chain</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Synthetic demo data (MockProvider) — not real NSE market data. See{" "}
        <code>docs/phase-0/11-risks-and-assumptions.md</code> for the data-licensing status.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["beginner", "advanced", "power"] as ViewMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
              mode === m
                ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                : "border border-neutral-300 dark:border-neutral-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Instrument
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Expiry
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          >
            {EXPIRIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        {mode !== "beginner" && (
          <label className="flex flex-col gap-1 text-sm">
            Strike range
            <select
              className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
              value={strikeRange}
              onChange={(e) =>
                setStrikeRange(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              {STRIKE_RANGE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode !== "beginner" && (
          <label className="flex flex-col gap-1 text-sm">
            Sort by
            <div className="flex gap-1">
              <select
                className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
                value={sortMetric}
                onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                className="rounded border border-neutral-300 px-2 dark:border-neutral-700"
                aria-label="Toggle sort direction"
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Search strike
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 25000"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-32 rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
        {data && (
          <>
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-medium ${
                data.stale
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              }`}
            >
              {data.stale ? "STALE" : "LIVE"}
            </span>
            <span>As of {new Date(data.asOf).toLocaleTimeString("en-IN")}</span>
            <span>· Underlying: {data.underlyingPrice.toLocaleString("en-IN")}</span>
            <AddToWatchlistButton instrument={instrument} label={`Watch ${instrument}`} />
          </>
        )}
      </div>

      <div className="mt-4">
        {status === "loading" && !data && (
          <div className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-500 dark:border-neutral-800" role="status">
            Loading option chain…
          </div>
        )}

        {status === "error" && (
          <div
            className="rounded-lg border border-red-200 p-6 text-sm text-red-600 dark:border-red-900 dark:text-red-400"
            role="alert"
          >
            Could not load market data: {errorMessage}
            <button
              type="button"
              onClick={load}
              className="ml-3 rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <OptionChainTable
            contracts={data.contracts}
            mode={mode}
            atmStrike={data.atmStrike}
            strikeRange={strikeRange}
            search={search}
            sortMetric={sortMetric}
            sortDirection={sortDirection}
            unusualStrikes={unusualStrikes}
          />
        )}
      </div>

      {data && <AnalyticalPanels chain={data} mode={mode} />}

      {data && (
        <AiInsights instrument={instrument} expiry={expiry} mode={mode === "beginner" ? "beginner" : "advanced"} />
      )}
    </div>
  );
}
