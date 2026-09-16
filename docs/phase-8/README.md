# Phase 8 — User Accounts + Watchlists + Alerts

## What shipped

### `packages/db` — new Prisma models
`User` (email + scrypt password hash, `Plan` enum default `FREE` — no OAuth provider wired up, so no third-party token ever needs storing), `Watchlist`/`WatchlistItem`, `Alert`/`AlertTrigger`, `RecentSearch`. See the schema comments for why each field is nullable/shaped the way it is (in particular the flat `operator`/`thresholdValue` columns instead of a JSON condition blob, chosen for Prisma-query-ability and simpler validation).

### `packages/entitlements` (new) — the centralized entitlement module
Exactly what `docs/phase-0/07-free-vs-premium-strategy.md` and the Phase 1 architecture called for: one file (`PLAN_LIMITS`) every limit is read from, and one function (`checkCapacity`) every route calls before creating something that counts against a plan. The specific numbers (10 watchlist items, 5 active alerts, etc.) are initial defaults — that doc explicitly deferred real numbers until there's usage data; this phase builds the *mechanism*, not final numbers. 4 tests.

### `packages/core` addition — `alerts.ts`
`evaluateAlert(rule, context)`: one pure function covering all 8 alert types from the spec (LTP threshold, % move, OI change, volume spike, IV threshold, important-strike move, S/R crossing, unusual activity), each mapped to exactly the already-computed fields it needs — never fabricates a trigger from missing data. 15 tests.

### `apps/web` — auth, watchlists, alerts, dashboard
- `auth.ts` + `/api/auth/[...nextauth]`: Auth.js v5, **Credentials provider only** — no OAuth provider is wired up, because that would need a real client ID/secret from Google/GitHub/etc. and the project rule is never to fabricate external API credentials. The provider list is designed to be extended, not rewritten, when real OAuth credentials exist.
- `lib/password.ts`: scrypt-based hashing using only Node's built-in `crypto` — deliberately not bcrypt/argon2, which need a native addon that's awkward to build in constrained environments.
- `/register`, `/login`, `/dashboard`, a session-aware `Nav`.
- `/api/watchlist`, `/api/watchlist/[itemId]`, `/api/alerts`, `/api/alerts/[alertId]`: CRUD, all entitlement-checked via `@ltp/entitlements`, all requiring auth via one shared `requireUser()` helper.
- `lib/alertEvaluator.ts`: the Phase 8 "notification infrastructure," in its honest MVP form — a periodic loop (same in-process pattern as the Phase 6 historical collector) that evaluates every active alert against live computed data and writes an `AlertTrigger` row when a condition is met. **Real delivery (email/push/SMS) is out of scope**: it needs a real provider and credentials this environment doesn't have, and the project rule is never to fabricate those. This ships the full detection half of the pipeline, working end to end, with trigger history visible on the dashboard — not a stub.
- `AddToWatchlistButton` on `/option-chain`, prompting sign-in rather than failing silently for anonymous visitors.

## Verified live against real Postgres (not just unit tests)

Ran the entire flow against the actual running dev server and local Postgres:
1. Registered a user via `/api/auth/register`, then signed in via the real Auth.js credentials callback (fetched a CSRF token first, as the flow requires) and confirmed `/api/auth/session` returned the authenticated user.
2. Added a watchlist item, then fetched it back — confirmed real DB round-trip.
3. Created a `VOLUME_SPIKE` alert with a low threshold, waited for the background evaluator's 15s tick, and confirmed a real `AlertTrigger` row was created with a correct, data-derived message ("25000CE volume (8533) reached the 100 threshold") — **the full detection loop working end to end against live data**, not a mock.
4. Created alerts up to the FREE-plan limit (5) and confirmed the 6th was rejected with `403` and the exact `checkCapacity` message.
5. Confirmed unauthenticated requests to `/api/watchlist` get `401`.
6. Manual browser walkthrough (Playwright, screenshots not committed): registered/logged in through the actual UI, saw the dashboard render the watchlist (2/10) and all 5 alerts with their trigger history, and confirmed the option-chain page shows the authenticated nav and a working "☆ Watch NIFTY" button.

### A real bug found and fixed during this verification

Testing the duplicate-watchlist-item case (adding the same item twice) revealed that the Prisma `@@unique` constraint **did not** prevent the duplicate — it returned `201` with a second row instead of `409`. Root cause: standard SQL treats `NULL != NULL`, so two "watch the whole instrument" rows (where `expiry`/`strike`/`optionType` are all null) don't collide on a unique index that includes those columns. Fixed by adding an explicit `findFirst` existence check before insert in `/api/watchlist` (`app/api/watchlist/route.ts`), re-verified live that the second identical request now correctly returns `409`.

## Verification summary

`pnpm -r test` — 111 tests pass; `pnpm -r typecheck`, `pnpm --filter=web lint`, `pnpm --filter=web build` — all clean.

## Known simplifications

- Single default watchlist per user (schema supports multiple; multi-watchlist is a natural Premium feature for Phase 11, not a Phase 8 gap).
- The alert-evaluation loop is in-process (`setInterval`), same documented caveat as the Phase 6 historical collector and Phase 7 AI cache: valid for the current long-lived Node process, a Phase 13 deployment decision to move to a real scheduled job on a stateless target.
- No email/push/SMS delivery — the detection/trigger-recording half of "notification infrastructure" is real and working; delivery needs real provider credentials not available here.
- `RecentSearch` model exists in the schema but has no API/UI wired up yet in this phase — reserved for a follow-up, not forgotten.
