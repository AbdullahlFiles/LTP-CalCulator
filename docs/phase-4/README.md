# Phase 4 — LTP Calculator

## What shipped

- `apps/web` — a Next.js (App Router, TypeScript, Tailwind) application.
- `apps/web/lib/marketData.ts` — the composition point: fetches a snapshot from `MockProvider` (`@ltp/market-data`), validates it, and runs it through the deterministic calculation engine (`@ltp/core`) to produce per-contract change/OI-change/moneyness/buildup, plus chain-level PCR, Max Pain, support/resistance and important strikes. This is the only place the web app touches a provider — everything downstream only sees the computed result.
- `apps/web/app/api/option-chain/route.ts` — a route handler exposing the computed chain as JSON, with `Cache-Control: no-store` (market data must never be cached at the edge) and a 502 on provider failure (surfaced to the UI as an error state, never silently swallowed).
- `apps/web/app/ltp-calculator/page.tsx` + `apps/web/components/LtpCalculator.tsx` — the tool itself: instrument/expiry/strike/CE-PE selectors, live LTP/change/OI/ΔOI/Volume/IV/Greeks/moneyness/buildup-signal display, a PCR/Max Pain/ATM-strike summary, and support/resistance panels. Polls the API every 5s. Handles loading, error (with retry), and empty (no data for the selected strike) states explicitly, and shows a LIVE/STALE badge driven by the server-computed `stale` flag rather than assuming freshness.

## Verification

- `pnpm -r test` — 47 tests pass (`@ltp/core` 36, `@ltp/market-data` 11).
- `pnpm -r typecheck` — clean across `@ltp/core`, `@ltp/market-data`, `apps/web`.
- `pnpm --filter=web lint` — clean.
- `pnpm --filter=web build` — production build succeeds.
- Manually verified in a real browser (Playwright, screenshot discarded after review — not committed): instrument/expiry/strike/CE-PE selection works, the API round-trips real computed values, and the LIVE badge and PCR/Max Pain/support-resistance panels render correctly. Caught and fixed a bug in this pass: the mock Greeks generator produced delta ≈ 1.0 at the ATM strike instead of ≈ 0.5 (`packages/market-data/src/mockProvider.ts`) — fixed and re-verified.

## Known simplifications (intentional, documented in `docs/phase-1/README.md`)

- No Redis/event-bus/WebSocket gateway yet — `apps/web` talks to a single in-process `MockProvider` instance directly via polling. This is explicitly called out in `lib/marketData.ts` as a Phase 4 shortcut, not the target architecture; building the real-time pipeline around synthetic data would be speculative infrastructure.
- Data is entirely synthetic (seeded PRNG), clearly labeled as such in the UI. No real NSE data is used or implied anywhere in this phase, per the unresolved data-licensing risk (`docs/phase-0/11-risks-and-assumptions.md`, R1).
- Expiries are placeholder dates, not real contract expiries.
- No accessibility audit yet (Phase 12); basic semantic HTML (labels, buttons, role="status"/"alert") is in place but not verified against WCAG 2.1 AA.

## Next steps

Phase 5 (Advanced Option Chain: full strike-centered table, beginner/advanced/power modes, more analytical panels) builds directly on `lib/marketData.ts` and the `@ltp/core` functions already shipped — no new calculation-engine work should be needed for it besides small chain-level aggregations already implemented (PCR, Max Pain, support/resistance, important strikes).
