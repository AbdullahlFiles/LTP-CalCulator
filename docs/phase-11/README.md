# Phase 11 — Free-to-Premium SaaS

## What shipped

### `packages/db` additions
`Subscription` (per-user plan/status/provider fields — `provider: null` means the plan was set manually, never a real payment) and `BillingEvent` (an append-only audit log of every plan change, satisfying the project's "audit logging for sensitive actions" security rule).

### `packages/billing` (new) — the billing provider abstraction
Same pattern as `@ltp/ai`'s `AiProvider` and `@ltp/market-data`'s `MarketDataProvider`:
- `StripeBillingProvider`: real, working `stripe` SDK integration (checkout session creation, webhook signature verification and handling for `checkout.session.completed` / `customer.subscription.deleted`). Constructed only when `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID_PREMIUM` are genuinely set — **never exercised in this environment**, since no real Stripe account exists here and the project rule is never to fabricate payment credentials.
- `DevBillingProvider`: the provider actually used in this environment. Directly flips `User.plan`, upserts `Subscription`, and writes a `BillingEvent` — no payment, clearly logged as such (`"Dev/demo upgrade — no real payment..."`). **Refuses to run when `NODE_ENV=production`** — this is the one place in the whole codebase where a "safe fallback" pattern would be actively dangerous (an AI or data fallback degrades quality; a billing fallback that quietly grants free upgrades in production would be a real financial bug), so this fallback throws instead of substituting.
- `getBillingProvider()`: the factory — Stripe only when both env vars are set, dev otherwise.
5 tests (the production-refusal guard, and the factory's provider selection).

### `apps/web`
- `/api/billing/checkout`, `/api/billing/cancel`: thin, auth-required route handlers over the provider abstraction.
- `/api/billing/webhook`: Stripe webhook receiver — returns `501` outright when Stripe isn't configured, rather than accepting-and-silently-ignoring events (a misconfiguration should be visible).
- `/pricing`: a Free-vs-Premium comparison table built from `@ltp/entitlements`' actual limits (never hand-duplicated numbers), an `UpgradeButton`, and a plainly-worded on-page notice explaining that the Upgrade button is demo-mode with no real payment in this environment.
- Dashboard shows the current plan and an Upgrade/Cancel affordance depending on it.

## Verified live — the full loop, not just unit tests

Signed in as the test user from Phase 8, called `/api/billing/checkout`, and confirmed via a direct Postgres query that `User.plan` flipped to `PREMIUM`, a `Subscription` row was created, and a `BillingEvent` audit row was written. Then created a 6th active alert — **blocked at 5 under Phase 8's FREE limit** — succeeded immediately after the upgrade (PREMIUM's limit is 50), with no re-login or cache-clear needed, because `requireUser()` (Phase 8) re-fetches the plan from the database on every request rather than trusting a stale session claim. Called `/api/billing/cancel`, confirmed the plan reverted to `FREE` in the database, and confirmed a further alert was blocked again at the FREE limit. This demonstrates the entitlement system built in Phase 8 and the billing system built in this phase are genuinely wired together, not just individually plausible.

## A note on an unusual tool-output observation

While running `packages/billing`'s test suite, a line appeared in stdout: `<claude-code-hint v="1" type="plugin" value="stripe@claude-plugins-official" />` — apparently emitted by, or in response to, the `stripe` npm package being present. This was not something I asked for or requested, and I did not act on it (no plugin was installed) — it's flagged here and to the user directly rather than treated as an instruction, per the standard practice of never treating unsolicited tool/dependency output as a command.

## Known simplifications

- No trial period, proration, or plan-change-mid-cycle logic — `docs/phase-0/07-free-vs-premium-strategy.md` explicitly deferred billing-model specifics (monthly/annual, per-feature vs. tiered) to this phase's real implementation, which itself is blocked on a real Stripe account existing.
- "Contact for pricing" on `/pricing` instead of a real price — no actual price has been set by a business decision-maker; inventing one would be exactly the kind of fabrication the project rules warn against.
- `StripeBillingProvider` and the webhook handler are real, complete code, but have zero live-request test coverage beyond typechecking — they cannot be exercised without a real Stripe test-mode account, which is a business/ops setup step, not a coding one.
