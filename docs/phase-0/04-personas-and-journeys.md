# User Personas & Journeys

## Personas

### 1. Beginner — "Rohit", 24, salaried, 6 months into trading
- Knows CE/PE, LTP, basic candlestick charts.
- Does not reliably know what OI, buildup, or Max Pain mean.
- Primary need: understand *what the numbers mean*, not just see them.
- Risk: mistaking an AI explanation for a guaranteed prediction — UI must actively prevent this (uncertainty framing, no "buy/sell" language).

### 2. Intermediate — "Priya", 31, checks the market daily before/during work
- Understands option chain, PCR, basic Greeks conceptually.
- Wants a faster, cleaner alternative to NSE's own option-chain page and ad-heavy competitor sites.
- Primary need: quick daily read of sentiment (PCR, Max Pain, OI shifts) without noise.

### 3. Advanced options trader — "Karan", 38, trades options as a significant income source
- Wants full Greeks, multi-expiry comparison, strike-level history, unusual-activity detection.
- Skeptical of "signal" products; wants transparent, inspectable data and calculations.
- Primary need: depth and trust — sourcing, calculation method, and freshness must be visible.

### 4. Professional/power user — "Anita", 45, runs a small prop/advisory desk
- Wants speed, keyboard-driven navigation, minimal chrome, screener-style filtering across many strikes/instruments.
- Would consider Premium for higher limits, deeper history, and API-like access.
- Primary need: efficiency at scale — this persona is the primary target for Premium.

## Journeys

### J1 — Beginner arrives from a Google search ("what is open interest")
Google → educational article (`/learn/open-interest`) → inline example using live-ish data → CTA into the LTP Calculator with the same instrument pre-selected → sees OI with a plain-language beginner annotation → optionally creates a free account to save the instrument to a watchlist.

### J2 — Intermediate trader's daily check
Direct visit or bookmark → NIFTY option chain (Advanced mode is available but defaults to a clean intermediate view) → glances at PCR/Max Pain panel and highest-ΔOI strikes → checks whether an alert should be set on a strike that's moving → sets an OI-change alert → leaves.

### J3 — Advanced trader deep dive
Visits option chain → switches to Advanced mode → filters strikes near ATM ± N → opens historical OI chart for a specific strike → reads the deterministic buildup-detection tag ("Long buildup detected") → opens the "why" panel to see the exact rule and inputs that produced the tag → cross-checks against Greeks.

### J4 — Power user screening across instruments
Logs in → dashboard shows saved watchlist across multiple F&O stocks → uses filter/sort to find instruments with unusual volume or OI today → drills into one → considers upgrading to Premium once usage/alert limits are hit.

### J5 — Anonymous visitor via a "NIFTY option chain" search
Google → dynamic option-chain landing page (SEO-indexed, live-ish data with clear freshness timestamp) → interacts with the table without any login requirement → sees a non-blocking prompt to create a free account for watchlists/alerts → converts or leaves; either way the page was useful standalone.
