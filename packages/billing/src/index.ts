export * from "./types";
export { DevBillingProvider } from "./providers/devProvider";
export { StripeBillingProvider, handleStripeWebhook } from "./providers/stripeProvider";

import { DevBillingProvider } from "./providers/devProvider";
import { StripeBillingProvider } from "./providers/stripeProvider";
import type { BillingProvider } from "./types";

/**
 * The single factory the rest of the codebase gets a billing provider
 * from — same pattern as `@ltp/ai`'s `getAiProvider()`. Picks Stripe only
 * when a real secret key and price id are configured; otherwise the
 * dev/demo provider, which refuses to run in production (see
 * `DevBillingProvider`).
 */
export function getBillingProvider(): BillingProvider {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (secretKey && priceId) {
    return new StripeBillingProvider(secretKey, priceId, siteUrl);
  }
  return new DevBillingProvider();
}
