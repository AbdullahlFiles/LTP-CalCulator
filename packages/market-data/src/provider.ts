import type { OptionChainSnapshot } from "@ltp/core";

/**
 * The interface every market-data provider adapter must implement.
 *
 * This is the seam the Phase 0/1 architecture requires: no code outside a
 * concrete provider implementation (e.g. MockProvider, or a future licensed
 * NSE data-vendor adapter) may depend on a specific vendor SDK or payload
 * shape. Everything else in the system — the calculation engine, the API
 * layer, the frontend — depends only on this interface and on the
 * `OptionChainSnapshot` type from `@ltp/core`.
 */
export interface MarketDataProvider {
  readonly name: string;

  /** Establish the underlying connection (HTTP session, WebSocket, etc). */
  connect(): Promise<void>;

  /** Tear down the underlying connection. */
  disconnect(): Promise<void>;

  /** One-shot fetch of the current option chain for an instrument/expiry. */
  getSnapshot(instrument: string, expiry: string): Promise<OptionChainSnapshot>;

  /**
   * Subscribe to ongoing updates for an instrument/expiry. Returns an
   * unsubscribe function. The provider is responsible for calling `onUpdate`
   * with a full, normalized snapshot each time it has new data — partial/diff
   * updates are the provider adapter's problem to reassemble, not the
   * caller's.
   */
  subscribe(
    instrument: string,
    expiry: string,
    onUpdate: (snapshot: OptionChainSnapshot) => void,
  ): () => void;

  /** Health check used by the ingestion service's monitoring/circuit breaker. */
  isHealthy(): boolean;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
