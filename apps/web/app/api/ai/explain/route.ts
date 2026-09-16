import { NextRequest, NextResponse } from "next/server";
import { getComputedOptionChain } from "@/lib/marketData";
import { toMarketContext } from "@/lib/aiContext";
import { getOrGenerateExplanation } from "@/lib/aiCache";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { ExplanationMode } from "@ltp/ai";

// `force=true` bypasses the significant-change cache in getOrGenerateExplanation
// and always calls the AI provider — the actual cost-abuse vector this limit exists for.
const EXPLAIN_LIMIT = 30;
const EXPLAIN_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(`ai-explain:${getClientIp(request)}`, EXPLAIN_LIMIT, EXPLAIN_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests — please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const instrument = searchParams.get("instrument") ?? "NIFTY";
  const expiry = searchParams.get("expiry") ?? getMockExpiries()[0];
  const mode = (searchParams.get("mode") ?? "advanced") as ExplanationMode;
  const force = searchParams.get("force") === "true";

  if (!INSTRUMENTS.some((i) => i.symbol === instrument)) {
    return NextResponse.json({ error: `Unknown instrument "${instrument}"` }, { status: 400 });
  }
  if (mode !== "beginner" && mode !== "advanced") {
    return NextResponse.json({ error: `Unknown mode "${mode}"` }, { status: 400 });
  }

  try {
    const chain = await getComputedOptionChain(instrument, expiry);
    const context = toMarketContext(chain);
    const result = await getOrGenerateExplanation(instrument, expiry, context, mode, { force });

    return NextResponse.json(
      { ...result.explanation, cacheHit: result.cacheHit },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate explanation" },
      { status: 502 },
    );
  }
}
