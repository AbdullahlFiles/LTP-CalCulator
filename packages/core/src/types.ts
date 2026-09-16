/**
 * Domain types for the deterministic calculation engine.
 *
 * These types describe already-normalized market data (see @ltp/market-data).
 * Every numeric field is `number | null` — `null` means "not available from
 * the provider for this contract", and callers must treat it as unknown, not
 * as zero. This engine never invents a value for a missing field.
 */

export type OptionType = "CE" | "PE";

export interface Greeks {
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
}

export interface ContractQuote {
  instrument: string;
  expiry: string; // ISO date, e.g. "2026-09-25"
  strike: number;
  optionType: OptionType;
  /** Last traded price for this contract. */
  ltp: number | null;
  /** Previous session's closing price for this contract, used for change/%change. */
  prevClose: number | null;
  /** Current open interest. */
  oi: number | null;
  /** Previous session's closing open interest, used for change-in-OI. */
  prevOi: number | null;
  /** Traded volume for the current session. */
  volume: number | null;
  /** Implied volatility, as a percentage (e.g. 18.5 for 18.5%). */
  iv: number | null;
  bid: number | null;
  ask: number | null;
  greeks: Greeks | null;
  /** ISO timestamp of when this quote was last updated by the provider. */
  asOf: string;
}

export interface OptionChainSnapshot {
  instrument: string;
  expiry: string;
  /** Current underlying (spot/futures) price used for ATM/ITM/OTM classification. */
  underlyingPrice: number;
  asOf: string;
  contracts: ContractQuote[];
}

export type Moneyness = "ATM" | "ITM" | "OTM";

export interface ChangeResult {
  change: number | null;
  percentChange: number | null;
}
