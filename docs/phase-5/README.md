# Phase 5 — Advanced Option Chain

## What shipped

### Calculation engine additions (`@ltp/core`)
- `chainSummary.ts`: `detectUnusualActivity` (flags contracts whose volume or |ΔOI| exceeds a multiplier of the current chain's own average — documented as a same-snapshot baseline, weaker than a real historical baseline which Phase 6 can supply instead) and `computeMarketSummary` (a deterministic, rule-based plain-language read of PCR/Max Pain/ATM — explicitly not the AI layer, and every sentence is hedged so it never states a guaranteed outcome, per the project's core "never claim a guaranteed direction" rule). 7 new tests, 43 total in `@ltp/core`.

### `apps/web`
- `/option-chain` — full strike-centered CE | Strike | PE table (`components/option-chain/OptionChainTable.tsx`), virtualized with `@tanstack/react-virtual` so row count doesn't scale rendering cost linearly (NFR-2).
- Beginner / Advanced / Power view modes: Beginner shows only LTP/Chg%/OI and is pinned to ±5 strikes with no important-strikes/unusual-activity panels; Advanced adds ΔOI/Volume/IV; Power adds Delta and Bid/Ask plus a denser row height.
- Strike-range filter (±5/±10/±20/all around ATM), search-by-strike, and sort by strike or by either side's OI/ΔOI/Volume with a direction toggle.
- Analytical panels: deterministic market summary, PCR, Max Pain, ATM strike, support/resistance (highest Put/Call OI), important strikes, unusual activity — each reading directly off `ComputedOptionChain`, which now also carries `unusualActivity` and `marketSummary`.
- ATM row highlighting and an unusual-activity marker inline in the table, backed by the same computed data as the panels (no separate/duplicated logic).

## Bug caught and fixed during this phase

The table's column count changes per mode (3 / 6 / 8 columns), so column widths were originally built with a template-literal Tailwind class (`` `grid-cols-${count}` ``). Tailwind's build-time scanner can't see class names assembled at runtime, so only whichever count happened to appear literally elsewhere in the source would actually get generated — a real bug, not just a lint nit. Fixed by switching to an inline `gridTemplateColumns` style for those three call sites; caught by re-reading the component before, not after, the browser check, then confirmed correct in the Advanced/Power screenshots (columns render with the right count and alignment).

## Verification

- `pnpm -r test` — 54 tests pass (`@ltp/core` 43, `@ltp/market-data` 11).
- `pnpm -r typecheck` — clean.
- `pnpm --filter=web lint` / `build` — clean.
- Manual browser walkthrough (Playwright screenshots, not committed) of all three modes on `/option-chain`, confirming: correct column sets per mode, ATM highlighting, unusual-activity badges matching the panel below, strike-range and mode switching, and that Power mode's Greeks/Bid-Ask columns render real (not placeholder) values.

## Known simplifications

- Unusual-activity detection uses a same-chain-snapshot baseline (documented in `chainSummary.ts`); a real historical baseline is a Phase 6 upgrade, not a Phase 5 gap in the calculation itself.
- No dedicated instrument-picker or multi-expiry comparison view yet — single instrument/expiry at a time, matching the MVP scope in `docs/phase-0/05-mvp-definition.md`.
- Still running on the same single in-process `MockProvider` described as a Phase 4 simplification in `docs/phase-4/README.md` — unchanged in this phase.
