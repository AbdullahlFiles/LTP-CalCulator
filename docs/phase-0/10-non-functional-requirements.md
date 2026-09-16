# Non-Functional Requirements

## Performance
- NFR-1: Initial page load (LTP calculator, option chain landing pages) shall be server-rendered or statically rendered for SEO-critical content; time-to-first-contentful-paint should target well under 2.5s on a typical mobile connection.
- NFR-2: Real-time updates to the option chain shall not cause full table re-renders; large tables shall use virtualization or an equivalent windowing strategy.
- NFR-3: Historical/chart endpoints shall return pre-aggregated data sized appropriately for the requested time range, not raw tick dumps.

## Scalability
- NFR-4: The architecture shall be load-tested at 100 / 1,000 / 10,000 / 100,000 concurrent users before being declared production-ready for that tier (Phase 12).
- NFR-5: The market-data ingestion path shall be decoupled (event bus/cache) from the request-serving path so a spike in web traffic cannot directly overload the data-provider connection.

## Reliability / availability
- NFR-6: Provider outages, WebSocket disconnects, and stale data shall degrade the UI to a visible "stale/unavailable" state rather than silently freezing or fabricating values.
- NFR-7: The system shall have health checks, retries with backoff, and circuit breakers on all external dependencies (data provider, AI provider, database, cache).

## Security
- NFR-8: Authentication, authorization, input validation, and rate limiting shall be applied to all account and write endpoints.
- NFR-9: The system shall be tested against XSS, CSRF, SQL/NoSQL injection, API abuse, bot abuse, and AI prompt injection before production launch (Phase 12).
- NFR-10: Secrets (provider API keys, AI keys, DB credentials) shall be managed through a secrets manager, never committed to source control.
- NFR-11: Sensitive actions (auth changes, billing events, admin actions) shall be audit-logged.

## Data integrity
- NFR-12: The system shall never fabricate LTP, OI, Volume, IV, Greeks, or historical values under any circumstance, including provider outages.
- NFR-13: Data freshness shall be visible wherever market data is displayed.

## AI governance
- NFR-14: AI output shall never be presented as a guaranteed prediction, guaranteed profit, or risk-free trade.
- NFR-15: AI provider shall be abstracted so the underlying model can be changed without touching calling code.
- NFR-16: AI cost shall be controlled via the significant-change gating and caching strategy described in FR-26; model tier shall be configurable per task type (cheap model for routine tagging, stronger model for complex explanation).

## SEO
- NFR-17: All indexable pages shall pass basic technical SEO checks (crawlable, correct canonical, no unintended duplicate content, valid structured data) as part of CI, not only manual audit.
- NFR-18: Core Web Vitals targets shall be tracked for the top SEO-entry page types (tool pages, instrument option-chain pages, educational articles).

## Accessibility & UX
- NFR-19: Core flows (instrument/expiry/strike selection, reading the option chain, reading AI explanations) shall be usable via keyboard and shall meet WCAG 2.1 AA at minimum for color contrast and semantic structure.
- NFR-20: Every data view shall define loading, error, empty, and stale states explicitly — "no data" and "not yet loaded" shall never look identical.

## Maintainability
- NFR-21: Market-data provider and AI provider shall each sit behind a narrow interface such that a provider swap touches only the adapter implementation, not calling code.
- NFR-22: Premium/entitlement logic shall be centralized (see FR-31); no feature shall hard-code a plan check outside the entitlement module.

## Compliance
- NFR-23: Public display of NSE-derived market data shall not proceed until the licensing/redistribution question in `11-risks-and-assumptions.md` (R1) is resolved with the selected data provider.
- NFR-24: The product shall carry clear financial-information disclaimers, terms of use, privacy policy, and cookie policy appropriate to displaying market data and operating user accounts in India.
