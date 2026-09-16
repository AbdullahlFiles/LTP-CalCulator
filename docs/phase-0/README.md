# Phase 0 — Product Blueprint + Competitor Analysis

Status: **Complete, pending product-owner approval.** No application code has been written in this phase, per the master spec's instruction.

## Research method and limitation (read this first)

The three reference sites —

1. https://nseoptionchain.ltpcalculator.com/
2. https://www.ltpcalculator.com/
3. https://www.niftytrader.in/ltp-calculator

— could not be fetched directly from this build environment (outbound requests to these domains are blocked by the sandbox's network egress policy). The competitor matrix in `02-competitor-matrix.md` is therefore built from publicly indexed search snippets (search-engine results, app-store listings, and the sites' own indexed marketing/blog pages) rather than a live walkthrough of each page.

This is sufficient to make architecture and scope decisions, but **before Phase 0 is treated as final, a human should do one 15-30 minute live walkthrough of each site in a normal browser** (desktop + mobile) and confirm or correct the matrix — especially the exact option-chain columns shown, whether login is required for any feature, and current pricing/paywall placement. Cells in the matrix marked "unconfirmed" need that check most.

Nothing in this document copies competitor code, text, branding, or exact visual design — it records observed *functionality categories* only.

## Contents

1. [Product Requirements Document](01-prd.md)
2. [Competitor Matrix](02-competitor-matrix.md)
3. [Feature Hierarchy](03-feature-hierarchy.md)
4. [User Personas & Journeys](04-personas-and-journeys.md)
5. [MVP Definition](05-mvp-definition.md)
6. [Long-Term Roadmap](../ROADMAP.md) (phase-level; this doc cross-references it)
7. [Free vs Premium Strategy](07-free-vs-premium-strategy.md)
8. [Product Differentiators](08-differentiators.md)
9. [Functional Requirements](09-functional-requirements.md)
10. [Non-Functional Requirements](10-non-functional-requirements.md)
11. [Risks & Assumptions](11-risks-and-assumptions.md)
12. [Acceptance Criteria](12-acceptance-criteria.md)

## Sign-off needed before Phase 1

- [ ] Product owner reviews and approves scope in `01-prd.md` and `05-mvp-definition.md`.
- [ ] Product owner confirms the Free/Premium split in `07-free-vs-premium-strategy.md` is commercially acceptable.
- [ ] Someone does the live competitor walkthrough described above and files corrections as GitHub issues (or edits to `02-competitor-matrix.md`).
- [ ] Product owner acknowledges the legal/data-licensing risk in `11-risks-and-assumptions.md` — this blocks Phase 2, not Phase 1, but should be started in parallel now since provider selection has lead time.
