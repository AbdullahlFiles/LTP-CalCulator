# Free vs Premium Strategy

## Principle

The free product must remain genuinely useful indefinitely. Premium adds *more* (depth, limits, automation, personalization) rather than removing baseline functionality. This must be enforced architecturally (a central entitlement/feature-flag system, Phase 11), not by scattering `if (user.isPremium)` checks through the UI.

## Free tier (always available, no account required unless noted)

- LTP Calculator, full option chain, PCR, Max Pain, support/resistance, important strikes, current OI/ΔOI/Volume/IV/Greeks — no login required.
- Basic AI-assisted interpretation of currently displayed data, within a sensible daily usage limit per visitor/account (exact number set in Phase 7/11 based on observed AI cost — not invented here).
- Basic historical view (e.g., recent sessions, not years) — exact window set in Phase 6 based on storage cost.
- Basic charts (current-session and short-term).
- Watchlist and alerts *require* a free account, with modest limits (e.g., a small number of watchlist instruments and active alerts) to keep infra cost bounded while still being useful.
- Full educational/blog content.

## Premium (future; feature list is a hypothesis, not a commitment)

- Deeper historical data and backtesting.
- Advanced AI: unlimited/expanded chat, deeper multi-factor analysis, saved analyses.
- Advanced charts (multi-instrument overlay, custom indicators).
- Screeners across the full F&O universe with custom criteria.
- Strategy analysis (multi-leg payoff/breakeven tools).
- Personalized dashboards, more watchlists, more alerts, higher refresh/API-like limits.
- Priority/professional-grade data freshness if the licensed provider tiering supports it.

## Why the split is drawn here

- Everything in Free is either (a) required to be useful at all — core data, calculator, chain — or (b) cheap to serve at scale relative to the SEO/acquisition value it generates (basic AI within a cap, basic history/charts).
- Everything in Premium is either expensive to serve at scale (deep history, heavy AI usage, screeners across the full universe) or serves a narrower, higher-willingness-to-pay segment (power users, small desks) rather than the broad top-of-funnel audience the free tier exists to acquire.

## Architectural requirement

- A single entitlement service/module is the source of truth for "can this user/session do X." Every feature checks entitlements through this module, never through ad-hoc plan-name string comparisons scattered across the codebase.
- Feature flags and usage limits are configuration, not code — changing a limit or promoting a feature from Premium to Free (or vice versa) should not require a deploy touching business logic in multiple files.
- Anonymous (non-account) usage still has entitlements — a lower default tier, not a special-cased "no limits" path or an all-or-nothing gate.

## Open questions for the product owner (not decided here)

- Exact numeric limits (watchlist size, alert count, AI calls/day, historical window) — deferred to Phase 8/11 once real infra costs are known.
- Pricing and billing model (monthly/annual, per-feature vs. tiered) — deferred to Phase 11.
