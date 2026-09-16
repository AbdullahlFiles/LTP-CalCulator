/**
 * The AI layer's only input contract. Deliberately independent of
 * `apps/web`'s `ComputedOptionChain` shape (this package must stay usable
 * from any caller, not just the current web app) and deliberately a
 * *subset* of the full chain — near-ATM contracts plus already-computed
 * chain-level metrics, never the raw provider payload. The AI never sees
 * anything this package's caller hasn't already run through
 * `@ltp/core`'s deterministic calculations and `@ltp/market-data`'s
 * validation.
 */
export interface MarketContextContract {
  strike: number;
  optionType: "CE" | "PE";
  ltp: number | null;
  ltpChangePercent: number | null;
  oi: number | null;
  oiChangePercent: number | null;
  volume: number | null;
  iv: number | null;
  moneyness: "ATM" | "ITM" | "OTM";
  buildup: "long-buildup" | "short-buildup" | "short-covering" | "long-unwinding" | "neutral";
}

export interface MarketContextLevel {
  strike: number;
  oi: number;
}

export interface MarketContextFlag {
  strike: number;
  optionType?: "CE" | "PE";
  reason: string;
  value: number;
}

export interface MarketContext {
  instrument: string;
  expiry: string;
  underlyingPrice: number;
  atmStrike: number | null;
  asOf: string;
  stale: boolean;
  pcr: number | null;
  maxPain: number | null;
  topResistance: MarketContextLevel[];
  topSupport: MarketContextLevel[];
  importantStrikes: MarketContextFlag[];
  unusualActivity: MarketContextFlag[];
  /** Near-ATM contracts only — keeps AI context bounded and cheap, per the cost-control rule in docs/phase-0/11 §AI cost-control. */
  contracts: MarketContextContract[];
}

export type ExplanationMode = "beginner" | "advanced";

/**
 * Every AI (and template) explanation is structured into these four
 * sections, per the project's global rule: DATA / CALCULATION /
 * INTERPRETATION / UNCERTAINTY must always be visually and structurally
 * distinct so a reader never mistakes interpretation for fact.
 */
export interface StructuredExplanation {
  data: string[];
  calculation: string[];
  interpretation: string[];
  uncertainty: string[];
  mode: ExplanationMode;
  /** Which provider actually produced this (e.g. "template", "anthropic:claude-sonnet-5") — always shown to the user, never hidden. */
  generatedBy: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * The provider abstraction the whole platform depends on instead of any
 * specific vendor SDK. `apps/web` (and any future caller) imports only
 * this interface and `getAiProvider()` — never a provider class directly —
 * so the model/vendor can change without touching calling code.
 */
export interface AiProvider {
  readonly name: string;
  explain(context: MarketContext, mode: ExplanationMode): Promise<StructuredExplanation>;
  chat(context: MarketContext, question: string, history: ChatMessage[]): Promise<string>;
}
