import type { NextRequest } from "next/server";

/**
 * A fixed-window, in-memory rate limiter. Same documented limitation as
 * `historicalCollector.ts` / `aiCache.ts` / `alertEvaluator.ts`: valid only
 * within a single long-lived Node process — on multiple instances behind a
 * load balancer, each instance enforces its own independent limit rather
 * than a shared one. The Phase 1 architecture's Redis cache is the correct
 * shared store for this in production; adopting it before there's a
 * multi-instance deployment to justify it would be exactly the speculative
 * infrastructure the project rules warn against building early.
 */
const buckets = new Map<string, { count: number; windowStart: number }>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.windowStart + windowMs - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Best-effort client IP from proxy headers — the app itself never binds a socket directly to the internet. */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
