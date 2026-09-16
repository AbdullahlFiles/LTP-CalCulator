"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import type { ComputedOptionChain } from "@/lib/marketData";
import { TimeSeriesChart, type ChartPoint } from "./TimeSeriesChart";

const EXPIRY = getMockExpiries()[0];
const REFRESH_INTERVAL_MS = 15_000;

type OptionType = "CE" | "PE";
type ContractMetric = "ltp" | "oi" | "volume" | "iv";
type ChainMetric = "underlyingPrice" | "pcr" | "maxPain";

const CONTRACT_METRICS: { value: ContractMetric; label: string }[] = [
  { value: "ltp", label: "LTP" },
  { value: "oi", label: "Open Interest" },
  { value: "volume", label: "Volume" },
  { value: "iv", label: "IV" },
];

const CHAIN_METRICS: { value: ChainMetric; label: string }[] = [
  { value: "underlyingPrice", label: "Underlying price" },
  { value: "pcr", label: "PCR" },
  { value: "maxPain", label: "Max Pain" },
];

async function fetchSeries(url: string): Promise<ChartPoint[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  return body.points as ChartPoint[];
}

export function HistoricalCharts() {
  const [instrument, setInstrument] = useState(INSTRUMENTS[0].symbol);
  const [strikes, setStrikes] = useState<number[]>([]);
  const [strike, setStrike] = useState<number | null>(null);
  const [optionType, setOptionType] = useState<OptionType>("CE");
  const [contractMetric, setContractMetric] = useState<ContractMetric>("ltp");
  const [chainMetric, setChainMetric] = useState<ChainMetric>("underlyingPrice");

  const [contractPoints, setContractPoints] = useState<ChartPoint[]>([]);
  const [chainPoints, setChainPoints] = useState<ChartPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Discover available strikes (and a sensible default) from the live chain
  // endpoint, rather than hard-coding the mock generator's strike ladder.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/option-chain?instrument=${instrument}&expiry=${EXPIRY}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((chain: ComputedOptionChain) => {
        if (cancelled) return;
        const uniqueStrikes = Array.from(new Set(chain.contracts.map((c) => c.strike))).sort(
          (a, b) => a - b,
        );
        setStrikes(uniqueStrikes);
        setStrike((current) => current ?? chain.atmStrike ?? uniqueStrikes[0] ?? null);
      })
      .catch(() => {
        /* surfaced by the historical fetches below */
      });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  const load = useCallback(async () => {
    if (strike === null) return;
    try {
      const [contract, chain] = await Promise.all([
        fetchSeries(
          `/api/historical/contract?instrument=${instrument}&expiry=${EXPIRY}&strike=${strike}&optionType=${optionType}&metric=${contractMetric}`,
        ),
        fetchSeries(`/api/historical/chain?instrument=${instrument}&expiry=${EXPIRY}&metric=${chainMetric}`),
      ]);
      setContractPoints(contract);
      setChainPoints(chain);
      setStatus("ready");
      setErrorMessage(null);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }, [instrument, strike, optionType, contractMetric, chainMetric]);

  useEffect(() => {
    if (strike === null) return;
    setStatus("loading");
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load, strike]);

  const contractLabel = useMemo(
    () => CONTRACT_METRICS.find((m) => m.value === contractMetric)?.label ?? contractMetric,
    [contractMetric],
  );
  const chainLabel = useMemo(
    () => CHAIN_METRICS.find((m) => m.value === chainMetric)?.label ?? chainMetric,
    [chainMetric],
  );

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Historical Charts</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Synthetic demo data, sampled every 10s server-side with a 1-hour synthetic backfill on
        first load — not real NSE history. Expiry is fixed to {EXPIRY} (the same one collected in
        the background); see <code>docs/phase-6/README.md</code> for the collection model.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Instrument
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={instrument}
            onChange={(e) => {
              setInstrument(e.target.value);
              setStrike(null);
            }}
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Strike
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={strike ?? ""}
            disabled={strikes.length === 0}
            onChange={(e) => setStrike(Number(e.target.value))}
          >
            {strikes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Option type
          <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-700">
            {(["CE", "PE"] as OptionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOptionType(type)}
                className={`px-3 py-1.5 text-sm ${
                  optionType === type
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                    : "bg-white dark:bg-neutral-900"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contract metric
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            value={contractMetric}
            onChange={(e) => setContractMetric(e.target.value as ContractMetric)}
          >
            {CONTRACT_METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status === "error" && (
        <div
          className="mt-4 rounded-lg border border-red-200 p-4 text-sm text-red-600 dark:border-red-900 dark:text-red-400"
          role="alert"
        >
          Could not load historical data: {errorMessage}
          <button
            type="button"
            onClick={load}
            className="ml-3 rounded border border-red-300 px-2 py-1 text-xs hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="text-sm font-medium">
          {instrument} {strike ?? "—"} {optionType} — {contractLabel}
        </div>
        {status === "loading" ? (
          <div className="flex h-64 items-center justify-center text-sm text-neutral-400" role="status">
            Loading…
          </div>
        ) : (
          <TimeSeriesChart points={contractPoints} label={contractLabel} color="#2563eb" />
        )}
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {instrument} — {chainLabel}
          </div>
          <select
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
            value={chainMetric}
            onChange={(e) => setChainMetric(e.target.value as ChainMetric)}
          >
            {CHAIN_METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {status === "loading" ? (
          <div className="flex h-64 items-center justify-center text-sm text-neutral-400" role="status">
            Loading…
          </div>
        ) : (
          <TimeSeriesChart points={chainPoints} label={chainLabel} color="#7c3aed" />
        )}
      </div>
    </div>
  );
}
