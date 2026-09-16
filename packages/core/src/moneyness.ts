import type { Moneyness, OptionType } from "./types";

/**
 * Finds the strike closest to the underlying price. On a tie, the lower
 * strike is preferred (arbitrary but deterministic and documented).
 * Returns null if `strikes` is empty.
 */
export function findAtmStrike(
  underlyingPrice: number,
  strikes: number[],
): number | null {
  if (strikes.length === 0) return null;
  let best = strikes[0];
  let bestDistance = Math.abs(strikes[0] - underlyingPrice);
  for (const strike of strikes.slice(1)) {
    const distance = Math.abs(strike - underlyingPrice);
    if (
      distance < bestDistance ||
      (distance === bestDistance && strike < best)
    ) {
      best = strike;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Classifies a single strike/optionType pair as ATM, ITM or OTM.
 *
 * - A Call is ITM when its strike is below the underlying price, OTM when above.
 * - A Put is ITM when its strike is above the underlying price, OTM when below.
 * - Either is ATM when its strike equals the chain's ATM strike (nearest to spot).
 */
export function classifyMoneyness(
  strike: number,
  optionType: OptionType,
  atmStrike: number,
  underlyingPrice: number,
): Moneyness {
  if (strike === atmStrike) return "ATM";
  if (optionType === "CE") {
    return strike < underlyingPrice ? "ITM" : "OTM";
  }
  return strike > underlyingPrice ? "ITM" : "OTM";
}
