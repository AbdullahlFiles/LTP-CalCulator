import { MockProvider } from "@ltp/market-data";

/**
 * A single MockProvider instance for the whole server process, shared by
 * `marketData.ts` (live reads) and `historicalCollector.ts` (periodic
 * sampling) so they see the same seeded, deterministic data sequence
 * instead of two independent RNG streams. See the Phase 4 note in
 * `docs/phase-4/README.md` for why this is a single in-process provider
 * rather than the target Redis/gateway architecture.
 */
export const provider = new MockProvider();

let connected = false;

export async function ensureProviderConnected(): Promise<void> {
  if (!connected) {
    await provider.connect();
    connected = true;
  }
}
