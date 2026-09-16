"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComputedOptionChain, ComputedContract } from "@/lib/marketData";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import { formatNumber } from "@/lib/format";

type OptionType = "CE" | "PE";
type FetchStatus = "loading" | "ready" | "error";

const REFRESH_INTERVAL_MS = 5000;
const EXPIRIES = getMockExpiries();

function ChangeBadge({ change, percent }: { change: number | null; percent: number | null }) {
  if (change === null || percent === null) {
    return <span className="text-neutral-400">—</span>;
  }
  const positive = change > 0;
  const negative = change < 0;
  const color = positive
    ? "text-green-600 dark:text-green-400"
    : negative
      ? "text-red-600 dark:text-red-400"
      : "text-neutral-500";
  const sign = positive ? "+" : "";
  return (
    <span className={color}>
      {sign}
      {formatNumber(change)} ({sign}
      {formatNumber(percent)}%)
    </span>
  );
}

const MONEYNESS_STYLES: Record<string, string> = {
  ATM: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ITM: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  OTM: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const BUILDUP_LABEL: Record<string, string> = {
  "long-buildup": "Long buildup",
  "short-buildup": "Short buildup",
  "short-covering": "Short covering",
  "long-unwinding": "Long unwinding",
  neutral: "No significant signal",
};

export function LtpCalculator({ initialInstrument }: { initialInstrument?: string } = {}) {
  const [instrument, setInstrument] = useState(initialInstrument ?? INSTRUMENTS[0].symbol);
  const [expiry, setExpiry] = useState(EXPIRIES[0]);
  const [optionType, setOptionType] = useState<OptionType>("CE");
  const [strike, setStrike] = useState<number | null>(null);
  const [data, setData] = useState<ComputedOptionChain | null>(null);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/option-chain?instrument=${instrument}&expiry=${expiry}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const chain: ComputedOptionChain = await res.json();
      setData(chain);
      setStatus("ready");
      setErrorMessage(null);
      setStrike((current) => current ?? chain.atmStrike);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    }
  }, [instrument, expiry]);

  useEffect(() => {
    setStatus("loading");
    setStrike(null);
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const strikes = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.contracts.map((c) => c.strike))).sort(
      (a, b) => a - b,
    );
  }, [data]);

  const selectedContract: ComputedContract | undefined = useMemo(() => {
    if (!data || strike === null) return undefined;
    return data.contracts.find(
      (c) => c.strike === strike && c.optionType === optionType,
    );
  }, [data, strike, optionType]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">LTP Calculator</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Synthetic demo data (MockProvider) — not real NSE market data. See{" "}
        <code>docs/phase-0/11-risks-and-assumptions.md</code> for the data-licensing status.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                {data?.atmStrike === s ? " (ATM)" : ""}
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
                className={`flex-1 px-2 py-1.5 text-sm ${
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
            <span>· Underlying: {formatNumber(data.underlyingPrice)}</span>
            <span>· Source: {data.dataSource}</span>
          </>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {status === "loading" && !data && (
          <div className="p-6 text-sm text-neutral-500" role="status">
            Loading option chain…
          </div>
        )}

        {status === "error" && (
          <div className="p-6 text-sm text-red-600 dark:text-red-400" role="alert">
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

        {data && !selectedContract && status !== "loading" && (
          <div className="p-6 text-sm text-neutral-500">
            No data available for strike {strike} {optionType}.
          </div>
        )}

        {selectedContract && (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
            <Metric label="LTP" value={formatNumber(selectedContract.ltp)} />
            <Metric
              label="Change"
              value={
                <ChangeBadge
                  change={selectedContract.ltpChange.change}
                  percent={selectedContract.ltpChange.percentChange}
                />
              }
            />
            <Metric
              label="Moneyness"
              value={
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${MONEYNESS_STYLES[selectedContract.moneyness]}`}
                >
                  {selectedContract.moneyness}
                </span>
              }
            />
            <Metric label="Open Interest" value={formatNumber(selectedContract.oi)} />
            <Metric
              label="Change in OI"
              value={
                <ChangeBadge
                  change={selectedContract.oiChange.change}
                  percent={selectedContract.oiChange.percentChange}
                />
              }
            />
            <Metric label="Volume" value={formatNumber(selectedContract.volume, 0)} />
            <Metric label="IV" value={selectedContract.iv !== null ? `${formatNumber(selectedContract.iv)}%` : "—"} />
            <Metric label="Delta" value={formatNumber(selectedContract.greeks?.delta ?? null, 3)} />
            <Metric label="Gamma" value={formatNumber(selectedContract.greeks?.gamma ?? null, 4)} />
            <Metric label="Theta" value={formatNumber(selectedContract.greeks?.theta ?? null, 2)} />
            <Metric label="Vega" value={formatNumber(selectedContract.greeks?.vega ?? null, 2)} />
            <Metric
              label="Bid / Ask"
              value={`${formatNumber(selectedContract.bid)} / ${formatNumber(selectedContract.ask)}`}
            />
            <Metric label="Buildup signal" value={BUILDUP_LABEL[selectedContract.buildup]} />
          </div>
        )}
      </div>

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="PCR (Put/Call OI)" value={formatNumber(data.pcr)} />
          <SummaryCard label="Max Pain" value={formatNumber(data.maxPain, 0)} />
          <SummaryCard label="ATM Strike" value={formatNumber(data.atmStrike, 0)} />
        </div>
      )}

      {data && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LevelsCard title="Resistance (highest Call OI)" levels={data.supportResistance.resistance} />
          <LevelsCard title="Support (highest Put OI)" levels={data.supportResistance.support} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-lg font-medium">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function LevelsCard({
  title,
  levels,
}: {
  title: string;
  levels: { strike: number; oi: number }[];
}) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="text-xs text-neutral-500">{title}</div>
      <ul className="mt-2 space-y-1 text-sm">
        {levels.length === 0 && <li className="text-neutral-400">No data</li>}
        {levels.map((level) => (
          <li key={level.strike} className="flex justify-between">
            <span>{level.strike}</span>
            <span className="text-neutral-500">{formatNumber(level.oi, 0)} OI</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
