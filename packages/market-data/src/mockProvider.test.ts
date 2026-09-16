import { describe, expect, it, vi } from "vitest";
import { MockProvider } from "./mockProvider.js";
import { validateSnapshot } from "./validate.js";

describe("MockProvider", () => {
  it("is unhealthy until connected", async () => {
    const provider = new MockProvider();
    expect(provider.isHealthy()).toBe(false);
    await provider.connect();
    expect(provider.isHealthy()).toBe(true);
    await provider.disconnect();
    expect(provider.isHealthy()).toBe(false);
  });

  it("produces a snapshot that passes validation", async () => {
    const provider = new MockProvider();
    const snapshot = await provider.getSnapshot("NIFTY", "2026-09-25");
    expect(snapshot.instrument).toBe("NIFTY");
    expect(snapshot.contracts.length).toBeGreaterThan(0);
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });

  it("produces both CE and PE for every generated strike", async () => {
    const provider = new MockProvider();
    const snapshot = await provider.getSnapshot("BANKNIFTY", "2026-09-25");
    const strikes = new Set(snapshot.contracts.map((c) => c.strike));
    for (const strike of strikes) {
      const forStrike = snapshot.contracts.filter((c) => c.strike === strike);
      expect(forStrike.map((c) => c.optionType).sort()).toEqual(["CE", "PE"]);
    }
  });

  it("is deterministic for a given seed", async () => {
    const a = await new MockProvider(1).getSnapshot("NIFTY", "2026-09-25");
    const b = await new MockProvider(1).getSnapshot("NIFTY", "2026-09-25");
    expect(a.underlyingPrice).toBe(b.underlyingPrice);
    expect(a.contracts[0].ltp).toBe(b.contracts[0].ltp);
  });

  it("subscribe delivers periodic updates and unsubscribe stops them", () => {
    vi.useFakeTimers();
    const provider = new MockProvider();
    const onUpdate = vi.fn();
    const unsubscribe = provider.subscribe("NIFTY", "2026-09-25", onUpdate, 1000);

    vi.advanceTimersByTime(3000);
    expect(onUpdate).toHaveBeenCalledTimes(3);

    unsubscribe();
    vi.advanceTimersByTime(3000);
    expect(onUpdate).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });
});
