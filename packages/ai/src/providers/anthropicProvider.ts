import Anthropic from "@anthropic-ai/sdk";
import {
  buildChatMessages,
  buildChatSystemPrompt,
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
} from "../promptTemplates";
import type {
  AiProvider,
  ChatMessage,
  ExplanationMode,
  MarketContext,
  StructuredExplanation,
} from "../types";

/**
 * Real LLM-backed provider. Never constructed with a fabricated or
 * placeholder key — `getAiProvider()` in `index.ts` only instantiates this
 * when `process.env.ANTHROPIC_API_KEY` is actually set, and this
 * constructor throws rather than silently degrading if it isn't, so a
 * misconfiguration fails loudly during setup instead of quietly at
 * request time.
 *
 * Model selection follows the cost-control principle from
 * docs/phase-0/11-risks-and-assumptions.md (R3) / NFR-16: a cheaper model
 * for the high-volume, short-answer chat path, a stronger model for the
 * less-frequent, more involved structured explanation. Both are
 * constructor parameters so they're configurable without code changes.
 */
export class AnthropicAiProvider implements AiProvider {
  readonly name: string;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly explainModel = "claude-sonnet-5",
    private readonly chatModel = "claude-haiku-4-5-20251001",
  ) {
    if (!apiKey) {
      throw new Error(
        "AnthropicAiProvider requires a real ANTHROPIC_API_KEY — none was provided. " +
          "This is a configuration error, not something to fall back on silently.",
      );
    }
    this.client = new Anthropic({ apiKey });
    this.name = `anthropic:${explainModel}`;
  }

  async explain(context: MarketContext, mode: ExplanationMode): Promise<StructuredExplanation> {
    const response = await this.client.messages.create({
      model: this.explainModel,
      max_tokens: 1024,
      system: buildExplainSystemPrompt(mode),
      messages: [{ role: "user", content: buildExplainUserPrompt(context) }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`AnthropicAiProvider: model response was not valid JSON: ${text.slice(0, 200)}`);
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as Record<string, unknown>).data) ||
      !Array.isArray((parsed as Record<string, unknown>).calculation) ||
      !Array.isArray((parsed as Record<string, unknown>).interpretation) ||
      !Array.isArray((parsed as Record<string, unknown>).uncertainty)
    ) {
      throw new Error("AnthropicAiProvider: model response was missing the required four-section structure.");
    }

    const shape = parsed as {
      data: string[];
      calculation: string[];
      interpretation: string[];
      uncertainty: string[];
    };

    return {
      data: shape.data,
      calculation: shape.calculation,
      interpretation: shape.interpretation,
      uncertainty: shape.uncertainty,
      mode,
      generatedBy: this.name,
    };
  }

  async chat(context: MarketContext, question: string, history: ChatMessage[]): Promise<string> {
    const messages = buildChatMessages(context, question, history);
    const response = await this.client.messages.create({
      model: this.chatModel,
      max_tokens: 512,
      system: buildChatSystemPrompt(),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
}
