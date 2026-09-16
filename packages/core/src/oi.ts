import type { ChangeResult, ContractQuote } from "./types";

/**
 * Change in Open Interest and its percentage, relative to the previous
 * session's closing OI (the standard "Chng in OI" metric used on NSE-style
 * option chains — an intraday comparison against the prior day's close, not
 * a tick-to-tick delta).
 */
export function computeOiChange(
  oi: number | null,
  prevOi: number | null,
): ChangeResult {
  if (oi === null || prevOi === null) {
    return { change: null, percentChange: null };
  }
  const change = oi - prevOi;
  if (prevOi === 0) {
    return { change, percentChange: null };
  }
  return { change, percentChange: (change / prevOi) * 100 };
}

export function computeContractOiChange(quote: ContractQuote): ChangeResult {
  return computeOiChange(quote.oi, quote.prevOi);
}
