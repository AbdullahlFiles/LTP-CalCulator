# Feature Hierarchy

Organized by product area, in build order. This is the backlog skeleton for Phases 4-11.

## 1. Market data foundation (Phase 2-3, prerequisite for everything below)
- Provider adapter + normalization + validation
- Real-time cache (Redis) + event bus
- Deterministic calculation engine (LTP change, %, OI, ΔOI, IV, Greeks, PCR, Max Pain, ATM/ITM/OTM, support/resistance, buildup detection)

## 2. LTP Calculator (Phase 4)
- Instrument selector (index/stock)
- Expiry selector
- Strike selector
- CE/PE toggle
- Live LTP, LTP change, % change
- OI, ΔOI, Volume, IV, Greeks for the selected contract
- ATM/ITM/OTM tag
- Stale-data indicator, loading/error/empty states

## 3. Advanced Option Chain (Phase 5)
- Full strike-centered CE/PE table with virtualization
- ATM highlight, ITM/OTM shading
- Sortable/filterable columns, search
- Analytical panels: PCR, Max Pain, highest Call/Put OI, highest ΔOI, unusual volume/OI, important strikes, support/resistance, LTP/OI interpretation, market summary
- Beginner / Advanced / Power-user view modes

## 4. Historical + Charts (Phase 6)
- LTP/OI/ΔOI/Volume/IV vs time
- CE vs PE comparison
- Strike-wise OI history, OI buildup timeline
- PCR history, Max Pain movement, support/resistance movement
- Server-side aggregation (no raw tick dumps to the browser)

## 5. AI Intelligence (Phase 7)
- Market summary, strike intelligence, OI intelligence, unusual-activity narrative, support/resistance explanation
- Beginner vs advanced explanation modes
- AI chat scoped to currently displayed data only
- Data/Calculation/Interpretation/Uncertainty labeling in every response

## 6. Accounts, Watchlists, Alerts (Phase 8)
- Registration/login/session management
- Watchlists (instruments, strikes)
- Recent searches, personal dashboard
- Alert types: LTP threshold, % move, OI change, volume spike, IV move, important-strike move, S/R crossing, unusual activity

## 7. SEO + Content (Phase 9-10)
- URL architecture, metadata, structured data, sitemaps
- Glossary + evergreen education articles
- Blog engine with editorial calendar

## 8. Monetization (Phase 11)
- Plans/entitlements/feature flags
- Usage limits, billing, trials, upgrade/cancel flows

## Classification key (applies across all areas above)

- **MUST HAVE**: sections 1-3 in full — the product is not viable without them.
- **SHOULD HAVE**: sections 4-6 — expected by users within the first few months post-launch, but the product is usable without them on day one.
- **NICE TO HAVE**: bid/ask depth, multi-leg strategy builder, screeners beyond basic filters.
- **FUTURE PREMIUM**: deep historical backtesting, advanced AI chat/analysis, personalized dashboards, saved analysis, higher alert/watchlist limits, professional/API-tier access.
- **NOT NECESSARY**: named "proprietary signal" products, guaranteed-accuracy claims, multi-exchange coverage in v1.
- **DIFFERENTIATE**: transparent data/calculation/interpretation/uncertainty framing, adaptive beginner/advanced/power UX, accessibility and performance quality, SEO-integrated education funnel.
