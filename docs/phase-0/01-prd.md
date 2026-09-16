# Product Requirements Document

## 1. Summary

An NSE-powered LTP Calculator and Options Intelligence platform for Indian retail options traders, ranging from beginners to professional/power users. The product combines live-ish market data (LTP, option chain, OI, IV, Greeks), deterministic analytics (PCR, Max Pain, support/resistance, buildup detection), historical charts, and AI-generated plain-language explanations of what the deterministic data shows — never AI-generated data or predictions presented as fact.

## 2. Goals

- Give every visitor, without signing up, a genuinely useful live option chain and LTP calculator for NIFTY, BANK NIFTY, FINNIFTY and liquid F&O stocks.
- Make option-chain data *understandable*, not just visible — beginners should be able to tell what "long buildup" or "high Put OI at a strike" means without leaving the page.
- Build durable organic (SEO) traffic through tools + education, rather than paid acquisition, at least pre-revenue.
- Build an entitlement architecture from day one so Premium can be introduced later without a rewrite.
- Keep the market-data provider and the AI provider both swappable — this is a hard technical requirement, not an aspiration.

## 3. Non-goals (explicitly out of scope)

- This is not a broker, not an order-execution platform, and will not place trades.
- This is not a "signal service" — the product must never present AI or rule-based output as a guaranteed prediction or trading recommendation.
- No unauthorized scraping of nseindia.com or any exchange website for production data (see Risk R1 in `11-risks-and-assumptions.md`). Development/prototyping against public endpoints, if any, must not become the production data path without a licensing decision.
- No exchanges outside NSE F&O in v1 (no BSE/MCX/crypto, unlike some competitors) — revisit post-MVP if user demand and licensing support it.
- No mobile native apps in v1; responsive web only.

## 4. Target users

See `04-personas-and-journeys.md` for full personas. Summary:

- **Beginner retail trader** — knows what CE/PE are, doesn't reliably know what OI buildup means.
- **Intermediate trader** — checks option chain daily, understands PCR/Max Pain conceptually, wants faster/clearer views than NSE's own site.
- **Advanced options trader** — wants Greeks, multi-expiry views, strike-level history, unusual-activity detection.
- **Professional/power user** — wants speed, keyboard navigation, screeners, API-like access, minimal chrome.

## 5. Scope by phase

Full phase list lives in `docs/ROADMAP.md`. Feature-to-phase mapping:

| Feature area | Phase |
|---|---|
| Data provider integration, normalization, resilience | 2 |
| LTP/OI/Greeks/PCR/Max Pain/buildup-detection formulas | 3 |
| LTP Calculator UI | 4 |
| Full option chain + analytical panels + beginner/advanced/power modes | 5 |
| Historical charts | 6 |
| AI explanations layer | 7 |
| Accounts, watchlists, alerts | 8 |
| SEO architecture (URLs, metadata, structured data, sitemaps) | 9 |
| Blog/education content engine | 10 |
| Plans, entitlements, billing | 11 |
| Security/perf/load testing | 12 |
| Deployment, environments, runbooks | 13 |

## 6. Success metrics (initial hypotheses — revisit post-MVP with real data)

- **Organic traffic**: month-over-month growth in organic sessions to tool pages and educational content, tracked from launch.
- **Engagement**: % of sessions that interact with the option chain (change strike/expiry, sort/filter) vs. bounce.
- **Retention**: return-visit rate within 7 days (a market-data tool is naturally habitual if useful).
- **Free→account conversion**: % of unique visitors who create a free account (enables watchlists/alerts).
- **Account→Premium conversion** (post-launch of Premium): tracked once Phase 11 ships; no target set yet — insufficient data to set one honestly at Phase 0.
- **Data trust**: near-zero incidents of stale/incorrect data displayed without a staleness indicator (see NFRs).

## 7. Key constraints

- Free tier must be *genuinely* useful (explicit requirement from the spec) — feature-gating for Premium must be additive (deeper history, more alerts, advanced AI, screeners), not crippling of the core calculator/chain.
- All financial calculations are deterministic and unit-tested; AI never computes or fabricates market data.
- SEO is a first-class requirement from the start, not a post-launch retrofit.
