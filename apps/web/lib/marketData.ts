import {
  classifyMoneyness,
  computeContractLtpChange,
  computeContractOiChange,
  computeMaxPain,
  computePcr,
  detectBuildup,
  detectImportantStrikes,
  detectSupportResistance,
  findAtmStrike,
  type BuildupSignal,
  type ChangeResult,
  type ContractQuote,
  type Moneyness,
} from "@ltp/core";
import { MockProvider, validateSnapshot } from "@ltp/market-data";

/**
 * A single MockProvider instance for the whole server process.
 *
 * This is a Phase 4 (MVP) simplification, not the target architecture: the
 * Phase 1 design (docs/phase-1/README.md) calls for a dedicated
 * `apps/realtime-gateway` process that owns the provider connection and
 * publishes computed state through Redis, with `apps/web` only reading from
 * Redis/Postgres. Wiring that up is deferred until a real (licensed)
 * provider replaces MockProvider — building the Redis/gateway plumbing
 * around synthetic data now would be speculative infrastructure the spec
 * explicitly warns against.
 */
const provider = new MockProvider();
let connected = false;

async function ensureConnected(): Promise<void> {
  if (!connected) {
    await provider.connect();
    connected = true;
  }
}

export interface ComputedContract extends ContractQuote {
  ltpChange: ChangeResult;
  oiChange: ChangeResult;
  moneyness: Moneyness;
  buildup: BuildupSignal;
}

export interface ComputedOptionChain {
  instrument: string;
  expiry: string;
  underlyingPrice: number;
  atmStrike: number | null;
  asOf: string;
  stale: boolean;
  pcr: number | null;
  maxPain: number | null;
  contracts: ComputedContract[];
  supportResistance: ReturnType<typeof detectSupportResistance>;
  importantStrikes: ReturnType<typeof detectImportantStrikes>;
  dataSource: string;
}

const STALE_AFTER_MS = 15_000;

/**
 * Fetches a snapshot from the provider, validates it, and runs every
 * contract and every chain-level metric through the deterministic
 * calculation engine (@ltp/core). This is the only place apps/web talks to
 * a market-data provider directly — every UI/API surface below this
 * function only ever sees `ComputedOptionChain`.
 */
export async function getComputedOptionChain(
  instrument: string,
  expiry: string,
): Promise<ComputedOptionChain> {
  await ensureConnected();

  const raw = await provider.getSnapshot(instrument, expiry);
  const { sanitized, valid, issues } = validateSnapshot(raw);

  if (!valid) {
    throw new Error(
      `Received an unusable snapshot from provider "${provider.name}": ${issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }

  const strikes = Array.from(new Set(sanitized.contracts.map((c) => c.strike)));
  const atmStrike = findAtmStrike(sanitized.underlyingPrice, strikes);

  const contracts: ComputedContract[] = sanitized.contracts
    .map((quote) => ({
      ...quote,
      ltpChange: computeContractLtpChange(quote),
      oiChange: computeContractOiChange(quote),
      moneyness:
        atmStrike === null
          ? ("OTM" as Moneyness)
          : classifyMoneyness(
              quote.strike,
              quote.optionType,
              atmStrike,
              sanitized.underlyingPrice,
            ),
      buildup: detectBuildup(quote),
    }))
    .sort((a, b) => a.strike - b.strike);

  const asOfMs = new Date(sanitized.asOf).getTime();
  const stale = Number.isNaN(asOfMs) || Date.now() - asOfMs > STALE_AFTER_MS;

  return {
    instrument: sanitized.instrument,
    expiry: sanitized.expiry,
    underlyingPrice: sanitized.underlyingPrice,
    atmStrike,
    asOf: sanitized.asOf,
    stale,
    pcr: computePcr(sanitized.contracts),
    maxPain: computeMaxPain(sanitized.contracts),
    contracts,
    supportResistance: detectSupportResistance(sanitized.contracts),
    importantStrikes: detectImportantStrikes(sanitized.contracts),
    dataSource: provider.name,
  };
}
