import { describe, expect, it } from "vitest";
import { detectImportantStrikes, detectSupportResistance } from "./supportResistance.js";
import { makeQuote } from "./testFixtures.js";

describe("detectSupportResistance", () => {
  it("ranks resistance by call OI and support by put OI, descending", () => {
    const contracts = [
      makeQuote({ strike: 25000, optionType: "CE", oi: 500 }),
      makeQuote({ strike: 25100, optionType: "CE", oi: 1500 }),
      makeQuote({ strike: 25200, optionType: "CE", oi: 1000 }),
      makeQuote({ strike: 24900, optionType: "PE", oi: 2000 }),
      makeQuote({ strike: 24800, optionType: "PE", oi: 800 }),
    ];
    const { support, resistance } = detectSupportResistance(contracts, 2);
    expect(resistance).toEqual([
      { strike: 25100, oi: 1500 },
      { strike: 25200, oi: 1000 },
    ]);
    expect(support).toEqual([{ strike: 24900, oi: 2000 }, { strike: 24800, oi: 800 }]);
  });

  it("excludes contracts with null OI", () => {
    const contracts = [
      makeQuote({ strike: 25000, optionType: "CE", oi: null }),
      makeQuote({ strike: 25100, optionType: "CE", oi: 100 }),
    ];
    const { resistance } = detectSupportResistance(contracts, 3);
    expect(resistance).toEqual([{ strike: 25100, oi: 100 }]);
  });
});

describe("detectImportantStrikes", () => {
  it("flags the strike with the largest OI change", () => {
    const contracts = [
      makeQuote({ strike: 25000, optionType: "CE", oi: 1000, prevOi: 900 }),
      makeQuote({ strike: 25100, optionType: "CE", oi: 2000, prevOi: 500 }),
    ];
    const important = detectImportantStrikes(contracts, 1);
    expect(important).toContainEqual({
      strike: 25100,
      reason: "highest-oi-change",
      value: 1500,
    });
  });
});
