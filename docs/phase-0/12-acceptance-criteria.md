# Acceptance Criteria

## Phase 0 is done when:

- [x] Competitor matrix produced, with limitations explicitly documented (`02-competitor-matrix.md`, `README.md`).
- [x] Every feature from the spec's core scope and tool ecosystem is classified (MUST/SHOULD/NICE/NOT NECESSARY/FUTURE PREMIUM/DIFFERENTIATE) (`02-competitor-matrix.md`, `03-feature-hierarchy.md`).
- [x] PRD covers goals, non-goals, target users, scope-by-phase, and success metrics (`01-prd.md`).
- [x] Personas and journeys cover beginner through power-user (`04-personas-and-journeys.md`).
- [x] MVP is explicitly scoped and distinguished from the full roadmap, with a stated rationale for what's excluded (`05-mvp-definition.md`).
- [x] Long-term roadmap exists at the phase level (`../ROADMAP.md`).
- [x] Free vs Premium strategy is defined with an architectural principle (central entitlements), not just a feature list (`07-free-vs-premium-strategy.md`).
- [x] Product differentiators are stated and traceable to specific competitor gaps (`08-differentiators.md`).
- [x] Functional and non-functional requirements are numbered for future traceability (`09-functional-requirements.md`, `10-non-functional-requirements.md`).
- [x] Risks and assumptions are documented, including the critical data-licensing risk (`11-risks-and-assumptions.md`).
- [x] No application code was written in this phase.
- [ ] **Pending:** product-owner approval to proceed to Phase 1 (see sign-off checklist in `README.md`).

## What Phase 1 will need from this phase (dependency check)

Phase 1 (Technical Architecture) consumes: the phase-by-phase scope map (`01-prd.md` §5), the MVP boundary (`05-mvp-definition.md`), the requirement that the market-data provider be replaceable (`10-non-functional-requirements.md` NFR-21, restated as a hard constraint in the master spec), and the free/premium entitlement architecture principle (`07-free-vs-premium-strategy.md`). No further Phase 0 work blocks starting Phase 1 architecture design — the outstanding items above (live competitor walkthrough, legal/licensing confirmation) run in parallel and gate later phases (Phase 2 for licensing), not Phase 1 itself.

## Known limitations of this Phase 0 output

1. Competitor matrix is based on indexed search snippets, not a live walkthrough (see R2). Confidence is high for "what exists" (feature presence), lower for exact UX/placement details.
2. Success metrics (`01-prd.md` §6) are hypotheses with no baseline data — expected at this stage, but they should be revisited with real analytics after MVP launch rather than treated as fixed targets.
3. Numeric limits for Free/Premium (`07-free-vs-premium-strategy.md`) are intentionally left undecided pending real infrastructure cost data.
4. Legal/licensing and regulatory items (R1, R8) are flagged, not resolved — resolving them requires the product owner, not the coding agent.
