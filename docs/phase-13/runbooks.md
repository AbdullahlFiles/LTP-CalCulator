# Operational Runbooks

Each runbook assumes the reader has deploy/DB access. These are first drafts based on this codebase's actual failure points (traced through the source, not generic boilerplate) — refine them once there's real production incident experience.

## Market-data provider outage

**Symptom**: `getComputedOptionChain()` (`apps/web/lib/marketData.ts`) throws, or `validateSnapshot()` (`packages/market-data`) marks every snapshot invalid.

1. Check the provider's own status page/API health endpoint (once a real provider replaces `MockProvider` — `MockProvider` itself cannot go down, being local).
2. Confirm via logs whether `getComputedOptionChain` is throwing (provider connection failure) or returning `stale: true` (provider connected but data isn't updating).
3. If the provider is down: there is currently no secondary/backup provider wired up (`docs/phase-1/README.md` names this as a target-architecture requirement, not yet implemented — Phase 2 only ever built `MockProvider`). The immediate mitigation is to surface the stale/unavailable state clearly (already automatic via the `stale` flag and LIVE/STALE badges) rather than show frozen data as live — verify this is actually rendering correctly on the affected pages.
4. Once resolved, verify `historicalCollector.ts` and `alertEvaluator.ts` resume writing/evaluating on their next tick — no manual restart needed, they poll continuously.

## Database (Postgres) outage

**Symptom**: any Prisma call throws (watchlist/alerts/auth/billing/historical routes all return `502`/`500`; `historicalCollector`/`alertEvaluator` log errors on every tick but don't crash the process, per their `catch` blocks).

1. Confirm the managed Postgres instance's own status.
2. The core LTP calculator/option chain/AI insights pages do **not** depend on Postgres (they only read from the in-process `MockProvider`/computation pipeline) — confirm those still work during the outage; only auth, watchlists, alerts, historical charts, and billing are affected.
3. Once Postgres is back: `historicalCollector.ts` and `alertEvaluator.ts` will resume on their next scheduled tick automatically. No data is silently fabricated in the meantime — writes simply failed and were logged.
4. Check for any missed alert triggers during the outage window — the current design does not backfill/re-evaluate missed ticks; document any gap for affected users if this matters for your users.

## WebSocket / real-time gateway outage

Not applicable yet — `apps/realtime-gateway` (the Phase 1 target architecture's dedicated real-time process) was never built (see `docs/phase-13/README.md`, "What's intentionally not built"). All "real-time" updates currently happen via client-side polling (`setInterval` fetch loops in `OptionChain.tsx`, `LtpCalculator.tsx`, `HistoricalCharts.tsx`, `AiInsights.tsx`), which degrades gracefully to "the next poll will retry" rather than needing a reconnection runbook. Revisit this runbook once that process exists.

## API overload / traffic spike

1. Check which endpoints are hot. The Phase 12 rate limiters (`apps/web/lib/rateLimit.ts`) already cap `/api/auth/register`, the credentials login callback, `/api/ai/chat`, `/api/ai/explain`, and `/api/billing/checkout` per-process — confirm they're actually engaging (429s in logs) rather than the traffic hitting an unlimited route (`/api/option-chain`, `/api/watchlist`, `/api/alerts` currently have no rate limit).
2. Because the rate limiter is in-memory/single-process (documented in Phase 12), scaling to multiple instances behind a load balancer means each instance enforces its own independent limit — a coordinated spike could exceed the intended aggregate limit. This is exactly the condition under which the Phase 1 architecture's Redis-backed shared limiter becomes necessary, not optional.
3. Phase 12's local performance testing showed latency growing with concurrency (single Node process doing synchronous computation per request, no worker pool) — horizontal scaling (more instances) is the immediate lever; moving the computation into a dedicated process reading precomputed state (the target `apps/realtime-gateway` + Redis design) is the structural fix.

## Bad deployment

1. Roll back to the previous container image/tag immediately — do not attempt to "fix forward" under user-facing impact.
2. Run `pnpm --filter @ltp/db exec prisma migrate deploy` status check (`prisma migrate status`) before rolling back if the bad deploy included a migration — rolling back application code while a newer migration is still applied can break the older code's assumptions about the schema. Prisma migrations in this project are additive-only so far (no destructive migration has been written); verify that still holds before rolling back across a migration boundary.
3. Re-run the CI pipeline's test/typecheck/build steps against the last-known-good commit to confirm it's genuinely deployable before pushing it back out.

## Incorrect market data displayed

1. This is the most serious class of incident given the project's core "never fabricate data" principle. First determine: is the *provider* wrong (upstream data error) or is *this codebase* wrong (a calculation bug in `@ltp/core`, or a mapping bug between the provider and the display layer)?
2. `@ltp/core`'s calculation functions are all pure, unit-tested, and deterministic — reproduce the exact input values from logs/the affected snapshot and run them through the relevant function locally to confirm whether the bug is in the calculation or the input data.
3. If it's a calculation bug: this blocks a hotfix release; every calculation change must ship with a new/updated unit test proving the fix (per the project's own engineering rules), not just a manual patch.
4. If it's upstream provider data: there is currently no automated cross-check against a second data source (no backup provider exists yet — see the market-data outage runbook above). Consider surfacing a manual data-quality banner while investigating.
5. Never patch a calculation "to make the number look right" without understanding why it was wrong — silently adjusting output to match an expectation is itself a form of data fabrication.

## Security incident

1. Rotate `AUTH_SECRET` immediately if session compromise is suspected — this invalidates all existing sessions (forces re-login), which is the intended behavior.
2. If a database credential leak is suspected: rotate `DATABASE_URL`'s credentials at the Postgres provider, then update the secret in the hosting platform's secrets manager and redeploy.
3. If a Stripe key leak is suspected: rotate immediately in the Stripe dashboard — a leaked `STRIPE_SECRET_KEY` is a direct financial risk.
4. Check `BillingEvent` (audit log of every plan change) and NextAuth session activity for anomalies consistent with the suspected incident.
5. Review the Phase 12 security findings (`docs/phase-12/README.md`) for anything relevant that was marked "accepted risk" rather than fixed — an incident may change that risk calculus (e.g., the account-enumeration tradeoff).

## AI service outage (Anthropic API down or erroring)

1. This requires no action by design: `explainWithFallback`/`chatWithFallback` (`packages/ai/src/index.ts`) already catch any provider failure and fall back to the deterministic `TemplateAiProvider`, which cannot go down (no external call). Confirm this is actually happening (check for the `[@ltp/ai] ... falling back to template provider` log line) rather than an unrelated error surfacing as a `502` to users.
2. If real Anthropic billing/cost is a concern during a partial outage (intermittent failures rather than a clean down state), consider temporarily unsetting `ANTHROPIC_API_KEY` to force the template provider path deterministically until the provider stabilizes, rather than paying for repeated failed calls.
