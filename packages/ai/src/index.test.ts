import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chatWithFallback, explainWithFallback, getAiProvider } from "./index";
import { TemplateAiProvider } from "./providers/templateProvider";
import { validateChatResponse, validateStructuredExplanation } from "./validate";
import { makeContext } from "./testFixtures";
import type { AiProvider, ChatMessage, ExplanationMode, MarketContext, StructuredExplanation } from "./types";

describe("getAiProvider", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("falls back to the template provider when no API key is configured", () => {
    delete process.env.ANTHROPIC_API_KEY;
    const provider = getAiProvider();
    expect(provider.name).toBe("template");
  });

  it("never fabricates a key — it only picks the real provider when one is actually set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test-not-a-real-key-just-for-this-test";
    const provider = getAiProvider();
    expect(provider.name).toMatch(/^anthropic:/);
  });
});

class FailingProvider implements AiProvider {
  readonly name = "failing";
  async explain(): Promise<StructuredExplanation> {
    throw new Error("simulated provider failure");
  }
  async chat(): Promise<string> {
    throw new Error("simulated provider failure");
  }
}

class InvalidProvider implements AiProvider {
  readonly name = "invalid";
  async explain(_context: MarketContext, mode: ExplanationMode): Promise<StructuredExplanation> {
    return { data: ["ok"], calculation: [], interpretation: [], uncertainty: [], mode, generatedBy: this.name };
  }
  async chat(): Promise<string> {
    return "This is a guaranteed win, no risk at all.";
  }
}

describe("explainWithFallback", () => {
  let warnSpy: ReturnType<typeof import("vitest").vi.spyOn>;

  beforeEach(async () => {
    const { vi } = await import("vitest");
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  it("falls back to the template provider when the given provider throws", async () => {
    const result = await explainWithFallback(new FailingProvider(), makeContext(), "advanced");
    expect(result.generatedBy).toBe("template");
    expect(validateStructuredExplanation(result).valid).toBe(true);
  });

  it("falls back to the template provider when the given provider's response fails validation", async () => {
    const result = await explainWithFallback(new InvalidProvider(), makeContext(), "advanced");
    expect(result.generatedBy).toBe("template");
  });

  it("passes through a valid response from a working provider unchanged", async () => {
    const provider = new TemplateAiProvider();
    const result = await explainWithFallback(provider, makeContext(), "advanced");
    expect(result.generatedBy).toBe("template");
  });
});

describe("chatWithFallback", () => {
  let warnSpy: ReturnType<typeof import("vitest").vi.spyOn>;

  beforeEach(async () => {
    const { vi } = await import("vitest");
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warnSpy.mockRestore());

  it("falls back to the template provider when the given provider throws", async () => {
    const history: ChatMessage[] = [];
    const answer = await chatWithFallback(new FailingProvider(), makeContext(), "what is PCR?", history);
    expect(validateChatResponse(answer).valid).toBe(true);
  });

  it("falls back to the template provider when the response contains forbidden language", async () => {
    const history: ChatMessage[] = [];
    const answer = await chatWithFallback(new InvalidProvider(), makeContext(), "what is PCR?", history);
    expect(validateChatResponse(answer).valid).toBe(true);
    expect(answer).not.toMatch(/guaranteed/i);
  });
});
