import { describe, expect, it } from "vitest";
import { computeOiChange, computeContractOiChange } from "./oi";
import { makeQuote } from "./testFixtures";

describe("computeOiChange", () => {
  it("computes change and percent change", () => {
    expect(computeOiChange(1100, 1000)).toEqual({ change: 100, percentChange: 10 });
  });

  it("returns nulls when oi is missing", () => {
    expect(computeOiChange(null, 1000)).toEqual({ change: null, percentChange: null });
  });

  it("returns nulls when prevOi is missing", () => {
    expect(computeOiChange(1000, null)).toEqual({ change: null, percentChange: null });
  });

  it("returns a change but a null percent when prevOi is zero", () => {
    expect(computeOiChange(500, 0)).toEqual({ change: 500, percentChange: null });
  });
});

describe("computeContractOiChange", () => {
  it("reads oi/prevOi off a contract quote", () => {
    const quote = makeQuote({ oi: 1200, prevOi: 1000 });
    expect(computeContractOiChange(quote)).toEqual({ change: 200, percentChange: 20 });
  });
});
