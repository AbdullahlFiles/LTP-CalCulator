# Risks & Assumptions

## Risks

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Data licensing.** No confirmed licensed market-data provider or NSE redistribution rights exist yet. Building production data display before this is resolved risks legal exposure and a forced rework. | Critical — blocks Phase 2 production launch (prototyping against public/sandbox endpoints is fine; public production display is not) | Phase 2 opens with explicit provider research and requires provider licensing/commercial-terms confirmation before any production data goes live. Do not invent licensing terms; flag anything unconfirmed to the product owner. |
| R2 | **Competitor research gap.** This Phase 0 competitor matrix is built from indexed search snippets, not a live walkthrough (sandbox network policy blocked direct fetch of the three reference domains). | Medium — could miss a real differentiator or misjudge a feature's presence | Documented explicitly in `README.md` and `02-competitor-matrix.md`; a human live walkthrough is a Phase 0 sign-off item, not a blocker to starting Phase 1 architecture work. |
| R3 | **AI cost blowup.** Naively calling an LLM per tick or per user action across a real-time market-data product could be very expensive at scale. | High if unmitigated | Significant-change gating, caching, and tiered model selection are architectural requirements from Phase 7 onward (FR-26, NFR-16), not an optimization deferred to later. |
| R4 | **AI overreach / prompt injection.** A chat feature scoped to market data could be manipulated into fabricating data or ignoring the uncertainty framing. | High — directly undermines the product's core trust principle | Structured DATA/CALCULATION/INTERPRETATION/UNCERTAINTY response format, input validation, and a defined validation layer are required in Phase 7 (FR-23, FR-24, FR-27). |
| R5 | **Provider outage / data staleness presented as live.** Any market-data product risks users trusting frozen data during an outage. | High — direct user harm/trust loss | Freshness timestamps and explicit stale/unavailable UI states are required everywhere (FR-4, NFR-6, NFR-13, NFR-20), from the LTP calculator's first version onward. |
| R6 | **SEO retrofit cost.** If URL structure/metadata are not decided before MVP, changing them later after indexing is costly. | Medium | URL architecture decided at MVP scope (`05-mvp-definition.md`) even though full SEO architecture (Phase 9) and content engine (Phase 10) ship later. |
| R7 | **Scope creep / building everything at once.** The spec covers 14 phases and a large tool ecosystem; attempting to build broadly instead of sequentially risks an unfinished, unstable product. | Medium | Explicit phase gating with acceptance criteria (`12-acceptance-criteria.md`) and the master workflow rule: no silent progression to the next phase with critical issues open. |
| R8 | **Regulatory/compliance for accounts, alerts, and billing** (Phase 8/11) — Indian data-protection and payment-processing requirements are not analyzed in this phase. | Medium — surfaces later, not at MVP | Explicitly deferred to Phase 8 (accounts/data handling) and Phase 11 (billing); flagged here so it isn't forgotten. |

## Assumptions

- A1: NIFTY, BANK NIFTY, and a meaningful subset of liquid F&O stocks are the priority instruments; FINNIFTY/MIDCPNIFTY are included opportunistically based on provider coverage, not treated as launch-blocking.
- A2: The team has (or will set up) a way to pay for a licensed market-data provider and, later, an AI provider — "free-first" describes the *product's* pricing to end users, not zero infrastructure cost to operate.
- A3: The initial target audience is Indian retail options traders using desktop and mobile web; native mobile apps are not assumed necessary for MVP traction.
- A4: "AI-assisted" means natural-language interpretation of already-computed, trusted data — not AI-driven trading signals or predictions, per the spec's explicit rule.
- A5: Regulatory review (SEBI-adjacent disclaimers, data protection law) will be done by/with the product owner before public launch; this document raises the requirement (NFR-24, R8) but does not constitute legal advice or a completed legal review.
- A6: The product will initially run as a single deployable system (not microservices) per the spec's "avoid unnecessary microservices at the beginning" rule, with service boundaries designed to allow future extraction, not implemented as separate services immediately.
