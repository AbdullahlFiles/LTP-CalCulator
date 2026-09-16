import type { MarketContext, MarketContextContract } from "@ltp/ai";
import type { ComputedOptionChain } from "./marketData";

const NEAR_ATM_STRIKE_WINDOW = 5;

/**
 * Maps the already-computed, already-validated chain into the AI layer's
 * input contract. This is the one place a raw `ComputedOptionChain` gets
 * narrowed down before reaching `@ltp/ai` — only near-ATM contracts go in,
 * both to keep the AI request small/cheap (see the AI cost-control note in
 * docs/phase-0/11) and because a far-OTM/deep-ITM contract rarely changes
 * the interpretation of "what's happening near the money."
 */
export function toMarketContext(chain: ComputedOptionChain): MarketContext {
  const strikes = Array.from(new Set(chain.contracts.map((c) => c.strike))).sort((a, b) => a - b);
  const atmIndex = chain.atmStrike !== null ? strikes.indexOf(chain.atmStrike) : -1;
  const nearAtmStrikes =
    atmIndex === -1
      ? new Set(strikes)
      : new Set(
          strikes.slice(
            Math.max(0, atmIndex - NEAR_ATM_STRIKE_WINDOW),
            atmIndex + NEAR_ATM_STRIKE_WINDOW + 1,
          ),
        );

  const contracts: MarketContextContract[] = chain.contracts
    .filter((c) => nearAtmStrikes.has(c.strike))
    .map((c) => ({
      strike: c.strike,
      optionType: c.optionType,
      ltp: c.ltp,
      ltpChangePercent: c.ltpChange.percentChange,
      oi: c.oi,
      oiChangePercent: c.oiChange.percentChange,
      volume: c.volume,
      iv: c.iv,
      moneyness: c.moneyness,
      buildup: c.buildup,
    }));

  return {
    instrument: chain.instrument,
    expiry: chain.expiry,
    underlyingPrice: chain.underlyingPrice,
    atmStrike: chain.atmStrike,
    asOf: chain.asOf,
    stale: chain.stale,
    pcr: chain.pcr,
    maxPain: chain.maxPain,
    topResistance: chain.supportResistance.resistance,
    topSupport: chain.supportResistance.support,
    importantStrikes: chain.importantStrikes,
    unusualActivity: chain.unusualActivity,
    contracts,
  };
}
