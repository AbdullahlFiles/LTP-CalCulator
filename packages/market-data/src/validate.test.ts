import { describe, expect, it } from "vitest";
import type { OptionChainSnapshot } from "@ltp/core";
import { validateSnapshot } from "./validate";

function baseSnapshot(overrides: Partial<OptionChainSnapshot> = {}): OptionChainSnapshot {
  return {
    instrument: "NIFTY",
    expiry: "2026-09-25",
    underlyingPrice: 25000,
    asOf: "2026-09-16T10:00:00.000Z",
    contracts: [
      {
        instrument: "NIFTY",
        expiry: "2026-09-25",
        strike: 25000,
        optionType: "CE",
        ltp: 100,
        prevClose: 90,
        oi: 1000,
        prevOi: 900,
        volume: 500,
        iv: 15,
        bid: 99,
        ask: 101,
        greeks: { delta: 0.5, gamma: 0.001, theta: -2, vega: 10 },
        asOf: "2026-09-16T10:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("validateSnapshot", () => {
  it("passes through a clean snapshot unchanged", () => {
    const snapshot = baseSnapshot();
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.sanitized).toEqual(snapshot);
  });

  it("marks the whole snapshot invalid when underlyingPrice is non-positive", () => {
    const result = validateSnapshot(baseSnapshot({ underlyingPrice: -1 }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.field === "underlyingPrice")).toBe(true);
  });

  it("marks the whole snapshot invalid when there are no contracts", () => {
    const result = validateSnapshot(baseSnapshot({ contracts: [] }));
    expect(result.valid).toBe(false);
  });

  it("nulls a negative OI on one contract but keeps the snapshot valid overall", () => {
    const snapshot = baseSnapshot();
    snapshot.contracts[0].oi = -50;
    const result = validateSnapshot(snapshot);
    expect(result.valid).toBe(true);
    expect(result.sanitized.contracts[0].oi).toBeNull();
    expect(result.issues.some((i) => i.field === "oi")).toBe(true);
  });

  it("nulls bid/ask when bid exceeds ask", () => {
    const snapshot = baseSnapshot();
    snapshot.contracts[0].bid = 105;
    snapshot.contracts[0].ask = 100;
    const result = validateSnapshot(snapshot);
    expect(result.sanitized.contracts[0].bid).toBeNull();
    expect(result.sanitized.contracts[0].ask).toBeNull();
  });

  it("nulls an implausible IV", () => {
    const snapshot = baseSnapshot();
    snapshot.contracts[0].iv = 5000;
    const result = validateSnapshot(snapshot);
    expect(result.sanitized.contracts[0].iv).toBeNull();
  });
});
