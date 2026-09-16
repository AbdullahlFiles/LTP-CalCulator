export * from "./types";
export * from "./validate";
export * from "./significantChange";
export * from "./promptTemplates";
export { TemplateAiProvider } from "./providers/templateProvider";
export { AnthropicAiProvider } from "./providers/anthropicProvider";

import { AnthropicAiProvider } from "./providers/anthropicProvider";
import { TemplateAiProvider } from "./providers/templateProvider";
import type { AiProvider, ChatMessage, ExplanationMode, MarketContext, StructuredExplanation } from "./types";
import { validateChatResponse, validateStructuredExplanation } from "./validate";

/**
 * The single place the rest of the codebase gets an AI provider from —
 * never `new AnthropicAiProvider(...)` directly. Swapping providers (a
 * different vendor, a different default) means changing this function,
 * not every call site.
 *
 * Picks the real Anthropic-backed provider only when a real API key is
 * present in the environment; otherwise falls back to the deterministic
 * template provider. Never fabricates a key to force the "real" path.
 */
export function getAiProvider(): AiProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new AnthropicAiProvider(apiKey);
  }
  return new TemplateAiProvider();
}

/**
 * Calls the given provider's explain(), validates the result, and falls
 * back to the always-safe TemplateAiProvider if the call throws or the
 * response fails validation (missing section, forbidden language). A
 * validation failure never reaches the user as an error — it degrades to
 * the deterministic explanation instead.
 */
export async function explainWithFallback(
  provider: AiProvider,
  context: MarketContext,
  mode: ExplanationMode,
): Promise<StructuredExplanation> {
  try {
    const result = await provider.explain(context, mode);
    const validation = validateStructuredExplanation(result);
    if (validation.valid) return result;
    console.warn(
      `[@ltp/ai] ${provider.name} explanation failed validation (${validation.violations.join("; ")}); falling back to template provider`,
    );
  } catch (error) {
    console.warn(`[@ltp/ai] ${provider.name} explain() threw; falling back to template provider:`, error);
  }
  return new TemplateAiProvider().explain(context, mode);
}

/**
 * Same fallback pattern as `explainWithFallback`, for the chat path.
 */
export async function chatWithFallback(
  provider: AiProvider,
  context: MarketContext,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  try {
    const result = await provider.chat(context, question, history);
    const validation = validateChatResponse(result);
    if (validation.valid) return result;
    console.warn(
      `[@ltp/ai] ${provider.name} chat response failed validation (${validation.violations.join("; ")}); falling back to template provider`,
    );
  } catch (error) {
    console.warn(`[@ltp/ai] ${provider.name} chat() threw; falling back to template provider:`, error);
  }
  return new TemplateAiProvider().chat(context, question, history);
}
