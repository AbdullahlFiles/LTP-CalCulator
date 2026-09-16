import { NextResponse } from "next/server";
import { getBillingProvider } from "@ltp/billing";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";
import { checkRateLimit } from "@/lib/rateLimit";

const CHECKOUT_LIMIT = 10;
const CHECKOUT_WINDOW_MS = 60 * 1000;

export async function POST() {
  try {
    const user = await requireUser();

    // Keyed by user id (this route requires auth), not IP — each user's
    // own attempts are bounded regardless of which network they're on.
    const rateLimit = checkRateLimit(`billing-checkout:${user.id}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests — please slow down." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
    const provider = getBillingProvider();
    const result = await provider.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      targetPlan: "PREMIUM",
    });
    return NextResponse.json({ ...result, provider: provider.name });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 502 },
    );
  }
}
