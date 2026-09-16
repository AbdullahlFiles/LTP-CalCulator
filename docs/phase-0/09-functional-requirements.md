# Functional Requirements

Numbered for traceability in later phases (e.g. a Phase 4 PR can reference "FR-12").

## Market data (Phase 2-3)
- FR-1: The system shall ingest live-ish market data from exactly one configured provider at a time, through a provider-adapter interface that can be swapped without changes to downstream consumers.
- FR-2: The system shall normalize all provider payloads into a single internal schema before any calculation or storage.
- FR-3: The system shall reject or flag invalid/out-of-range values (negative OI, impossible IV, etc.) rather than silently passing them through.
- FR-4: The system shall expose a data-freshness timestamp alongside every displayed value.
- FR-5: The system shall detect and handle provider disconnects/outages with retry and circuit-breaking, and shall surface a visible "data may be stale/unavailable" state to the frontend rather than showing frozen data as if live.

## Calculation engine (Phase 3)
- FR-6: The system shall compute LTP change and percentage change deterministically from consecutive normalized prices.
- FR-7: The system shall compute OI, change in OI, and OI percentage change per contract per polling/streaming interval.
- FR-8: The system shall compute or pass through IV and core Greeks (Delta, Gamma, Theta, Vega) per contract where inputs are available, and shall explicitly mark them unavailable (not zero, not omitted silently) when inputs are missing.
- FR-9: The system shall compute PCR (overall and, where useful, strike-wise) from OI data.
- FR-10: The system shall compute Max Pain from OI across all strikes for a given instrument/expiry.
- FR-11: The system shall classify each strike as ATM, ITM, or OTM relative to the current underlying price, per option type.
- FR-12: The system shall detect and tag documented option-market behaviors (long buildup, short buildup, short covering, long unwinding, unusual volume, unusual OI, significant LTP movement, OI concentration) using explicit, documented, deterministic rules.
- FR-13: Every calculation shall be unit tested with documented formulas and assumptions, independent of any live data feed.

## LTP Calculator (Phase 4)
- FR-14: The user shall be able to select an instrument, expiry, strike, and option type (CE/PE) and see current LTP, change, %, OI, ΔOI, Volume, IV, Greeks, and ATM/ITM/OTM classification for that contract.
- FR-15: The UI shall visibly indicate loading, error, empty, and stale-data states for every data-dependent view.
- FR-16: The UI shall update in near-real-time without requiring a full page reload.

## Option chain (Phase 5)
- FR-17: The user shall be able to view a full strike-centered CE/PE table for a selected instrument and expiry, with ATM highlighted.
- FR-18: The user shall be able to sort and filter the table by any displayed metric and search by strike.
- FR-19: The user shall be able to view analytical panels: PCR, Max Pain, highest Call/Put OI, highest ΔOI, unusual volume/OI, important strikes, support/resistance, and a plain-language market summary.
- FR-20: The user shall be able to switch between Beginner, Advanced, and Power-user view modes without losing their current instrument/expiry/strike selection.

## Historical & charts (Phase 6)
- FR-21: The user shall be able to view historical LTP, OI, ΔOI, Volume, IV, PCR, and Max Pain movement for a selected instrument/strike/expiry over a bounded, aggregated time window.
- FR-22: The system shall aggregate historical data server-side; the frontend shall never receive raw unaggregated tick history for long ranges.

## AI intelligence (Phase 7)
- FR-23: The AI layer shall receive only validated, structured output from the calculation engine — never raw provider payloads and never user-supplied claims about market data.
- FR-24: Every AI response about market data shall be structured to separate DATA, CALCULATION, INTERPRETATION, and UNCERTAINTY.
- FR-25: The AI layer shall not generate a response when the underlying data is stale/unavailable without disclosing that fact.
- FR-26: The system shall not call an AI model on every data tick; AI shall be invoked only on rule-detected significant changes or explicit user request, with caching of repeated explanations.
- FR-27: User input to an AI chat scoped to displayed data shall not be able to override or redefine the trusted market data context (prompt-injection resistance).

## Accounts, watchlists, alerts (Phase 8)
- FR-28: A user shall be able to register, log in, and manage a profile and preferences.
- FR-29: A user shall be able to save instruments/strikes to a watchlist, within a plan-configured limit.
- FR-30: A user shall be able to configure alerts on LTP threshold, % move, OI change, volume spike, IV move, important-strike move, support/resistance crossing, and unusual activity, within a plan-configured limit.

## Entitlements (Phase 11)
- FR-31: Every feature gate (usage limit, Premium-only feature) shall be enforced through a single centralized entitlement module, not per-feature ad-hoc checks.

## SEO (Phase 9-10)
- FR-32: Every public, indexable page shall have a correct title, meta description, canonical URL, and structured data where applicable, generated from the same data model the page renders (no hand-maintained duplicate metadata).
- FR-33: User-specific and session-specific pages shall be marked noindex and shall not appear in the sitemap.
