import type { MarketContext } from "./types";

export function makeContext(overrides: Partial<MarketContext> = {}): MarketContext {
  return {
    instrument: "NIFTY",
    expiry: "2026-09-25",
    underlyingPrice: 25000,
    atmStrike: 25000,
    asOf: "2026-09-16T10:00:00.000Z",
    stale: false,
    pcr: 1.05,
    maxPain: 25000,
    topResistance: [{ strike: 25100, oi: 50000 }],
    topSupport: [{ strike: 24900, oi: 48000 }],
    importantStrikes: [{ strike: 25000, reason: "highest-call-oi", value: 50000 }],
    unusualActivity: [],
    contracts: [
      {
        strike: 25000,
        optionType: "CE",
        ltp: 150,
        ltpChangePercent: 5,
        oi: 40000,
        oiChangePercent: 3,
        volume: 10000,
        iv: 15,
        moneyness: "ATM",
        buildup: "long-buildup",
      },
    ],
    ...overrides,
  };
}
