import { describe, expect, it } from "vitest";
import { computeMaxPain } from "./maxPain";
import { makeQuote } from "./testFixtures";

describe("computeMaxPain", () => {
  it("returns null for an empty chain", () => {
    expect(computeMaxPain([])).toBeNull();
  });

  it("picks the strike where OI is concentrated when it dominates the chain", () => {
    // All OI sits at strike 200 for both CE and PE; 100 and 300 exist as
    // strikes but carry no OI. Total payout to holders is minimized at 200
    // (both options expire worthless there), so max pain = 200.
    const contracts = [
      makeQuote({ strike: 100, optionType: "CE", oi: 0 }),
      makeQuote({ strike: 100, optionType: "PE", oi: 0 }),
      makeQuote({ strike: 200, optionType: "CE", oi: 10 }),
      makeQuote({ strike: 200, optionType: "PE", oi: 10 }),
      makeQuote({ strike: 300, optionType: "CE", oi: 0 }),
      makeQuote({ strike: 300, optionType: "PE", oi: 0 }),
    ];
    expect(computeMaxPain(contracts)).toBe(200);
  });

  it("treats null OI as zero for this calculation only", () => {
    const contracts = [
      makeQuote({ strike: 100, optionType: "CE", oi: null }),
      makeQuote({ strike: 200, optionType: "CE", oi: 10 }),
      makeQuote({ strike: 200, optionType: "PE", oi: 10 }),
      makeQuote({ strike: 300, optionType: "PE", oi: null }),
    ];
    expect(computeMaxPain(contracts)).toBe(200);
  });
});
