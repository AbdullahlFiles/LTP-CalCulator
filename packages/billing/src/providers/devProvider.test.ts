import { afterEach, describe, expect, it } from "vitest";
import { DevBillingProvider } from "./devProvider";

describe("DevBillingProvider — production guard", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("refuses to grant a free upgrade in production", async () => {
    process.env.NODE_ENV = "production";
    const provider = new DevBillingProvider();
    await expect(
      provider.createCheckoutSession({ userId: "u1", userEmail: "a@example.com" }),
    ).rejects.toThrow(/production/i);
  });

  it("refuses to cancel in production too (same code path, same guard)", async () => {
    process.env.NODE_ENV = "production";
    const provider = new DevBillingProvider();
    await expect(provider.cancelSubscription({ userId: "u1" })).rejects.toThrow(/production/i);
  });
});
