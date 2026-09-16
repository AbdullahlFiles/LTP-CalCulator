# Development Roadmap

The platform is built in 14 sequential phases. A phase is not started until the previous phase's acceptance criteria are met and, for Phase 0 specifically, explicitly approved by the product owner.

| Phase | Name | Status |
|---|---|---|
| 0 | Product Blueprint + Competitor Analysis | Done — see `docs/phase-0/` |
| 1 | Technical Architecture | Done — see `docs/phase-1/` |
| 2 | NSE Market Data Infrastructure | Done — `packages/market-data` (provider interface, validation, `MockProvider`); no standalone `docs/phase-2/` was written, see the "Phase 1-3" commit and `docs/phase-4/README.md` for how it's used |
| 3 | Deterministic Market Calculation Engine | Done — `packages/core`; same note as Phase 2 above |
| 4 | LTP Calculator | Done — see `docs/phase-4/` |
| 5 | Advanced Option Chain | Done — see `docs/phase-5/` |
| 6 | Historical Data + Charts | Done — see `docs/phase-6/` |
| 7 | AI Options Intelligence | Done — see `docs/phase-7/` |
| 8 | User Accounts + Watchlists + Alerts | Done — see `docs/phase-8/` |
| 9 | SEO Architecture | Done — see `docs/phase-9/` |
| 10 | SEO Content + Blog Engine | Done — see `docs/phase-10/` |
| 11 | Free-to-Premium SaaS | Done — see `docs/phase-11/` |
| 12 | Testing + Security + Performance | Done — see `docs/phase-12/` |
| 13 | Production Deployment | Done — see `docs/phase-13/` |

Every phase marked "Done" shipped real, verified code (not just design docs) — check that phase's own `README.md` for what was actually built, how it was verified (including live manual verification against a running server, not only unit tests), and its explicitly documented known limitations. "Done" means the phase's stated scope shipped and was verified; it does not mean every open item across all phases is resolved — see `docs/phase-13/README.md`'s production readiness checklist for what's still outstanding (a real data-provider license, real billing credentials, a real Docker build/run verification, legal review) before this goes to real users.

## Rules that apply to every phase

- Read prior phase decisions before starting.
- Produce an implementation plan before writing code.
- Implement incrementally; run tests, lint/type checks; check performance, security and SEO impact where applicable.
- Document what changed, what remains open, and anything that needs a business/legal/data-provider decision.
- Never fabricate market data, API credentials, or provider licensing terms.
- Never use an LLM as the primary/authoritative source for financial calculations or live data.

See `docs/phase-0/` for the Phase 0 outputs that all subsequent phases must treat as the source of truth (until explicitly revised).
