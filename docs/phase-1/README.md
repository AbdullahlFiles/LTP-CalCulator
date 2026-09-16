# Phase 1 — Technical Architecture

Builds on Phase 0 (`../phase-0/`). Key inputs consumed: MVP scope (`../phase-0/05-mvp-definition.md`), the hard requirement that the market-data provider be replaceable, and the centralized-entitlement principle for Free/Premium.

## 1. Stack decisions

| Concern | Choice | Why |
|---|---|---|
| Monorepo | pnpm workspaces | Native workspace support, fast installs, no extra tool needed at this size. Turborepo can be added later if build times justify it. |
| Frontend | Next.js (App Router) + TypeScript + React | SSR/SSG needed for SEO (Phase 9); one framework covers marketing pages, tool pages, and API route handlers, keeping v1 architecture simple per the spec's "avoid unnecessary microservices at the beginning" rule. |
| Styling | Tailwind CSS | Fast to build accessible, responsive UI without hand-rolling a design system before there's a product to skin. |
| Backend logic | Next.js Route Handlers (`apps/web/app/api/**`) calling into `packages/*` | No separate API service yet; business logic lives in framework-agnostic packages so it can be extracted into standalone services later without a rewrite. |
| Calculation engine | `packages/core`, plain TypeScript, zero framework/runtime dependencies | Must be deterministic, unit-testable in isolation, and usable from both the web app and any future worker/service. Never touches React or Next. |
| Market-data abstraction | `packages/market-data` | Defines the `MarketDataProvider` interface + normalization/validation; ships a `MockProvider` now (Phase 2), real provider adapters plug in later without touching `core` or the UI. |
| Database | PostgreSQL | Relational integrity for accounts/entitlements/watchlists/alerts; broadly supported, cheap managed tiers, mature tooling (Prisma). |
| ORM | Prisma | Type-safe schema shared by the web app; migrations tracked in source control. |
| Real-time cache / pub-sub | Redis | Latest-tick cache and a lightweight event bus (pub/sub now; Redis Streams if delivery guarantees are needed later) between ingestion and the API/WebSocket layer. |
| Time-series / historical storage | Postgres tables with scheduled aggregation to start; documented upgrade path to TimescaleDB or ClickHouse if/when volume requires it (Phase 6 decision, not now) | Avoids adopting a specialized time-series DB before real data volume is known — the spec explicitly warns against choosing tech merely because it's common for the category. |
| Queue / background jobs | BullMQ (Redis-backed) | Alert evaluation, AI-explanation generation, and scheduled aggregation jobs need retryable background work; BullMQ reuses the Redis instance already required, no new infra. |
| WebSocket | `ws`-based Node process (`apps/realtime-gateway`, added in Phase 2) sharing `packages/core`/`packages/market-data` | Next.js route handlers are not well-suited to long-lived WebSocket connections; a small dedicated Node process is the minimum viable separation, not a general microservices split. |
| Auth | Auth.js (NextAuth) with email/password + OAuth | Mature, self-hostable, integrates directly with Next.js and Prisma; avoids a third-party auth bill before there's revenue. |
| AI | Provider-agnostic `packages/ai` interface; default adapter targets the Claude API | Spec requires the AI provider be swappable; the interface is designed against structured input/output, not tied to any one vendor's SDK shape. |
| Analytics | Plausible or PostHog (self-hostable/low-cost) | SEO/product analytics without heavy cost pre-revenue; swappable later. |
| Error tracking | Sentry | Industry-standard, generous free tier, works across Next.js server/client and the WebSocket gateway. |
| CDN / hosting (initial) | Vercel for `apps/web` (SSR + CDN + edge caching for SEO pages); a low-cost Node host (Render/Railway/Fly.io — final pick deferred to Phase 13) for the WebSocket gateway, Postgres, and Redis | Optimizes for low initial cost and SEO-grade SSR without managing servers for the web tier; the realtime/data tier needs a persistent process, hence a separate low-cost host rather than forcing everything onto one platform. |
| CI/CD | GitHub Actions | Free for public/most private repos at this scale, integrates with the existing GitHub repo. |
| Monitoring/logging | Sentry (errors) + host-provided logs initially; structured JSON logging from day one so a log aggregator (e.g. Axiom/Better Stack) can be added later without changing log call sites | Keeps cost near zero pre-revenue while not blocking a later upgrade. |

## 2. Service boundaries

```
apps/web                 Next.js app: SEO pages, tool UI, API route handlers (auth, watchlists,
                          alerts CRUD, AI chat endpoint), server-rendered option chain pages.
apps/realtime-gateway     Long-lived Node process: connects to the market-data provider,
                          normalizes/validates ticks, publishes to Redis, runs the calculation
                          engine over each update, pushes computed state to the WebSocket
                          clients and writes aggregates to Postgres.
packages/core             Deterministic calculation engine (Phase 3). No I/O.
packages/market-data      Provider interface, normalization schema, validators, MockProvider,
                          (future) real provider adapters. No I/O beyond the provider itself.
packages/ai               AI provider interface, prompt templates, response validators. No I/O
                          beyond the model call.
packages/db               Prisma schema + generated client, shared by apps/web and
                          apps/realtime-gateway.
packages/config           Shared TypeScript/ESLint config.
```

Rule enforced by this boundary: `packages/core` and `packages/market-data`'s *interfaces* never import from `apps/web` or any specific provider SDK — dependencies point inward (apps depend on packages, packages don't depend on apps), which is what makes the provider and AI swaps possible in practice rather than just on paper.

## 3. Data flow

```
Market Data Provider (real, later) / MockProvider (now)
   -> ProviderAdapter (packages/market-data)
   -> Normalization (packages/market-data)
   -> Validation (packages/market-data)
   -> Redis (latest-tick cache + pub/sub event)
   -> Calculation Engine (packages/core) [in apps/realtime-gateway]
   -> Postgres (aggregated/historical write) + Redis (computed-state cache)
   -> API (apps/web route handlers, read from Redis/Postgres)
   -> WebSocket (apps/realtime-gateway pushes computed state to subscribed clients)
   -> Frontend (apps/web)
   -> AI Intelligence (packages/ai, invoked from apps/web on rule-detected significant change or
      explicit user request — reads only the already-computed, validated state, never raw ticks)
```

## 4. API architecture

- REST-style route handlers under `apps/web/app/api/*` for anything request/response shaped: auth, watchlists, alerts CRUD, historical queries, AI chat.
- WebSocket channel per instrument+expiry (`ws://.../stream/{instrument}/{expiry}`) served by `apps/realtime-gateway` for live option-chain/LTP updates; the web app subscribes client-side.
- All API responses that carry market data include a `asOf` freshness timestamp and a `stale: boolean` flag computed server-side (never left for the client to guess).

## 5. WebSocket architecture

- Single gateway process, horizontally scalable behind a load balancer once needed (out of scope pre-launch — one instance is enough at MVP traffic).
- Redis pub/sub decouples ingestion from client fan-out: the ingestion loop publishes computed state once per update; the gateway's WS layer only subscribes and relays, so gateway restarts don't affect ingestion and vice versa.
- Reconnection handled client-side with backoff; on reconnect the client first fetches current state via REST, then re-subscribes to the socket, so a dropped connection never shows silently frozen data (ties to NFR-6 from Phase 0).

## 6. Database architecture

- Prisma schema (Phase 8 introduces the actual models: `User`, `Watchlist`, `WatchlistItem`, `Alert`, `Plan`, `Entitlement`, `UsageCounter`). Phase 1 only reserves the package and connection setup — no business schema yet, since accounts don't exist until Phase 8.
- Historical market data: append-only tables keyed by (instrument, expiry, strike, optionType, timestamp), written by `apps/realtime-gateway` on a bounded interval (not every tick) starting in Phase 6. Aggregation jobs roll up to coarser intervals for older data.

## 7. Cache architecture

- Redis key space: `md:latest:{instrument}:{expiry}` (latest normalized snapshot), `md:computed:{instrument}:{expiry}` (latest calculation-engine output), pub/sub channel `md:updates:{instrument}:{expiry}`.
- AI explanation cache: `ai:explanation:{hash of computed-state input}` with a short TTL, so repeated identical states don't re-trigger a model call (Phase 7, NFR-16).

## 8. AI architecture

See `packages/ai` boundary above and Phase 0's AI cost-control flow. Concretely: `apps/realtime-gateway` runs the rule engine on every computed update; only a "significant event" enqueues an AI-explanation job (BullMQ) consumed by a worker that calls `packages/ai`, validates the response shape (DATA/CALCULATION/INTERPRETATION/UNCERTAINTY present, no data fabrication detected against the source state), and writes the result to the AI explanation cache.

## 9. SEO architecture (high-level; full design in Phase 9)

- Instrument/option-chain pages are server-rendered (Next.js) with data fetched at request time from the API layer (not client-only rendering) so crawlers see real content.
- URL structure decided at MVP time per Phase 0 (`../phase-0/05-mvp-definition.md`) to avoid a costly retrofit.

## 10. Free/Premium architecture

- A single `packages/db`-backed `Entitlement` model plus a `packages/core`-adjacent (but framework-agnostic) `entitlements` check function used by every route handler and background job that gates a feature. No plan-name string comparisons in UI or route code — everything calls `hasEntitlement(user, feature)` (introduced in Phase 11, boundary reserved now).

## 11. Security architecture (high-level; full audit in Phase 12)

- Auth.js sessions, CSRF protection on mutating routes, input validation (zod) at every API boundary, rate limiting at the edge (Vercel) and application layer for auth/AI endpoints, secrets via host-provided environment/secret manager (never committed).

## 12. Scaling architecture

- Stateless `apps/web` scales horizontally on Vercel automatically.
- `apps/realtime-gateway` scales by adding instances behind Redis pub/sub fan-out once a single instance can't serve all WS clients; ingestion itself stays single-writer per provider connection to avoid duplicate-tick handling complexity until proven necessary.
- Postgres read replicas and Redis clustering are explicitly deferred until load testing (Phase 12) shows they're needed — not designed speculatively now.

## Critical requirement carried forward

The market-data provider is accessed only through `packages/market-data`'s `MarketDataProvider` interface. `apps/realtime-gateway`, `packages/core`, and `apps/web` never import a provider SDK directly. This is enforced by the scaffold in this phase (only `MockProvider` exists) and must remain true when a real provider is added in Phase 2's later increment.
