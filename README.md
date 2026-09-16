# NSE LTP Calculator + Options Intelligence Platform

A free-first NSE options-intelligence platform: LTP calculator, full option chain analytics, historical charts, an AI insights layer, accounts/watchlists/alerts, SEO-indexed tool and education pages, and a Free-to-Premium entitlement system.

Inspired by the useful functionality of public competitor tools (ltpcalculator.com, niftytrader.in and similar), but built independently — no copied code, branding, text, or design.

## Project status

**All 14 phases of the build plan are complete** (`docs/ROADMAP.md`). Read `docs/phase-0/` through `docs/phase-13/` for what shipped, how it was verified, and — just as importantly — what's explicitly deferred and why, in each phase's own `README.md`.

**The one thing to understand before anything else**: this platform currently runs entirely on synthetic mock market data (`packages/market-data`'s `MockProvider`), clearly labeled as such everywhere in the UI. No real NSE data provider has been selected or licensed — that's an unresolved business/legal decision, tracked in `docs/phase-0/11-risks-and-assumptions.md` (risk R1), not a coding task. Nothing in this repo should be pointed at real users implying real market data until that's resolved.

## Quick start (local development)

```bash
corepack enable
pnpm install

# Postgres must be running locally (or via docker-compose):
#   createdb ltp_calculator  (or: docker compose up postgres)
cp apps/web/.env.example apps/web/.env.local
# edit apps/web/.env.local: set a real AUTH_SECRET (openssl rand -base64 32)

pnpm --filter @ltp/db exec prisma migrate dev
pnpm dev   # http://localhost:3000
```

Run the whole workspace's checks before pushing: `pnpm -r test`, `pnpm -r typecheck`, `pnpm --filter web lint`, `pnpm --filter web build`.

## What's in here

| Path | What it is |
|---|---|
| `apps/web` | The Next.js app — every page and API route. |
| `packages/core` | Deterministic calculation engine (LTP/OI changes, PCR, Max Pain, Greeks pass-through, buildup detection, alert evaluation, time-series aggregation). Pure functions, no I/O. |
| `packages/market-data` | The `MarketDataProvider` interface, validation, and `MockProvider`. |
| `packages/ai` | The AI provider abstraction — a safe deterministic default plus a real (unexercised, no fabricated key) Anthropic adapter. |
| `packages/entitlements` | The centralized Free/Premium limit module every route checks. |
| `packages/billing` | The billing provider abstraction — a real (unexercised) Stripe adapter plus the dev/demo provider actually in use. |
| `packages/db` | Prisma schema + client, shared by the whole workspace. |
| `docs/` | Every phase's design decisions, what was verified and how, and explicit known limitations — the actual source of truth for "what does this system do and why," not just this file. |

## Development approach

The project was built in the 14 sequential phases in `docs/ROADMAP.md`, each implemented, tested, and documented — including its known limitations — before the next one started. That discipline is why every phase folder under `docs/` reads less like a changelog and more like an audit trail: what was built, how it was verified (including live manual verification against a real running server and real Postgres, not just unit tests), and what still needs a real business decision, real credentials, or real infrastructure this environment doesn't have.

## Important legal note

This project does not scrape NSE's website, and never will for production data. Before any real market-data feature goes live, a licensed data-provider decision is required (`docs/phase-0/11-risks-and-assumptions.md`). Before public launch generally, see the production-readiness checklist in `docs/phase-13/README.md` — several items there (data licensing, real billing credentials, legal review) are business decisions no amount of additional code can substitute for.
