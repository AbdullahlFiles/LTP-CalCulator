/**
 * The single centralized entitlement module the project's own architecture
 * docs require (docs/phase-0/07-free-vs-premium-strategy.md,
 * docs/phase-1/README.md §10): every feature limit is read from here, and
 * no route/component/job compares a plan name directly. Promoting a
 * feature between Free and Premium, or changing a limit, means editing
 * `PLAN_LIMITS` in this one file.
 *
 * The specific numbers below are initial defaults, not researched
 * capacity-planning figures — docs/phase-0/07 explicitly deferred setting
 * real numbers until there's production usage data to base them on. They
 * exist so Phase 8's limit *enforcement mechanism* can be built and
 * tested now; revisit the values, not the mechanism, once real data
 * exists.
 */
export type Plan = "FREE" | "PREMIUM";

export interface PlanLimits {
  maxWatchlistItems: number;
  maxActiveAlerts: number;
  maxRecentSearches: number;
  aiExplanationsPerDay: number;
  historicalWindowDays: number;
}

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxWatchlistItems: 10,
    maxActiveAlerts: 5,
    maxRecentSearches: 20,
    aiExplanationsPerDay: 50,
    historicalWindowDays: 7,
  },
  PREMIUM: {
    maxWatchlistItems: 100,
    maxActiveAlerts: 50,
    maxRecentSearches: 100,
    aiExplanationsPerDay: 1000,
    historicalWindowDays: 365,
  },
};

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export interface CapacityCheck {
  allowed: boolean;
  limit: number;
  current: number;
  reason?: string;
}

/**
 * The one function every route/job should call before creating something
 * that counts against a plan limit (a watchlist item, an active alert,
 * etc). `currentCount` is the caller's responsibility to compute (usually
 * a Prisma `count()`); this function only applies the rule.
 */
export function checkCapacity(
  plan: Plan,
  feature: keyof PlanLimits,
  currentCount: number,
): CapacityCheck {
  const limit = getLimits(plan)[feature];
  const allowed = currentCount < limit;
  return {
    allowed,
    limit,
    current: currentCount,
    reason: allowed
      ? undefined
      : `Free/Premium limit reached (${limit}) for this feature.${plan === "FREE" ? " Upgrade to Premium for a higher limit." : ""}`,
  };
}
