export interface ChangeSnapshot {
  underlyingPrice: number;
  pcr: number | null;
  maxPain: number | null;
}

export interface SignificantChangeThresholds {
  /** Minimum |% change| in underlying price to count as significant. */
  underlyingPricePercent: number;
  /** Minimum absolute change in PCR to count as significant. */
  pcrAbsolute: number;
}

const DEFAULT_THRESHOLDS: SignificantChangeThresholds = {
  underlyingPricePercent: 0.15,
  pcrAbsolute: 0.1,
};

/**
 * The AI cost-control gate from docs/phase-0/11-risks-and-assumptions.md
 * (R3) and the master spec's "AI Cost-Control Strategy": an AI call is
 * only warranted when something has actually changed enough to be worth
 * explaining, not on every tick. This function is the deterministic rule
 * that decides that — cheap to run on every computed update, unlike the
 * AI call it's gating.
 *
 * No previous snapshot (first look at this instrument/expiry) always
 * counts as significant — there's nothing to compare against, and a
 * first-time visitor benefits from an explanation.
 */
export function isSignificantChange(
  previous: ChangeSnapshot | null,
  current: ChangeSnapshot,
  thresholds: SignificantChangeThresholds = DEFAULT_THRESHOLDS,
): boolean {
  if (previous === null) return true;

  if (previous.underlyingPrice !== 0) {
    const percentChange =
      (Math.abs(current.underlyingPrice - previous.underlyingPrice) / previous.underlyingPrice) * 100;
    if (percentChange >= thresholds.underlyingPricePercent) return true;
  }

  if (previous.pcr !== null && current.pcr !== null) {
    if (Math.abs(current.pcr - previous.pcr) >= thresholds.pcrAbsolute) return true;
  }

  if (previous.maxPain !== null && current.maxPain !== null && previous.maxPain !== current.maxPain) {
    return true;
  }

  return false;
}
