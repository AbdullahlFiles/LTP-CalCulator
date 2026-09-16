# MVP Definition

## MVP scope (what ships first)

The MVP is the smallest version of the product that is genuinely useful standalone and demonstrates every core principle from the spec (real data, deterministic calculation, clear interpretation, honest uncertainty). It corresponds to Phases 1-5 plus the minimum SEO scaffolding, and excludes accounts, alerts, blog content, and monetization.

**In scope for MVP:**
- One licensed market-data provider integrated end-to-end (Phase 2), covering at minimum NIFTY, BANK NIFTY, and a representative set of liquid F&O stocks. FINNIFTY/MIDCPNIFTY included if the chosen provider supports them without material extra cost.
- Deterministic calculation engine: LTP/change/%, OI/ΔOI, Volume, IV, core Greeks, PCR, Max Pain, ATM/ITM/OTM, support/resistance, important-strike detection, buildup detection (Phase 3).
- LTP Calculator tool (Phase 4).
- Advanced Option Chain with analytical panels and beginner/advanced mode (power-user mode can follow shortly after if it slips) (Phase 5).
- Minimum SEO scaffolding: correct titles/meta/canonical, crawlable URLs for the calculator and option-chain pages per major instrument, one sitemap, basic structured data. Full SEO architecture (Phase 9) and content engine (Phase 10) can follow MVP, but the URL structure must be decided before MVP ships since retrofitting URLs later costs SEO equity.
- Data-freshness indicator and explicit loading/error/empty/stale states everywhere.
- Legal basics: terms of use, privacy policy, financial-data disclaimer (not a full compliance program — that's Phase 12/13 — but the minimum needed to publicly display market data at all).

**Explicitly deferred past MVP:**
- Accounts, watchlists, alerts (Phase 8).
- Historical data/charts (Phase 6) — MVP shows current-session data only.
- AI intelligence layer (Phase 7) — MVP does not include AI explanations; adding "understand the data" AI narration is the very next increment after MVP, not part of it, so that the deterministic layer can be validated on its own first.
- Blog/education content at scale (Phase 10) — a handful of cornerstone glossary pages may exist, but not the full content engine.
- Premium/billing (Phase 11).
- Full security/load testing program and multi-environment deployment (Phase 12-13) — MVP still needs *basic* security (auth-free MVP reduces this risk surface considerably) and a single production environment, just not the full audit.

## Why AI and historical data are outside MVP

The spec's own principle is "never fabricate data" and "AI receives trusted structured data" — that trust can only be established once the deterministic engine (Phase 3) has run against real data long enough to validate its outputs. Shipping AI explanations before the deterministic layer is proven risks exactly the failure mode the spec warns against. Historical data is deferred because it requires storage/aggregation infrastructure that is better designed once real production data volume is observed, not guessed at.

## MVP exit criteria

See `12-acceptance-criteria.md` for the full list; the top-level bar is: a first-time visitor can, without an account, look up any covered instrument's live-ish option chain, understand the ATM strike and CE/PE OI at a glance, and trust the freshness of what they're looking at — on both desktop and mobile.
