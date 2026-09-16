# Phase 9 — SEO Architecture

## What shipped

- `lib/seo.ts`: `buildMetadata()` — the one function every indexable page builds its title/description/canonical/OpenGraph/Twitter metadata through, so those stay consistent instead of hand-assembled per route. `NOINDEX_METADATA` for pages that must never be indexed.
- `app/sitemap.ts`: dynamically generated from `INSTRUMENTS` and `GLOSSARY_ENTRIES` — it cannot drift from the real route structure the way a hand-maintained sitemap would. Excludes every private/session-specific route.
- `app/robots.ts`: allows everything except `/api/`, `/dashboard`, `/login`, `/register`, and points at the sitemap.
- Per-instrument SEO-indexable landing pages: `/option-chain/[instrument]` and `/ltp-calculator/[instrument]` (`nifty`, `bank-nifty`, `finnifty`), each server-rendered with instrument-specific title/description/canonical and `WebApplication` JSON-LD structured data. `OptionChain` and `LtpCalculator` both accept an `initialInstrument` prop so these pages reuse the existing client components rather than duplicating them.
- `/dashboard` is explicitly marked `noindex` (user-specific data, per the project's "never index private pages" rule).
- Internal linking: the base `/option-chain` and `/ltp-calculator` pages link to each instrument-specific variant, and `metadataBase` is set globally so relative OG image/URL resolution is correct.

## Verified live

Ran the dev server and confirmed: `/sitemap.xml` returns valid XML listing all static, instrument, and glossary URLs; `/robots.txt` correctly disallows the private routes and points at the sitemap; `/option-chain/bank-nifty` returns `200` with the correct per-instrument `<title>` and an `application/ld+json` block. `next build` produced all instrument pages as pre-rendered static HTML (`generateStaticParams`), not server-rendered on every request.

## Known simplifications

`NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3000` — **a production deployment must set this to the real domain** or canonical URLs, the sitemap, and Open Graph tags will all be wrong. No Open Graph *images* are generated yet (text-only OG tags) — a follow-up, not a Phase 9 gap given no design assets exist yet.
