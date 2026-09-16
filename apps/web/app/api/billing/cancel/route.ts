import { NextResponse } from "next/server";
import { getBillingProvider } from "@ltp/billing";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";

export async function POST() {
  try {
    const user = await requireUser();
    const provider = getBillingProvider();
    const result = await provider.cancelSubscription({ userId: user.id });
    return NextResponse.json({ ...result, provider: provider.name });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cancellation failed" },
      { status: 502 },
    );
  }
}
