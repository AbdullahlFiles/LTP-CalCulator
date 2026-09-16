import type { ChangeResult, ContractQuote } from "./types.js";

/**
 * LTP change and percentage change, relative to the previous session's close.
 *
 * Formula: change = ltp - prevClose; percentChange = change / prevClose * 100.
 *
 * Returns nulls (never zero) when either input is missing, or when prevClose
 * is zero (division by zero is undefined, not "0% change").
 */
export function computeLtpChange(
  ltp: number | null,
  prevClose: number | null,
): ChangeResult {
  if (ltp === null || prevClose === null) {
    return { change: null, percentChange: null };
  }
  const change = ltp - prevClose;
  if (prevClose === 0) {
    return { change, percentChange: null };
  }
  return { change, percentChange: (change / prevClose) * 100 };
}

export function computeContractLtpChange(quote: ContractQuote): ChangeResult {
  return computeLtpChange(quote.ltp, quote.prevClose);
}
