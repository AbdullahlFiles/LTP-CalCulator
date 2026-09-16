import type { AlertEvaluationContext } from "@ltp/core";
import type { ComputedOptionChain } from "./marketData";

/** Same narrowing pattern as `aiContext.ts`, for the alert-evaluation engine. */
export function toAlertContext(chain: ComputedOptionChain): AlertEvaluationContext {
  return {
    underlyingPrice: chain.underlyingPrice,
    importantStrikes: chain.importantStrikes,
    unusualActivity: chain.unusualActivity,
    contracts: chain.contracts.map((c) => ({
      strike: c.strike,
      optionType: c.optionType,
      ltp: c.ltp,
      ltpChangePercent: c.ltpChange.percentChange,
      oi: c.oi,
      oiChangePercent: c.oiChange.percentChange,
      volume: c.volume,
      iv: c.iv,
    })),
  };
}
