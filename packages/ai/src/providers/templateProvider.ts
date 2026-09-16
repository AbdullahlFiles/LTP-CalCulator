import type {
  AiProvider,
  ChatMessage,
  ExplanationMode,
  MarketContext,
  StructuredExplanation,
} from "../types";

/**
 * The default AI provider: produces the same DATA/CALCULATION/
 * INTERPRETATION/UNCERTAINTY structure as a real LLM would, entirely from
 * fixed templates driven by TRUSTED_MARKET_DATA — no external call, no
 * cost, no chance of hallucination. This is what the platform falls back
 * to whenever a real provider isn't configured (no API key) or fails
 * validation (see `explainWithFallback`/`chatWithFallback` in `index.ts`),
 * so the AI Intelligence layer always degrades to *something safe* rather
 * than an error or a validation-failing response reaching the user.
 */
export class TemplateAiProvider implements AiProvider {
  readonly name = "template";

  async explain(context: MarketContext, mode: ExplanationMode): Promise<StructuredExplanation> {
    const data: string[] = [];
    const calculation: string[] = [];
    const interpretation: string[] = [];
    const uncertainty: string[] = [];

    data.push(
      `${context.instrument} is trading around ${context.underlyingPrice} as of ${context.asOf}${context.stale ? " (data marked stale)" : ""}.`,
    );
    if (context.atmStrike !== null) {
      data.push(`The at-the-money strike for expiry ${context.expiry} is ${context.atmStrike}.`);
    }

    if (context.pcr !== null) {
      calculation.push(
        `Put-Call Ratio (${context.pcr.toFixed(2)}) is total Put open interest divided by total Call open interest across this chain.`,
      );
      if (context.pcr > 1.3) {
        interpretation.push(
          "A PCR above 1.3 typically suggests Put writers are more active than Call writers, which is often read as a bullish OI lean — not a forecast.",
        );
      } else if (context.pcr < 0.7) {
        interpretation.push(
          "A PCR below 0.7 typically suggests Call writers are more active than Put writers, which is often read as a bearish OI lean — not a forecast.",
        );
      } else {
        interpretation.push("PCR is close to neutral, without a strong lean either way from current OI.");
      }
    }

    if (context.maxPain !== null) {
      calculation.push(
        `Max Pain (${context.maxPain}) is the strike where total option-holder payout is lowest given current OI across all strikes.`,
      );
      const distancePercent =
        (Math.abs(context.underlyingPrice - context.maxPain) / context.underlyingPrice) * 100;
      if (distancePercent >= 0.3) {
        interpretation.push(
          `The underlying is some distance from Max Pain (${context.maxPain}); option-pain dynamics may (not "will") pull price toward that level as expiry approaches.`,
        );
      }
    }

    if (context.topResistance.length > 0) {
      const top = context.topResistance[0];
      data.push(`Highest Call OI is at strike ${top.strike} (${top.oi.toLocaleString("en-IN")}).`);
      interpretation.push(
        `Strike ${top.strike} may act as resistance, since that's where Call writers currently have the most open interest.`,
      );
    }
    if (context.topSupport.length > 0) {
      const top = context.topSupport[0];
      data.push(`Highest Put OI is at strike ${top.strike} (${top.oi.toLocaleString("en-IN")}).`);
      interpretation.push(
        `Strike ${top.strike} may act as support, since that's where Put writers currently have the most open interest.`,
      );
    }

    if (context.unusualActivity.length > 0) {
      const flagged = context.unusualActivity
        .slice(0, 3)
        .map((u) => `${u.strike}${u.optionType ?? ""} (${u.reason.replace(/-/g, " ")})`)
        .join(", ");
      data.push(`Unusual activity flagged at: ${flagged}.`);
      interpretation.push(
        "Unusual volume or OI change relative to the rest of this chain can indicate concentrated positioning — it does not by itself indicate direction.",
      );
    }

    const atmContract = context.contracts.find((c) => c.moneyness === "ATM");
    if (atmContract && mode === "advanced" && atmContract.buildup !== "neutral") {
      interpretation.push(
        `The ATM ${atmContract.optionType} contract (strike ${atmContract.strike}) shows a ${atmContract.buildup.replace("-", " ")} pattern based on today's price/OI move.`,
      );
    }

    uncertainty.push(
      "This is a deterministic, rule-based reading of current OI/price data, not a prediction — options markets can move sharply on news this data cannot see.",
    );
    uncertainty.push(
      "Open interest and PCR reflect positioning, not certainty; large players can and do close or reverse positions intraday.",
    );
    if (mode === "beginner") {
      uncertainty.push(
        "If you're new to options, treat this as a starting point for learning what the data shows, not as a signal to trade on.",
      );
    }

    // Guard against ever shipping an empty section — validateStructuredExplanation
    // requires non-empty sections, and a chain with almost no data (e.g. a
    // brand-new/thin instrument) could otherwise leave "data" or
    // "calculation" empty.
    if (data.length === 0) data.push(`No detailed data is currently available for ${context.instrument}.`);
    if (calculation.length === 0) {
      calculation.push("Not enough data was available to run PCR or Max Pain calculations for this snapshot.");
    }
    if (interpretation.length === 0) {
      interpretation.push("There isn't a clear directional lean in the currently available data.");
    }

    return {
      data,
      calculation,
      interpretation,
      uncertainty,
      mode,
      generatedBy: this.name,
    };
  }

  async chat(context: MarketContext, question: string, _history: ChatMessage[]): Promise<string> {
    const q = question.toLowerCase();

    if (/\bpcr\b|put.?call ratio/.test(q)) {
      return context.pcr !== null
        ? `The current PCR for ${context.instrument} is ${context.pcr.toFixed(2)} (total Put OI / total Call OI). Above ~1.3 is often read as a bullish OI lean, below ~0.7 as bearish — this is a positioning read, not a forecast.`
        : `PCR isn't available for ${context.instrument} in the current data.`;
    }
    if (/max ?pain/.test(q)) {
      return context.maxPain !== null
        ? `Today's Max Pain for ${context.instrument} ${context.expiry} is ${context.maxPain} — the strike where option holders' total payout is lowest given current OI. It's a positioning metric, not a price target.`
        : `Max Pain isn't available for ${context.instrument} in the current data.`;
    }
    if (/support/.test(q)) {
      return context.topSupport.length > 0
        ? `The strongest Put-OI level right now is ${context.topSupport[0].strike} (${context.topSupport[0].oi.toLocaleString("en-IN")} OI), often read as a support level.`
        : "No support level data is available right now.";
    }
    if (/resistance/.test(q)) {
      return context.topResistance.length > 0
        ? `The strongest Call-OI level right now is ${context.topResistance[0].strike} (${context.topResistance[0].oi.toLocaleString("en-IN")} OI), often read as a resistance level.`
        : "No resistance level data is available right now.";
    }
    if (/unusual/.test(q)) {
      return context.unusualActivity.length > 0
        ? `Unusual activity right now: ${context.unusualActivity
            .slice(0, 3)
            .map((u) => `${u.strike}${u.optionType ?? ""} (${u.reason.replace(/-/g, " ")})`)
            .join(", ")}.`
        : "Nothing flagged as unusual in the current chain.";
    }

    return `I can answer questions about this chain's PCR, Max Pain, support/resistance, and unusual activity using only the data shown. A live conversational AI model isn't configured in this environment (no AI provider API key set), so I'm limited to those data-driven answers rather than open-ended conversation.`;
  }
}
