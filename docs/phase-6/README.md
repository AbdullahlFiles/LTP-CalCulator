# Phase 6 — Historical Data + Charts

## What shipped

### `packages/db` (new)
Prisma + PostgreSQL, matching the storage decision in `docs/phase-1/README.md` §1 ("Postgres tables with scheduled aggregation to start... upgrade path to TimescaleDB/ClickHouse deferred"). Two models: `ContractSnapshot` (per strike/optionType/sample) and `ChainSnapshot` (per instrument/expiry/sample — underlying price, PCR, Max Pain). A single shared `PrismaClient` export, following the standard Next.js dev-mode pattern to avoid connection exhaustion across hot reloads.

Postgres itself runs natively in this sandbox (`postgresql-16` was already installed; started via `service postgresql start`, database `ltp_calculator` created) — not part of the repo, a local dev prerequisite documented in `apps/web/.env.example` / `packages/db/.env.example`.

### `@ltp/core` addition
`timeSeries.ts` — `aggregateTimeSeries(points, bucketCount)`: downsamples a time series into at most `bucketCount` buckets, averaging non-null values per bucket and leaving empty buckets `null` (never a fabricated interpolation). This is the server-side aggregation FR-22 requires — historical API responses never hand the browser raw per-sample data for a long range. 6 new tests, 49 total in `@ltp/core`.

### `apps/web`
- `lib/provider.ts`: the single `MockProvider` instance, extracted out of `lib/marketData.ts` so it can be shared with the new collector (both need the *same* provider instance, not two independently-seeded ones).
- `lib/historicalCollector.ts`: samples the provider every 10s into Postgres (`captureSnapshot`), and on first request for a given instrument/expiry, backfills ~60 synthetic points at 1-minute spacing covering the last hour (`backfillIfEmpty`) so charts have something to show immediately rather than requiring a real hour of uptime. Idempotent per instrument/expiry (`ensureCollecting`).
- `app/api/historical/contract/route.ts` and `app/api/historical/chain/route.ts`: query Postgres, aggregate with `@ltp/core`'s `aggregateTimeSeries`, return JSON with `Cache-Control: no-store`.
- `/charts` (`components/charts/HistoricalCharts.tsx` + `TimeSeriesChart.tsx`, using `recharts`): instrument/strike/CE-PE/metric selectors for a per-contract chart (LTP, OI, Volume, IV) and a separate chain-level chart (Underlying price, PCR, Max Pain), each with loading/error/empty states.

## Verified end-to-end with real Postgres, not just mocked

- `curl /api/historical/chain?...` and `/api/historical/contract?...` both returned real rows written by the backfill (confirmed 60 points from a live query, and separately confirmed `bucketCount=10` correctly downsamples 60 raw points to 10).
- Manual browser walkthrough (Playwright screenshot, not committed) of `/charts` showing both charts rendering real, varying data pulled from Postgres through the aggregation endpoint.
- `pnpm -r test` — 60 tests pass; `pnpm -r typecheck` and `pnpm --filter=web lint`/`build` — clean.

## A build issue caught and fixed

`next build` initially emitted three "Package @prisma/client can't be external... could not be resolved" warnings — a known Next.js + Prisma + pnpm-monorepo interaction where Next's build tracer expects `@prisma/client` resolvable directly from the app's own `node_modules`, not only transitively through the `@ltp/db` workspace package. Fixed by adding `@prisma/client` as a direct dependency of `apps/web` as well; warnings gone, confirmed by rebuilding.

## Known simplifications (explicitly not the target architecture)

- **The sampling loop runs inside `apps/web` as an in-memory `setInterval`**, not in the dedicated `apps/realtime-gateway` process the Phase 1 architecture calls for. This only works because the app currently runs as a single long-lived Node process; it would silently stop sampling on a stateless/serverless deployment target. This is flagged directly in `historicalCollector.ts` as a Phase 13 deployment-architecture decision, not something to re-derive later.
- **Expiry is fixed** to the first mock expiry on the `/charts` page (not user-selectable) since that's the only expiry being sampled — documented in the page copy itself, not hidden.
- **The backfill is synthetic**, not reconstructed real history (there is no real history — see the unresolved data-licensing risk, `docs/phase-0/11-risks-and-assumptions.md` R1). It exists purely so the chart UI has something to render on first load; it is clearly labeled as synthetic in the UI copy.
- **No FREE/PREMIUM historical-depth split implemented yet** — `docs/phase-0/07-free-vs-premium-strategy.md` calls for this, but the numeric window is explicitly deferred there until real infra cost is known; Phase 6 ships the mechanism (bounded aggregation, bucketCount parameter) that a future limit would sit on top of, not the limit itself.
