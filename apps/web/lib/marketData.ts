import {
  classifyMoneyness,
  computeContractLtpChange,
  computeContractOiChange,
  computeMarketSummary,
  computeMaxPain,
  computePcr,
  detectBuildup,
  detectImportantStrikes,
  detectSupportResistance,
  detectUnusualActivity,
  findAtmStrike,
  type BuildupSignal,
  type ChangeResult,
  type ContractQuote,
  type Moneyness,
} from "@ltp/core";
import { validateSnapshot } from "@ltp/market-data";
import { ensureProviderConnected, provider } from "./provider";

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
  unusualActivity: ReturnType<typeof detectUnusualActivity>;
  marketSummary: ReturnType<typeof computeMarketSummary>;
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
  await ensureProviderConnected();

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

  const pcr = computePcr(sanitized.contracts);
  const maxPain = computeMaxPain(sanitized.contracts);

  return {
    instrument: sanitized.instrument,
    expiry: sanitized.expiry,
    underlyingPrice: sanitized.underlyingPrice,
    atmStrike,
    asOf: sanitized.asOf,
    stale,
    pcr,
    maxPain,
    contracts,
    supportResistance: detectSupportResistance(sanitized.contracts),
    importantStrikes: detectImportantStrikes(sanitized.contracts),
    unusualActivity: detectUnusualActivity(sanitized.contracts),
    marketSummary: computeMarketSummary({
      pcr,
      maxPain,
      underlyingPrice: sanitized.underlyingPrice,
      atmStrike,
    }),
    dataSource: provider.name,
  };
}
