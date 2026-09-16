import { describe, expect, it } from "vitest";
import { isSignificantChange } from "./significantChange";

describe("isSignificantChange", () => {
  it("is always significant when there is no previous snapshot", () => {
    expect(isSignificantChange(null, { underlyingPrice: 25000, pcr: 1, maxPain: 25000 })).toBe(true);
  });

  it("is not significant when nothing meaningfully changed", () => {
    const previous = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25000 };
    const current = { underlyingPrice: 25005, pcr: 1.02, maxPain: 25000 };
    expect(isSignificantChange(previous, current)).toBe(false);
  });

  it("is significant on a large underlying price move", () => {
    const previous = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25000 };
    const current = { underlyingPrice: 25100, pcr: 1.0, maxPain: 25000 }; // 0.4% move
    expect(isSignificantChange(previous, current)).toBe(true);
  });

  it("is significant on a large PCR move", () => {
    const previous = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25000 };
    const current = { underlyingPrice: 25000, pcr: 1.2, maxPain: 25000 };
    expect(isSignificantChange(previous, current)).toBe(true);
  });

  it("is significant when Max Pain strike itself changes", () => {
    const previous = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25000 };
    const current = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25050 };
    expect(isSignificantChange(previous, current)).toBe(true);
  });

  it("respects custom thresholds", () => {
    const previous = { underlyingPrice: 25000, pcr: 1.0, maxPain: 25000 };
    const current = { underlyingPrice: 25010, pcr: 1.0, maxPain: 25000 }; // 0.04% move
    expect(
      isSignificantChange(previous, current, { underlyingPricePercent: 0.01, pcrAbsolute: 0.1 }),
    ).toBe(true);
  });
});
