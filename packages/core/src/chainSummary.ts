import { isUnusual } from "./buildup";
import type { ContractQuote } from "./types";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export interface UnusualContract {
  strike: number;
  optionType: ContractQuote["optionType"];
  reason: "unusual-volume" | "unusual-oi-change";
  value: number;
  baseline: number;
}

/**
 * Flags contracts whose volume or |change in OI| is more than `multiplier`
 * times the chain's own average for that metric on this snapshot.
 *
 * This is a same-snapshot baseline (there is no historical store in this
 * package — see docs/phase-1/README.md), so it flags contracts unusual
 * *relative to the rest of the current chain*, not relative to their own
 * history. A caller with access to historical per-contract averages
 * (Phase 6) can pass those in instead via `isUnusual` directly for a
 * stronger signal.
 */
export function detectUnusualActivity(
  contracts: ContractQuote[],
  multiplier = 3,
): UnusualContract[] {
  const volumes = contracts
    .map((c) => c.volume)
    .filter((v): v is number => v !== null);
  const oiChanges = contracts
    .filter((c) => c.oi !== null && c.prevOi !== null)
    .map((c) => Math.abs((c.oi as number) - (c.prevOi as number)));

  const avgVolume = average(volumes);
  const avgOiChange = average(oiChanges);

  const flagged: UnusualContract[] = [];

  for (const c of contracts) {
    if (avgVolume !== null && isUnusual(c.volume, avgVolume, multiplier)) {
      flagged.push({
        strike: c.strike,
        optionType: c.optionType,
        reason: "unusual-volume",
        value: c.volume as number,
        baseline: avgVolume,
      });
    }
    if (
      avgOiChange !== null &&
      c.oi !== null &&
      c.prevOi !== null &&
      isUnusual(Math.abs(c.oi - c.prevOi), avgOiChange, multiplier)
    ) {
      flagged.push({
        strike: c.strike,
        optionType: c.optionType,
        reason: "unusual-oi-change",
        value: Math.abs(c.oi - c.prevOi),
        baseline: avgOiChange,
      });
    }
  }

  return flagged;
}

export interface MarketSummary {
  headline: string;
  points: string[];
}

/**
 * A deterministic, rule-based plain-language summary of the current chain
 * state. This is NOT the AI intelligence layer (Phase 7) — it is fixed
 * template text driven only by already-computed numbers, included here so
 * the option chain has a readable summary panel before the AI layer exists.
 * Every sentence is hedged ("may", "historically") per the project rule
 * that no interpretation — deterministic or AI — presents a guaranteed
 * outcome.
 */
export function computeMarketSummary(input: {
  pcr: number | null;
  maxPain: number | null;
  underlyingPrice: number;
  atmStrike: number | null;
}): MarketSummary {
  const points: string[] = [];

  if (input.pcr !== null) {
    if (input.pcr > 1.3) {
      points.push(
        `Put-Call Ratio is ${input.pcr.toFixed(2)} — Put OI significantly exceeds Call OI, which is typically read as put writers positioning for support (a bullish OI lean, not a guaranteed direction).`,
      );
    } else if (input.pcr < 0.7) {
      points.push(
        `Put-Call Ratio is ${input.pcr.toFixed(2)} — Call OI significantly exceeds Put OI, which is typically read as call writers positioning for resistance (a bearish OI lean, not a guaranteed direction).`,
      );
    } else {
      points.push(
        `Put-Call Ratio is ${input.pcr.toFixed(2)} — close to neutral, without a strong directional lean from current OI positioning.`,
      );
    }
  }

  if (input.maxPain !== null) {
    const distance = input.underlyingPrice - input.maxPain;
    const distancePercent = (Math.abs(distance) / input.underlyingPrice) * 100;
    if (distancePercent < 0.3) {
      points.push(
        `The underlying is trading close to today's Max Pain strike (${input.maxPain}).`,
      );
    } else if (distance > 0) {
      points.push(
        `Max Pain sits at ${input.maxPain}, below the current price — option-pain dynamics may (not "will") pull price toward this level into expiry.`,
      );
    } else {
      points.push(
        `Max Pain sits at ${input.maxPain}, above the current price — option-pain dynamics may (not "will") pull price toward this level into expiry.`,
      );
    }
  }

  if (input.atmStrike !== null) {
    points.push(`ATM strike is ${input.atmStrike}, based on the current underlying price.`);
  }

  const headline =
    points.length > 0
      ? "Deterministic read of current OI and price data — not a prediction."
      : "Not enough data to summarize this chain yet.";

  return { headline, points };
}
