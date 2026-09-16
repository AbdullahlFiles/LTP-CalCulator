import type { ContractQuote, OptionChainSnapshot, OptionType } from "@ltp/core";
import type { MarketDataProvider } from "./provider";

/** Deterministic seeded PRNG (mulberry32) so tests and local dev are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MockInstrumentConfig {
  basePrice: number;
  strikeStep: number;
  strikeCount: number; // strikes on each side of ATM
}

const MOCK_INSTRUMENTS: Record<string, MockInstrumentConfig> = {
  NIFTY: { basePrice: 25000, strikeStep: 50, strikeCount: 10 },
  BANKNIFTY: { basePrice: 52000, strikeStep: 100, strikeCount: 10 },
  FINNIFTY: { basePrice: 23000, strikeStep: 50, strikeCount: 10 },
};

/**
 * A synthetic MarketDataProvider used for local development, UI work, and
 * integration tests before a licensed real-data provider is wired in
 * (Phase 2). It implements the exact same `MarketDataProvider` interface a
 * real adapter would, which is the point: swapping this for a real provider
 * later should require zero changes anywhere else in the system.
 *
 * The data is clearly synthetic (see `name`) and must never be presented to
 * end users as real market data.
 */
export class MockProvider implements MarketDataProvider {
  readonly name = "mock";
  private healthy = false;
  private rng: () => number;
  private tick = 0;

  constructor(seed = 42) {
    this.rng = mulberry32(seed);
  }

  async connect(): Promise<void> {
    this.healthy = true;
  }

  async disconnect(): Promise<void> {
    this.healthy = false;
  }

  isHealthy(): boolean {
    return this.healthy;
  }

  async getSnapshot(instrument: string, expiry: string): Promise<OptionChainSnapshot> {
    return this.generateSnapshot(instrument, expiry);
  }

  subscribe(
    instrument: string,
    expiry: string,
    onUpdate: (snapshot: OptionChainSnapshot) => void,
    intervalMs = 3000,
  ): () => void {
    const timer = setInterval(() => {
      onUpdate(this.generateSnapshot(instrument, expiry));
    }, intervalMs);
    return () => clearInterval(timer);
  }

  private generateSnapshot(instrument: string, expiry: string): OptionChainSnapshot {
    const config = MOCK_INSTRUMENTS[instrument] ?? MOCK_INSTRUMENTS.NIFTY;
    this.tick += 1;

    const drift = (this.rng() - 0.5) * config.strikeStep * 2;
    const underlyingPrice = Math.round(config.basePrice + drift);

    const atmStrike =
      Math.round(underlyingPrice / config.strikeStep) * config.strikeStep;

    const contracts: ContractQuote[] = [];
    const asOf = new Date().toISOString();

    for (
      let i = -config.strikeCount;
      i <= config.strikeCount;
      i++
    ) {
      const strike = atmStrike + i * config.strikeStep;
      for (const optionType of ["CE", "PE"] as OptionType[]) {
        contracts.push(this.generateContract(instrument, expiry, strike, optionType, underlyingPrice, asOf));
      }
    }

    return { instrument, expiry, underlyingPrice, asOf, contracts };
  }

  private generateContract(
    instrument: string,
    expiry: string,
    strike: number,
    optionType: OptionType,
    underlyingPrice: number,
    asOf: string,
  ): ContractQuote {
    const distance = Math.abs(strike - underlyingPrice);
    const intrinsic =
      optionType === "CE"
        ? Math.max(0, underlyingPrice - strike)
        : Math.max(0, strike - underlyingPrice);
    const timeValue = Math.max(5, 200 - distance * 0.05) * (0.5 + this.rng());
    const ltp = Math.round((intrinsic + timeValue) * 100) / 100;
    const prevClose = Math.round(ltp * (0.9 + this.rng() * 0.2) * 100) / 100;

    const baseOi = Math.round(50000 * Math.exp(-distance / 500) * (0.7 + this.rng() * 0.6));
    const prevOi = Math.round(baseOi * (0.8 + this.rng() * 0.4));
    const volume = Math.round(baseOi * (0.1 + this.rng() * 0.3));

    const iv = Math.round((12 + distance * 0.01 + this.rng() * 6) * 100) / 100;
    const spread = Math.max(0.05, ltp * 0.002);

    return {
      instrument,
      expiry,
      strike,
      optionType,
      ltp,
      prevClose,
      oi: baseOi,
      prevOi,
      volume,
      iv,
      bid: Math.round((ltp - spread) * 100) / 100,
      ask: Math.round((ltp + spread) * 100) / 100,
      greeks: {
        // ~0.5 (CE) / ~-0.5 (PE) at ATM, trending toward +-1 deep ITM and
        // 0 deep OTM — a rough shape, not a real pricing-model delta.
        delta:
          optionType === "CE"
            ? Math.round(
                Math.min(1, Math.max(0, 0.5 + (underlyingPrice - strike) / 1000)) * 100,
              ) / 100
            : Math.round(
                Math.min(0, Math.max(-1, -0.5 + (underlyingPrice - strike) / 1000)) * 100,
              ) / 100,
        gamma: Math.round((0.001 + this.rng() * 0.002) * 10000) / 10000,
        theta: Math.round(-(5 + this.rng() * 10) * 100) / 100,
        vega: Math.round((10 + this.rng() * 20) * 100) / 100,
      },
      asOf,
    };
  }
}
