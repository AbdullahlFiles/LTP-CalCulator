import { describe, expect, it } from "vitest";
import { findForbiddenLanguage, validateChatResponse, validateStructuredExplanation } from "./validate";
import type { StructuredExplanation } from "./types";

function makeExplanation(overrides: Partial<StructuredExplanation> = {}): StructuredExplanation {
  return {
    data: ["NIFTY is at 25000."],
    calculation: ["PCR is Put OI / Call OI."],
    interpretation: ["This may suggest a bullish lean."],
    uncertainty: ["This is not a prediction."],
    mode: "advanced",
    generatedBy: "test",
    ...overrides,
  };
}

describe("findForbiddenLanguage", () => {
  it("flags guaranteed-outcome language", () => {
    expect(findForbiddenLanguage("This is a guaranteed profit.")).toHaveLength(1);
    expect(findForbiddenLanguage("This trade is risk-free.")).toHaveLength(1);
    expect(findForbiddenLanguage("Prices will definitely rise.")).toHaveLength(1);
    expect(findForbiddenLanguage("100% certain to happen.")).toHaveLength(1);
  });

  it("does not flag ordinary hedged language", () => {
    expect(findForbiddenLanguage("This may suggest a bullish lean, but is not certain.")).toHaveLength(0);
    expect(findForbiddenLanguage("Historically this can precede a move, though not always.")).toHaveLength(0);
  });
});

describe("validateStructuredExplanation", () => {
  it("passes a well-formed, hedged explanation", () => {
    const result = validateStructuredExplanation(makeExplanation());
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("fails when any section is empty", () => {
    const result = validateStructuredExplanation(makeExplanation({ uncertainty: [] }));
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("uncertainty"))).toBe(true);
  });

  it("fails when forbidden language appears anywhere, including interpretation", () => {
    const result = validateStructuredExplanation(
      makeExplanation({ interpretation: ["This is a guaranteed win."] }),
    );
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("guaranteed"))).toBe(true);
  });
});

describe("validateChatResponse", () => {
  it("passes hedged text", () => {
    expect(validateChatResponse("PCR suggests a bullish lean, but it's not certain.").valid).toBe(true);
  });

  it("fails on forbidden language", () => {
    expect(validateChatResponse("This is a sure-shot win, no risk at all.").valid).toBe(false);
  });
});
