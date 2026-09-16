import type { ContractQuote } from "./types";

export type BuildupSignal =
  | "long-buildup"
  | "short-buildup"
  | "short-covering"
  | "long-unwinding"
  | "neutral";

export interface BuildupThresholds {
  /** Minimum |percent change| in price to count as a real price move. Default 0.1%. */
  minPriceChangePercent: number;
  /** Minimum |percent change| in OI to count as a real OI move. Default 1%. */
  minOiChangePercent: number;
}

const DEFAULT_THRESHOLDS: BuildupThresholds = {
  minPriceChangePercent: 0.1,
  minOiChangePercent: 1,
};

/**
 * Classic price/OI buildup detection, applied per contract:
 *
 * | Price | OI  | Signal          |
 * |-------|-----|------------------|
 * | Up    | Up  | Long buildup     |
 * | Down  | Up  | Short buildup    |
 * | Up    | Down| Short covering   |
 * | Down  | Down| Long unwinding   |
 *
 * Moves smaller than the configured thresholds are treated as "no real
 * move" and the signal is "neutral" — this avoids tagging noise as a
 * buildup event. Returns "neutral" (not a fabricated guess) when price or
 * OI data is missing.
 */
export function detectBuildup(
  quote: ContractQuote,
  thresholds: BuildupThresholds = DEFAULT_THRESHOLDS,
): BuildupSignal {
  if (
    quote.ltp === null ||
    quote.prevClose === null ||
    quote.oi === null ||
    quote.prevOi === null ||
    quote.prevClose === 0 ||
    quote.prevOi === 0
  ) {
    return "neutral";
  }

  const priceChangePercent =
    ((quote.ltp - quote.prevClose) / quote.prevClose) * 100;
  const oiChangePercent = ((quote.oi - quote.prevOi) / quote.prevOi) * 100;

  const priceUp = priceChangePercent > thresholds.minPriceChangePercent;
  const priceDown = priceChangePercent < -thresholds.minPriceChangePercent;
  const oiUp = oiChangePercent > thresholds.minOiChangePercent;
  const oiDown = oiChangePercent < -thresholds.minOiChangePercent;

  if (priceUp && oiUp) return "long-buildup";
  if (priceDown && oiUp) return "short-buildup";
  if (priceUp && oiDown) return "short-covering";
  if (priceDown && oiDown) return "long-unwinding";
  return "neutral";
}

/**
 * Unusual activity: flags when a value exceeds `multiplier` times a caller-
 * supplied baseline (e.g. a trailing average volume/OI for that contract).
 * This function does not compute the baseline itself — the calculation
 * engine has no historical store of its own (Phase 3 is pure functions over
 * a single snapshot); the caller supplies the baseline from wherever
 * historical data is kept (Phase 6).
 */
export function isUnusual(
  value: number | null,
  baseline: number | null,
  multiplier = 2,
): boolean {
  if (value === null || baseline === null || baseline <= 0) return false;
  return value > baseline * multiplier;
}
