import { describe, expect, it } from "vitest";
import { computeLtpChange, computeContractLtpChange } from "./ltp.js";
import { makeQuote } from "./testFixtures.js";

describe("computeLtpChange", () => {
  it("computes change and percent change", () => {
    expect(computeLtpChange(110, 100)).toEqual({ change: 10, percentChange: 10 });
  });

  it("handles negative change", () => {
    expect(computeLtpChange(90, 100)).toEqual({ change: -10, percentChange: -10 });
  });

  it("returns nulls when ltp is missing", () => {
    expect(computeLtpChange(null, 100)).toEqual({ change: null, percentChange: null });
  });

  it("returns nulls when prevClose is missing", () => {
    expect(computeLtpChange(100, null)).toEqual({ change: null, percentChange: null });
  });

  it("returns a change but a null percent when prevClose is zero", () => {
    expect(computeLtpChange(100, 0)).toEqual({ change: 100, percentChange: null });
  });
});

describe("computeContractLtpChange", () => {
  it("reads ltp/prevClose off a contract quote", () => {
    const quote = makeQuote({ ltp: 120, prevClose: 100 });
    expect(computeContractLtpChange(quote)).toEqual({ change: 20, percentChange: 20 });
  });
});
