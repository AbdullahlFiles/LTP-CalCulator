import type { ContractQuote } from "./types";

export interface StrikeLevel {
  strike: number;
  oi: number;
}

/**
 * Rule-based support/resistance from OI concentration:
 * - Resistance candidates = strikes with the highest Call OI (call writers
 *   are positioned expecting price to stay below these strikes).
 * - Support candidates = strikes with the highest Put OI (put writers are
 *   positioned expecting price to stay above these strikes).
 *
 * Returns the top `count` strikes for each side, descending by OI. Contracts
 * with null OI are excluded (not treated as zero) since they carry no signal.
 */
export function detectSupportResistance(
  contracts: ContractQuote[],
  count = 3,
): { support: StrikeLevel[]; resistance: StrikeLevel[] } {
  const puts = contracts.filter(
    (c) => c.optionType === "PE" && c.oi !== null,
  ) as (ContractQuote & { oi: number })[];
  const calls = contracts.filter(
    (c) => c.optionType === "CE" && c.oi !== null,
  ) as (ContractQuote & { oi: number })[];

  const rank = (list: (ContractQuote & { oi: number })[]): StrikeLevel[] =>
    [...list]
      .sort((a, b) => b.oi - a.oi)
      .slice(0, count)
      .map((c) => ({ strike: c.strike, oi: c.oi }));

  return {
    support: rank(puts),
    resistance: rank(calls),
  };
}

export interface ImportantStrike {
  strike: number;
  reason: "highest-call-oi" | "highest-put-oi" | "highest-oi-change";
  value: number;
}

/**
 * Important strikes: the top strikes by Call OI, Put OI, and by absolute
 * change in OI (in either direction), merged into one ranked list. A strike
 * can appear more than once with different reasons.
 */
export function detectImportantStrikes(
  contracts: ContractQuote[],
  count = 3,
): ImportantStrike[] {
  const withOi = contracts.filter(
    (c): c is ContractQuote & { oi: number } => c.oi !== null,
  );
  const withOiChange = contracts.filter(
    (c): c is ContractQuote & { oi: number; prevOi: number } =>
      c.oi !== null && c.prevOi !== null,
  );

  const topCallOi = withOi
    .filter((c) => c.optionType === "CE")
    .sort((a, b) => b.oi - a.oi)
    .slice(0, count)
    .map((c): ImportantStrike => ({
      strike: c.strike,
      reason: "highest-call-oi",
      value: c.oi,
    }));

  const topPutOi = withOi
    .filter((c) => c.optionType === "PE")
    .sort((a, b) => b.oi - a.oi)
    .slice(0, count)
    .map((c): ImportantStrike => ({
      strike: c.strike,
      reason: "highest-put-oi",
      value: c.oi,
    }));

  const topOiChange = withOiChange
    .map((c) => ({ strike: c.strike, change: Math.abs(c.oi - c.prevOi) }))
    .sort((a, b) => b.change - a.change)
    .slice(0, count)
    .map((c): ImportantStrike => ({
      strike: c.strike,
      reason: "highest-oi-change",
      value: c.change,
    }));

  return [...topCallOi, ...topPutOi, ...topOiChange];
}
