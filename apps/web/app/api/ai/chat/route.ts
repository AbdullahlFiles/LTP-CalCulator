import { NextRequest, NextResponse } from "next/server";
import { chatWithFallback, getAiProvider, type ChatMessage } from "@ltp/ai";
import { getComputedOptionChain } from "@/lib/marketData";
import { toMarketContext } from "@/lib/aiContext";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";

const MAX_QUESTION_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 10;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    instrument = "NIFTY",
    expiry,
    question,
    history,
  } = body as {
    instrument?: string;
    expiry?: string;
    question?: string;
    history?: ChatMessage[];
  };

  if (!INSTRUMENTS.some((i) => i.symbol === instrument)) {
    return NextResponse.json({ error: `Unknown instrument "${instrument}"` }, { status: 400 });
  }
  if (typeof question !== "string" || question.trim() === "") {
    return NextResponse.json({ error: "A non-empty question is required" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question is too long (max ${MAX_QUESTION_LENGTH} characters)` },
      { status: 400 },
    );
  }

  // Bound the conversation history sent to the provider — both for cost
  // and so a long adversarial history can't be used to bury/dilute the
  // system rules over many turns.
  const boundedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [];

  try {
    const resolvedExpiry = expiry ?? getMockExpiries()[0];
    const chain = await getComputedOptionChain(instrument, resolvedExpiry);
    const context = toMarketContext(chain);
    const provider = getAiProvider();
    const answer = await chatWithFallback(provider, context, question, boundedHistory);

    return NextResponse.json({ answer, provider: provider.name }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to answer question" },
      { status: 502 },
    );
  }
}
