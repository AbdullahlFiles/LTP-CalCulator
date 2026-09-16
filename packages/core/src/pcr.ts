import type { ContractQuote } from "./types.js";

/**
 * Put-Call Ratio = total Put OI / total Call OI.
 *
 * Contracts with a null OI are excluded from both sums (treated as unknown,
 * not zero). Returns null if there is no usable data, or if total Call OI is
 * zero (division by zero is undefined, not an infinite/0 ratio).
 */
export function computePcr(contracts: ContractQuote[]): number | null {
  let putOi = 0;
  let callOi = 0;
  let sawAny = false;
  for (const c of contracts) {
    if (c.oi === null) continue;
    sawAny = true;
    if (c.optionType === "PE") putOi += c.oi;
    else callOi += c.oi;
  }
  if (!sawAny || callOi === 0) return null;
  return putOi / callOi;
}

export interface StrikePcr {
  strike: number;
  pcr: number | null;
}

/** PCR computed independently at each strike present in the chain. */
export function computeStrikeWisePcr(contracts: ContractQuote[]): StrikePcr[] {
  const byStrike = new Map<number, ContractQuote[]>();
  for (const c of contracts) {
    const list = byStrike.get(c.strike) ?? [];
    list.push(c);
    byStrike.set(c.strike, list);
  }
  return Array.from(byStrike.entries())
    .map(([strike, group]) => ({ strike, pcr: computePcr(group) }))
    .sort((a, b) => a.strike - b.strike);
}
