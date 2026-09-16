# Competitor Feature Matrix

**Read the limitation note in `README.md` first.** Rows marked "Unconfirmed" are inferred from indexed search snippets / app-store listings, not a live walkthrough, and need human confirmation. Nothing here reproduces any competitor's code, copy, or design — only functionality categories.

Legend: ✅ confirmed present · 🟡 unconfirmed / likely · ❌ not found evidence of · — not applicable / unknown

| Feature | nseoptionchain.ltpcalculator.com | ltpcalculator.com | niftytrader.in |
|---|---|---|---|
| Main positioning | "Advanced" option-chain analytics with proprietary reversal/level tools | Same brand family; adds mentoring/education services | Broad F&O analytics portal (option chain is one of many tools) |
| LTP display | ✅ core feature | ✅ core feature | ✅ (`/ltp-calculator/nifty`) |
| Option chain | ✅ | 🟡 (brand overlaps with #1) | ✅ (`/nse-option-chain`, per-instrument pages) |
| Instrument coverage | NIFTY/BANKNIFTY/FINNIFTY + stocks (🟡 exact list unconfirmed) | Same brand family | NIFTY, BANK NIFTY, FINNIFTY, SENSEX, MCX commodities, crypto F&O (broader than NSE-only) |
| Expiry selection | 🟡 likely | 🟡 likely | ✅ (per-instrument option chain pages) |
| Strike selection / ATM-centered view | 🟡 likely | 🟡 likely | ✅ |
| CE/PE columns | ✅ | ✅ | ✅ |
| OI | ✅ | ✅ | ✅ |
| Change in OI | ✅ | ✅ | ✅ ("four columns decide most trades: OI, change in OI, IV, LTP") |
| Volume | ✅ | ✅ | 🟡 |
| IV | ✅ (dedicated IV calculator) | ✅ | ✅ |
| Greeks | ✅ (dedicated Greeks calculator, "Delta" explicitly mentioned) | ✅ | 🟡 (delta mentioned for LTP calc, full Greeks set unconfirmed) |
| Bid/Ask | — unconfirmed | — unconfirmed | — unconfirmed |
| PCR | 🟡 likely, unconfirmed on this specific subdomain | 🟡 | ✅ dedicated PCR charts |
| Max Pain | 🟡 unconfirmed on this subdomain | 🟡 | ✅ dedicated Max Pain live chart per instrument/stock |
| Support/Resistance | ✅ ("confirmed supports", "imaginary line" concept) | ✅ | ✅ ("support/resistance zones") |
| Proprietary interpretive tools | ✅ heavy: "9:20 Magical Lines", "6 kinds of reversals", "Intraday Kundli", "iDaddy Blast" signals, "Chart of Accuracy" | ✅ same family | ❌ not observed; niftytrader leans on raw analytics + charts rather than named proprietary signal products |
| Historical data | ✅ ("historical option chain data") | 🟡 | ✅ explicitly "7 years of backtest data" |
| Charts | ✅ interactive charts mentioned | 🟡 | ✅ (OI timeflow, PCR, Max Pain charts) |
| Auto-refresh / live streaming | ✅ ("tick-by-tick", "Live Data Streaming via NSE API") | 🟡 | 🟡 likely, unconfirmed cadence |
| Filters/sorting | 🟡 likely (ATM/ITM/OTM filter is a generic LTP-calculator pattern per search results) | 🟡 | 🟡 |
| Alerts | ✅ ("Custom Alerts for predefined market conditions", "Intraday Reversal Alerts") | ✅ | 🟡 unconfirmed |
| AI / algorithmic features | ✅ explicit: "AI-Powered Accuracy Tracking", "Manual & Auto Mode with AI-powered automation" | ✅ same family | ❌ not observed in snippets (may still exist) |
| User accounts / login | ✅ ("Online Login" appears in page titles) | 🟡 | 🟡 |
| Mobile apps | ✅ dedicated Android + iOS apps exist | 🟡 shares apps with #1 | ✅ dedicated Android app |
| Mobile web experience | 🟡 unconfirmed | 🟡 | 🟡 |
| SEO / content structure | Per-instrument/per-purpose landing pages inferred from URL patterns | ✅ has a `/blogs/` section with comparison/educational articles | ✅ strong per-instrument URL structure (`/nse-option-chain/nifty`, `/options-max-pain-chart-live/<symbol>`, `/ltp-calculator/nifty`) — this is the most SEO-scaled of the three based on visible URL variety |
| Education/community content | ✅ "Voice Notes", "Post-Market Analysis", "Weekend Q&A", "Live Classes" — leans into a mentoring/community product | ✅ same family | 🟡 blog existence unconfirmed in snippets |
| Monetization signals | Paid mentoring/community layer ("Exclusive... Sessions", "Live Classes") alongside the free calculator | Same | Not clearly visible in snippets; likely ads + possible premium data/screener tier given portal breadth |

## Feature classification

Per the master spec, every feature observed or specified is classified below for *our* product (not a re-statement of the competitor's own priority):

| Feature | Classification | Rationale |
|---|---|---|
| LTP + option chain, CE/PE, OI, Change OI, Volume, IV | MUST HAVE | Table-stakes across all three competitors and the core of the product |
| Greeks (Delta/Gamma/Theta/Vega) | MUST HAVE | Present on all competitors in some form; needed for "advanced" persona from day one |
| ATM/ITM/OTM classification, expiry/strike selectors | MUST HAVE | Baseline UX pattern users already expect |
| PCR, Max Pain | MUST HAVE | Strongly present on niftytrader.in; high perceived value relative to computation cost |
| Support/Resistance, important-strike detection | MUST HAVE | Present on all three in some form; core to "explain the data" goal |
| Buildup detection (long/short buildup, short covering, long unwinding) | SHOULD HAVE | Not explicitly confirmed on competitors but is standard options-analytics vocabulary and directly serves the "explain, don't just display" principle |
| Historical option chain / charts | SHOULD HAVE | niftytrader claims 7 years; strong differentiator opportunity if done with good UX, but heavier engineering lift — sequenced at Phase 6 |
| Basic AI explanation of current chain state | SHOULD HAVE (free) | Differentiator vs. all three, which lean on proprietary named signals rather than transparent "data → interpretation → uncertainty" framing |
| Watchlists, basic alerts | SHOULD HAVE | Present on ltpcalculator.com family; needed to drive account creation funnel |
| Bid/Ask display | NICE TO HAVE | Unconfirmed as competitor differentiator; depends entirely on data-provider entitlement/cost, deferred to Phase 2 provider decision |
| Named proprietary "signal" products (e.g. "Magical Lines", "iDaddy Blast", accuracy-tracked predictions) | NOT NECESSARY / explicitly avoided | Conflicts with the spec's core principle of separating data/calculation/interpretation/uncertainty and not presenting AI as guaranteed prediction |
| Mentoring/live-classes/community layer | NOT NECESSARY for v1 | Out of scope; a content/education *product* is handled instead through the SEO content engine (Phase 10), not paid mentorship |
| Multi-exchange coverage (BSE/MCX/crypto) | FUTURE PREMIUM / OUT OF SCOPE v1 | niftytrader differentiator, but spec scopes this product to NSE; revisit only if licensing and demand justify it |
| Deep historical backtesting (years of tick data), advanced screeners, strategy analysis | FUTURE PREMIUM | Matches spec's suggested Premium feature list directly |
| Advanced AI chat, personalized dashboards, saved analysis | FUTURE PREMIUM | Matches spec's suggested Premium feature list directly |
| Transparent data/calculation/interpretation/uncertainty separation in every AI output | DIFFERENTIATE | None of the three competitors visibly frame it this way; this is our stated core principle |
| Clean, fast, accessible UI with explicit loading/error/empty/stale states | DIFFERENTIATE | Competitor sites (per public app-store reviews and general category norms) are typically dense/ad-heavy; UX quality is an explicit differentiation axis in the spec |
| Beginner/Advanced/Power-user mode switching in the same tool | DIFFERENTIATE | Not observed on any competitor; directly serves the spec's "adapt complexity to experience" principle |
