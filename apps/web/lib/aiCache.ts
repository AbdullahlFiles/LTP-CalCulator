import {
  explainWithFallback,
  getAiProvider,
  isSignificantChange,
  type ChangeSnapshot,
  type ExplanationMode,
  type MarketContext,
  type StructuredExplanation,
} from "@ltp/ai";

/**
 * In-memory significant-change gate + explanation cache, per instrument
 * per expiry per mode. This implements the AI Cost-Control Strategy from
 * docs/phase-0 (§11): don't call an AI provider on every request — only
 * when the underlying data has moved enough to matter (`isSignificantChange`,
 * @ltp/ai), and cache the result meanwhile.
 *
 * Same caveat as `historicalCollector.ts` (docs/phase-6/README.md): this is
 * process-local state, fine for the current single long-lived Node process,
 * not valid on a stateless/serverless deployment target — that's the same
 * Phase 13 deployment decision, not re-derived here. In the target
 * architecture this cache is Redis (`ai:explanation:{hash}` per
 * docs/phase-1/README.md §7), shared across instances.
 */
const EXPLANATION_TTL_MS = 5 * 60 * 1000;

interface CachedExplanation {
  explanation: StructuredExplanation;
  cachedAt: number;
}

interface CacheEntry {
  snapshot: ChangeSnapshot;
  explanations: Partial<Record<ExplanationMode, CachedExplanation>>;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(instrument: string, expiry: string): string {
  return `${instrument}:${expiry}`;
}

function isFresh(cached: CachedExplanation): boolean {
  return Date.now() - cached.cachedAt < EXPLANATION_TTL_MS;
}

export interface ExplanationResult {
  explanation: StructuredExplanation;
  /** True if this came from cache without a new provider call. */
  cacheHit: boolean;
}

/**
 * Returns a cached explanation when the data hasn't moved significantly
 * and the cache entry hasn't expired; otherwise calls the configured AI
 * provider (with validation + fallback, via `explainWithFallback`) and
 * caches the result.
 */
export async function getOrGenerateExplanation(
  instrument: string,
  expiry: string,
  context: MarketContext,
  mode: ExplanationMode,
  options: { force?: boolean } = {},
): Promise<ExplanationResult> {
  const key = cacheKey(instrument, expiry);
  const entry = cache.get(key);
  const currentSnapshot: ChangeSnapshot = {
    underlyingPrice: context.underlyingPrice,
    pcr: context.pcr,
    maxPain: context.maxPain,
  };

  const cachedForMode = entry?.explanations[mode];
  const significant = isSignificantChange(entry?.snapshot ?? null, currentSnapshot);

  if (!options.force && cachedForMode && isFresh(cachedForMode) && !significant) {
    return { explanation: cachedForMode.explanation, cacheHit: true };
  }

  const provider = getAiProvider();
  const explanation = await explainWithFallback(provider, context, mode);

  const nextEntry: CacheEntry = {
    snapshot: currentSnapshot,
    explanations: { ...entry?.explanations, [mode]: { explanation, cachedAt: Date.now() } },
  };
  cache.set(key, nextEntry);

  return { explanation, cacheHit: false };
}
