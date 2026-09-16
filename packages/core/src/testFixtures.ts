import type { ContractQuote, OptionType } from "./types";

export function makeQuote(overrides: Partial<ContractQuote> = {}): ContractQuote {
  return {
    instrument: "NIFTY",
    expiry: "2026-09-25",
    strike: 25000,
    optionType: "CE" as OptionType,
    ltp: 100,
    prevClose: 90,
    oi: 1000,
    prevOi: 900,
    volume: 5000,
    iv: 15,
    bid: 99,
    ask: 101,
    greeks: { delta: 0.5, gamma: 0.001, theta: -2, vega: 10 },
    asOf: "2026-09-16T10:00:00.000Z",
    ...overrides,
  };
}
