import { describe, expect, it } from "vitest";
import { checkCapacity, getLimits } from "./index";

describe("getLimits", () => {
  it("gives Premium strictly higher limits than Free on every dimension", () => {
    const free = getLimits("FREE");
    const premium = getLimits("PREMIUM");
    for (const key of Object.keys(free) as (keyof typeof free)[]) {
      expect(premium[key]).toBeGreaterThan(free[key]);
    }
  });
});

describe("checkCapacity", () => {
  it("allows creation when under the limit", () => {
    const result = checkCapacity("FREE", "maxWatchlistItems", 3);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("blocks creation at the limit", () => {
    const limits = getLimits("FREE");
    const result = checkCapacity("FREE", "maxWatchlistItems", limits.maxWatchlistItems);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/limit reached/i);
  });

  it("mentions upgrading only for Free plan users", () => {
    const freeBlocked = checkCapacity("FREE", "maxActiveAlerts", getLimits("FREE").maxActiveAlerts);
    expect(freeBlocked.reason).toMatch(/upgrade/i);

    const premiumBlocked = checkCapacity(
      "PREMIUM",
      "maxActiveAlerts",
      getLimits("PREMIUM").maxActiveAlerts,
    );
    expect(premiumBlocked.reason).not.toMatch(/upgrade/i);
  });
});
