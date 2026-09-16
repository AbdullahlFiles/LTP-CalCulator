import { afterEach, describe, expect, it } from "vitest";
import { getBillingProvider } from "./index";

describe("getBillingProvider", () => {
  const originalSecretKey = process.env.STRIPE_SECRET_KEY;
  const originalPriceId = process.env.STRIPE_PRICE_ID_PREMIUM;

  afterEach(() => {
    if (originalSecretKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalSecretKey;
    if (originalPriceId === undefined) delete process.env.STRIPE_PRICE_ID_PREMIUM;
    else process.env.STRIPE_PRICE_ID_PREMIUM = originalPriceId;
  });

  it("falls back to the dev provider when Stripe isn't configured", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_ID_PREMIUM;
    expect(getBillingProvider().name).toBe("dev");
  });

  it("falls back to the dev provider when only the secret key is set (price id missing)", () => {
    process.env.STRIPE_SECRET_KEY = "sk-test-not-real";
    delete process.env.STRIPE_PRICE_ID_PREMIUM;
    expect(getBillingProvider().name).toBe("dev");
  });

  it("never fabricates credentials — only picks Stripe when both are genuinely set", () => {
    process.env.STRIPE_SECRET_KEY = "sk-test-not-real";
    process.env.STRIPE_PRICE_ID_PREMIUM = "price_test_not_real";
    expect(getBillingProvider().name).toBe("stripe");
  });
});
