import { describe, expect, it } from "vitest";
import { computePcr, computeStrikeWisePcr } from "./pcr";
import { makeQuote } from "./testFixtures";

describe("computePcr", () => {
  it("computes total put OI over total call OI", () => {
    const contracts = [
      makeQuote({ strike: 25000, optionType: "CE", oi: 1000 }),
      makeQuote({ strike: 25000, optionType: "PE", oi: 1500 }),
    ];
    expect(computePcr(contracts)).toBe(1.5);
  });

  it("excludes contracts with null OI rather than treating them as zero", () => {
    const contracts = [
      makeQuote({ strike: 25000, optionType: "CE", oi: null }),
      makeQuote({ strike: 25000, optionType: "PE", oi: 1500 }),
      makeQuote({ strike: 25100, optionType: "CE", oi: 500 }),
    ];
    expect(computePcr(contracts)).toBe(3); // 1500 / 500, the null CE is ignored
  });

  it("returns null when there is no data at all", () => {
    expect(computePcr([])).toBeNull();
  });

  it("returns null when total call OI is zero", () => {
    const contracts = [makeQuote({ optionType: "PE", oi: 100 })];
    expect(computePcr(contracts)).toBeNull();
  });
});

describe("computeStrikeWisePcr", () => {
  it("computes PCR independently per strike, sorted ascending", () => {
    const contracts = [
      makeQuote({ strike: 25100, optionType: "CE", oi: 200 }),
      makeQuote({ strike: 25100, optionType: "PE", oi: 400 }),
      makeQuote({ strike: 25000, optionType: "CE", oi: 1000 }),
      makeQuote({ strike: 25000, optionType: "PE", oi: 500 }),
    ];
    expect(computeStrikeWisePcr(contracts)).toEqual([
      { strike: 25000, pcr: 0.5 },
      { strike: 25100, pcr: 2 },
    ]);
  });
});
