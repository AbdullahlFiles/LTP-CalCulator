# Phase 13 — Production Deployment

## What shipped

- **`Dockerfile`** (repo root, multi-stage): builder stage runs the full pnpm workspace install + `prisma generate` + `next build` (needs the whole monorepo because `transpilePackages` compiles workspace packages from source, not from a pre-built dist); runtime stage copies only `apps/web/.next/standalone` + `.next/static` + `public` into a slim `node:22-slim` image, running as a non-root user.
- **`next.config.ts`**: `output: "standalone"` — produces the minimal self-contained server bundle the Docker image copies.
- **`docker-compose.yml`**: a local, production-shaped stack (Postgres + the built web image + a one-off `migrate` service) for verifying the image actually runs, not a production deployment manifest itself.
- **`.github/workflows/ci.yml`**: install → generate Prisma client → apply migrations against a real Postgres service container → typecheck → lint → test → build → dependency audit (report-only), on every push/PR.
- **`.env.example`** files (already present per-package since earlier phases) collectively document every environment variable a deployment needs — see the table below.

## Verified — and honestly, what wasn't

**No Docker daemon is available in this sandbox** (`docker ps` fails with "no such file or directory" on the socket) — the `Dockerfile` and `docker-compose.yml` have **not** been build-tested end to end, and this is stated plainly rather than glossed over.

What *was* verified, as the closest available substitute: the exact artifact the Dockerfile's runtime stage packages — `apps/web/.next/standalone/apps/web/server.js` plus its traced `node_modules`, `.next/static`, and `public` — was copied into place and run directly with `node`, under `NODE_ENV=production` and a real `DATABASE_URL` pointing at this sandbox's Postgres. It started in 229ms and correctly served the home page, an SSR page (`/option-chain`), a live API route that queried real Postgres-backed computed data, `/sitemap.xml`, and the Phase 12 security headers. This confirms the Next.js build/standalone-output side of the Dockerfile is sound; it does not confirm the Docker layer itself (base image compatibility, the `COPY --chown` permissions, the non-root user) builds and runs correctly, since that requires an actual container runtime.

**Before trusting this Dockerfile in a real deployment**: build it with a real Docker daemon (`docker build -t ltp-calculator .`) and run `docker compose up` end to end at least once. Flagging this explicitly rather than claiming a verification that didn't happen.

## Environment variables a deployment needs

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Use a managed instance in production, not a container's local volume. |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32`. Never reuse the value in this repo's `.env.local`/CI. |
| `NEXT_PUBLIC_SITE_URL` | Yes | The real deployed domain — canonical URLs, the sitemap, and Open Graph tags are wrong without it (Phase 9). |
| `ANTHROPIC_API_KEY` | No | Enables the real AI provider (Phase 7); omitted → deterministic template provider. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PREMIUM`, `STRIPE_WEBHOOK_SECRET` | No | Enable real billing (Phase 11); omitted → dev/demo billing provider, which itself refuses to run when `NODE_ENV=production` (see `packages/billing/src/providers/devProvider.ts`) — **a production deploy without these three has no working upgrade path at all, by design**, rather than a silently-free one. |

## Operational runbooks

See [`runbooks.md`](runbooks.md) for the incident playbooks the master spec calls for (market-data provider outage, database outage, WebSocket outage, API overload, traffic spike, bad deployment, incorrect market data, security incident, AI service outage).

## Production readiness checklist

- [x] CI runs install/typecheck/lint/test/build/migrate-deploy on every push (`.github/workflows/ci.yml`).
- [x] Container image defined, minimal (standalone output), non-root user.
- [ ] **Blocking**: a real licensed market-data provider decision (`docs/phase-0/11-risks-and-assumptions.md`, R1) — this entire platform currently runs on `MockProvider`, clearly labeled as synthetic everywhere in the UI. Do not remove that labeling or point this stack at production traffic implying real data until this is resolved.
- [ ] **Blocking for real billing**: a real Stripe account, product, and price — `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID_PREMIUM`/`STRIPE_WEBHOOK_SECRET` configured, and the dev billing provider's production-refusal guard (`docs/phase-11/README.md`) double-checked by attempting (and expecting to fail) a checkout with `NODE_ENV=production` and no Stripe key set.
- [ ] A real Postgres instance provisioned outside this sandbox (managed service, not a bare container) with backups enabled.
- [ ] Secrets sourced from a real secrets manager, not `.env` files, in whatever hosting platform is chosen.
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain before the first deploy (retrofitting canonical URLs after search engines have indexed the wrong domain is costly).
- [ ] Error tracking (e.g. Sentry) wired up — not implemented in any phase so far; this codebase currently only has `console.error`/`console.warn` calls at its failure points (`historicalCollector.ts`, `alertEvaluator.ts`, `@ltp/ai`'s fallback paths), which is enough to debug locally but not enough to know something failed in production without someone actively watching logs.
- [ ] Uptime monitoring on the deployed URL.
- [ ] A real load test against a real staging deployment at the scales the master spec calls for (100/1,000/10,000/100,000 users) — Phase 12 explains why this couldn't be done here.
- [ ] The Docker build itself verified end-to-end with a real Docker daemon (see "Verified — and honestly, what wasn't" above).
- [ ] Legal basics confirmed before public launch: terms of use, privacy policy, financial-data disclaimer, and the data-provider licensing question — none of this is legal advice and none of it has been resolved in code; it needs the product owner and likely counsel, per `docs/phase-0/11-risks-and-assumptions.md`.

## What's intentionally not built

Per the Phase 1 architecture (`docs/phase-1/README.md`) and every phase since, several things described there as the *target* architecture were never built, on purpose, because building them now — with a mock data provider and no real production traffic to size them against — would be exactly the "speculative infrastructure" the project rules warn against:

- `apps/realtime-gateway` (the dedicated market-data/computation process) — everything currently runs the computation synchronously inside `apps/web`'s request path. Phase 12's performance section found the actual local-measurement reason this matters before scaling further.
- Redis for the real-time cache, the AI explanation cache, the rate limiter, and the alert/historical-collector loops — all four currently use in-process, single-instance-only implementations, each documented at the point it was introduced.
- Multi-environment (dev/staging/prod) infrastructure-as-code — there is one Dockerfile and one CI workflow; a real staging environment is a hosting-platform decision, not something to fabricate configuration for without a real target.
