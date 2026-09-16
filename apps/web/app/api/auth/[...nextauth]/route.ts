import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const { GET } = handlers;

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Wraps Auth.js's own POST handler to rate-limit only the credentials
 * sign-in callback — the brute-forceable path. Other POST paths under
 * this catch-all (CSRF token issuance, sign-out) aren't password guesses
 * and don't need the same limit.
 */
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    const rateLimit = checkRateLimit(`login:${getClientIp(request)}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
  }
  return handlers.POST(request);
}
