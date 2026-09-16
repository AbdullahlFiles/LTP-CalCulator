export type BillablePlan = "PREMIUM";

export interface CheckoutSessionResult {
  /** "redirect": the caller must send the user to `redirectUrl` (real
   * payment provider). "immediate": the plan change already happened —
   * only the dev/demo provider returns this. */
  mode: "redirect" | "immediate";
  redirectUrl?: string;
}

export interface CancelResult {
  mode: "immediate" | "scheduled";
  /** For "scheduled" (real providers usually cancel at period end, not instantly). */
  effectiveAt?: string;
}

/**
 * The provider abstraction billing goes through — same pattern as
 * `@ltp/ai`'s `AiProvider` and `@ltp/market-data`'s `MarketDataProvider`:
 * nothing outside `packages/billing` and its factory (`getBillingProvider`)
 * should import a concrete provider class directly.
 */
export interface BillingProvider {
  readonly name: string;
  createCheckoutSession(input: {
    userId: string;
    userEmail: string;
    targetPlan: BillablePlan;
  }): Promise<CheckoutSessionResult>;
  cancelSubscription(input: { userId: string }): Promise<CancelResult>;
}
