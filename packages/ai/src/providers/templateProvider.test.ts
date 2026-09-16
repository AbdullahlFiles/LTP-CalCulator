import { describe, expect, it } from "vitest";
import { TemplateAiProvider } from "./templateProvider";
import { validateChatResponse, validateStructuredExplanation } from "../validate";
import { makeContext } from "../testFixtures";

describe("TemplateAiProvider.explain", () => {
  const provider = new TemplateAiProvider();

  it("produces a structured explanation that passes validation", async () => {
    const result = await provider.explain(makeContext(), "advanced");
    expect(validateStructuredExplanation(result).valid).toBe(true);
    expect(result.generatedBy).toBe("template");
    expect(result.mode).toBe("advanced");
  });

  it("never leaves a section empty even for sparse data", async () => {
    const sparseContext = makeContext({
      pcr: null,
      maxPain: null,
      topResistance: [],
      topSupport: [],
      unusualActivity: [],
      atmStrike: null,
    });
    const result = await provider.explain(sparseContext, "beginner");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.calculation.length).toBeGreaterThan(0);
    expect(result.interpretation.length).toBeGreaterThan(0);
    expect(result.uncertainty.length).toBeGreaterThan(0);
    expect(validateStructuredExplanation(result).valid).toBe(true);
  });

  it("reads a high PCR as a bullish OI lean and a low PCR as bearish", async () => {
    const bullish = await provider.explain(makeContext({ pcr: 1.8 }), "advanced");
    expect(bullish.interpretation.some((s) => /bullish/.test(s))).toBe(true);

    const bearish = await provider.explain(makeContext({ pcr: 0.4 }), "advanced");
    expect(bearish.interpretation.some((s) => /bearish/.test(s))).toBe(true);
  });

  it("includes a stale-data caveat when the context is marked stale", async () => {
    const result = await provider.explain(makeContext({ stale: true }), "advanced");
    expect(result.data.some((s) => /stale/.test(s))).toBe(true);
  });
});

describe("TemplateAiProvider.chat", () => {
  const provider = new TemplateAiProvider();

  it("answers a PCR question using only context data", async () => {
    const answer = await provider.chat(makeContext({ pcr: 1.23 }), "what is the PCR?", []);
    expect(answer).toContain("1.23");
    expect(validateChatResponse(answer).valid).toBe(true);
  });

  it("answers a Max Pain question", async () => {
    const answer = await provider.chat(makeContext({ maxPain: 25050 }), "what's max pain today?", []);
    expect(answer).toContain("25050");
  });

  it("gives an honest fallback for out-of-scope questions rather than fabricating an answer", async () => {
    const answer = await provider.chat(makeContext(), "should I buy NIFTY tomorrow?", []);
    expect(answer).toMatch(/data-driven|not configured/i);
    expect(validateChatResponse(answer).valid).toBe(true);
  });
});
