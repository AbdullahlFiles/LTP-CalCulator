import type { ContractQuote } from "./types";

/**
 * Max Pain: the strike at which total payout to option holders (equivalently,
 * total loss to option writers) is minimized if the underlying expires there.
 *
 * For a candidate expiry price S:
 *   pain(S) = sum over all Call strikes K of callOI(K) * max(0, S - K)
 *           + sum over all Put strikes K of putOI(K) * max(0, K - S)
 *
 * Max Pain = the strike S (drawn from the set of strikes present in the
 * chain) that minimizes pain(S).
 *
 * Contracts with a null OI are treated as zero OI for this calculation only
 * (a missing OI contributes no pain, which is the correct neutral value here
 * — unlike other calculations in this package, there is no meaningful "null"
 * result to propagate through a sum). Returns null if there are no strikes.
 */
export function computeMaxPain(contracts: ContractQuote[]): number | null {
  const strikes = Array.from(new Set(contracts.map((c) => c.strike))).sort(
    (a, b) => a - b,
  );
  if (strikes.length === 0) return null;

  const calls = contracts.filter((c) => c.optionType === "CE");
  const puts = contracts.filter((c) => c.optionType === "PE");

  let minPain = Infinity;
  let maxPainStrike = strikes[0];

  for (const candidate of strikes) {
    let pain = 0;
    for (const call of calls) {
      const oi = call.oi ?? 0;
      pain += oi * Math.max(0, candidate - call.strike);
    }
    for (const put of puts) {
      const oi = put.oi ?? 0;
      pain += oi * Math.max(0, put.strike - candidate);
    }
    if (pain < minPain) {
      minPain = pain;
      maxPainStrike = candidate;
    }
  }

  return maxPainStrike;
}
