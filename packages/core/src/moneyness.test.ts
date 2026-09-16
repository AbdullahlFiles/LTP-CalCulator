import { describe, expect, it } from "vitest";
import { classifyMoneyness, findAtmStrike } from "./moneyness";

describe("findAtmStrike", () => {
  it("finds the closest strike", () => {
    expect(findAtmStrike(24950, [24800, 24900, 25000, 25100])).toBe(24900);
  });

  it("prefers the lower strike on a tie", () => {
    expect(findAtmStrike(25000, [24900, 25100])).toBe(24900);
  });

  it("returns null for an empty strike list", () => {
    expect(findAtmStrike(25000, [])).toBeNull();
  });
});

describe("classifyMoneyness", () => {
  it("classifies the ATM strike regardless of option type", () => {
    expect(classifyMoneyness(25000, "CE", 25000, 25000)).toBe("ATM");
    expect(classifyMoneyness(25000, "PE", 25000, 25000)).toBe("ATM");
  });

  it("classifies a call below spot as ITM and above spot as OTM", () => {
    expect(classifyMoneyness(24800, "CE", 25000, 25050)).toBe("ITM");
    expect(classifyMoneyness(25200, "CE", 25000, 25050)).toBe("OTM");
  });

  it("classifies a put above spot as ITM and below spot as OTM", () => {
    expect(classifyMoneyness(25200, "PE", 25000, 25050)).toBe("ITM");
    expect(classifyMoneyness(24800, "PE", 25000, 25050)).toBe("OTM");
  });
});
