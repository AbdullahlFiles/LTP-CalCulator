import { describe, expect, it } from "vitest";
import { computeMarketSummary, detectUnusualActivity } from "./chainSummary";
import { makeQuote } from "./testFixtures";

describe("detectUnusualActivity", () => {
  it("flags a contract with volume far above the chain average", () => {
    const baseline = [25000, 25050, 25100, 25150, 25250].map((strike) =>
      makeQuote({ strike, optionType: "CE", volume: 1000 }),
    );
    const outlier = makeQuote({ strike: 25200, optionType: "CE", volume: 50000 });
    const flagged = detectUnusualActivity([...baseline, outlier], 3);
    expect(
      flagged.some((f) => f.strike === 25200 && f.reason === "unusual-volume"),
    ).toBe(true);
    expect(
      flagged.some((f) => f.strike === 25000 && f.reason === "unusual-volume"),
    ).toBe(false);
  });

  it("flags a contract with an OI change far above the chain average", () => {
    const baseline = [25000, 25050, 25100, 25150, 25250].map((strike) =>
      makeQuote({ strike, optionType: "PE", oi: 1050, prevOi: 1000 }),
    );
    const outlier = makeQuote({ strike: 25200, optionType: "PE", oi: 6000, prevOi: 1000 });
    const flagged = detectUnusualActivity([...baseline, outlier], 3);
    expect(
      flagged.some((f) => f.strike === 25200 && f.reason === "unusual-oi-change"),
    ).toBe(true);
  });

  it("returns no flags when there is no data", () => {
    expect(detectUnusualActivity([])).toEqual([]);
  });
});

describe("computeMarketSummary", () => {
  it("reads a high PCR as a bullish OI lean, with hedged language", () => {
    const summary = computeMarketSummary({
      pcr: 1.8,
      maxPain: 25000,
      underlyingPrice: 25000,
      atmStrike: 25000,
    });
    expect(summary.points.some((p) => /bullish/.test(p))).toBe(true);
    expect(summary.points.some((p) => /not a guaranteed direction/.test(p))).toBe(true);
  });

  it("reads a low PCR as a bearish OI lean", () => {
    const summary = computeMarketSummary({
      pcr: 0.4,
      maxPain: null,
      underlyingPrice: 25000,
      atmStrike: 25000,
    });
    expect(summary.points.some((p) => /bearish/.test(p))).toBe(true);
  });

  it("never claims a guaranteed outcome from Max Pain", () => {
    const summary = computeMarketSummary({
      pcr: null,
      maxPain: 24800,
      underlyingPrice: 25000,
      atmStrike: 25000,
    });
    expect(summary.points.some((p) => /may.*not.*will/.test(p))).toBe(true);
  });

  it("returns a fallback headline when there is nothing to summarize", () => {
    const summary = computeMarketSummary({
      pcr: null,
      maxPain: null,
      underlyingPrice: 25000,
      atmStrike: null,
    });
    expect(summary.points).toEqual([]);
    expect(summary.headline).toMatch(/not enough data/i);
  });
});
