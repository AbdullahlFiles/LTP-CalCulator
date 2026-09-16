import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@ltp/billing";

/**
 * Only meaningful once Stripe is actually configured. Rejects outright
 * rather than accepting-and-ignoring when the webhook secret isn't set,
 * so a misconfiguration is visible (a 501 in logs) instead of silently
 * swallowing real events later.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !secretKey) {
    return NextResponse.json(
      { error: "Stripe billing is not configured in this environment" },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const result = await handleStripeWebhook(rawBody, signature, webhookSecret, secretKey);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook verification failed" },
      { status: 400 },
    );
  }
}
