# Development Roadmap

The platform is built in 14 sequential phases. A phase is not started until the previous phase's acceptance criteria are met and, for Phase 0 specifically, explicitly approved by the product owner.

| Phase | Name | Status |
|---|---|---|
| 0 | Product Blueprint + Competitor Analysis | **Done — pending approval** |
| 1 | Technical Architecture | Not started |
| 2 | NSE Market Data Infrastructure | Not started |
| 3 | Deterministic Market Calculation Engine | Not started |
| 4 | LTP Calculator | Not started |
| 5 | Advanced Option Chain | Not started |
| 6 | Historical Data + Charts | Not started |
| 7 | AI Options Intelligence | Not started |
| 8 | User Accounts + Watchlists + Alerts | Not started |
| 9 | SEO Architecture | Not started |
| 10 | SEO Content + Blog Engine | Not started |
| 11 | Free-to-Premium SaaS | Not started |
| 12 | Testing + Security + Performance | Not started |
| 13 | Production Deployment | Not started |

## Rules that apply to every phase

- Read prior phase decisions before starting.
- Produce an implementation plan before writing code.
- Implement incrementally; run tests, lint/type checks; check performance, security and SEO impact where applicable.
- Document what changed, what remains open, and anything that needs a business/legal/data-provider decision.
- Never fabricate market data, API credentials, or provider licensing terms.
- Never use an LLM as the primary/authoritative source for financial calculations or live data.

See `docs/phase-0/` for the Phase 0 outputs that all subsequent phases must treat as the source of truth (until explicitly revised).
