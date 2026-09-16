/**
 * The Phase 10 education content system. Content lives as structured data
 * (not a CMS or MDX pipeline) deliberately — at this scale a plain TS
 * array is easier to review, version, and fact-check than adding a
 * content-management dependency. Each entry is real, substantive
 * educational content (not thin/AI-spam per the project's SEO rules),
 * cross-linked into the live tools per the funnel in
 * docs/phase-0/10-... (Google -> Article -> Tool -> Free Analysis ->
 * Account -> Premium).
 */
export interface GlossarySection {
  heading?: string;
  paragraphs: string[];
}

export interface GlossaryEntry {
  slug: string;
  term: string;
  title: string;
  metaDescription: string;
  sections: GlossarySection[];
  relatedTools: { href: string; label: string }[];
  relatedTerms: string[];
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    slug: "what-is-ltp",
    term: "LTP",
    title: "What is LTP (Last Traded Price)? — NSE Options Explained",
    metaDescription:
      "LTP is the price at which an option or stock last actually traded. Learn how it differs from the bid/ask, and why it can look stale between trades.",
    sections: [
      {
        paragraphs: [
          "LTP stands for Last Traded Price — the price at which the most recent actual trade in a contract took place. It's the single most commonly quoted number on any option chain, but it's easy to misread if you don't know what it isn't.",
        ],
      },
      {
        heading: "LTP is not the same as the current bid or ask",
        paragraphs: [
          "At any moment, an option has a bid (the highest price a buyer is currently offering) and an ask (the lowest price a seller is currently accepting). The LTP is neither of these — it's simply where the last trade happened, which could be at the bid, at the ask, or anywhere the two crossed.",
          "For a liquid, frequently-traded contract, LTP stays close to the current bid/ask. For a thinly-traded far-OTM strike, the LTP can lag well behind where the contract would actually trade right now if you tried to buy or sell it.",
        ],
      },
      {
        heading: "Why LTP can look \"stuck\"",
        paragraphs: [
          "If a contract hasn't traded in a while, its LTP won't move even though the underlying and the bid/ask are moving. This is normal, not a data error — it just means nobody has transacted at a new price yet. A tool showing you a clear data-freshness timestamp (not just a number) is the way to tell the difference between \"stale because nobody's trading it\" and \"stale because the feed broke.\"",
        ],
      },
    ],
    relatedTools: [
      { href: "/ltp-calculator", label: "LTP Calculator" },
      { href: "/option-chain", label: "Option Chain" },
    ],
    relatedTerms: ["what-is-open-interest", "how-to-read-option-chain"],
  },
  {
    slug: "what-is-open-interest",
    term: "Open Interest",
    title: "What is Open Interest (OI) in Options? — NSE Options Explained",
    metaDescription:
      "Open Interest counts contracts that are still open, not how many traded today. Learn how OI differs from volume and what change in OI tells you.",
    sections: [
      {
        paragraphs: [
          "Open Interest (OI) is the number of option contracts at a given strike and expiry that are currently open — bought or sold and not yet closed out or expired. It's a position count, not a trade count.",
        ],
      },
      {
        heading: "OI vs. Volume",
        paragraphs: [
          "Volume counts every trade that happened today, including a trader who bought and sold the same contract five times. OI only counts contracts still open at the end of the day. A strike can have huge volume with barely any change in OI (a lot of day-trading in and out) or the reverse (quiet trading, but a big new position was opened and held).",
        ],
      },
      {
        heading: "Why \"Change in OI\" matters more than the raw number",
        paragraphs: [
          "The raw OI level tells you how much interest has accumulated at a strike over time. The change in OI — comparing today's OI to the previous session's — tells you what happened today: are new positions being opened, or are existing ones being closed? That distinction is the basis for reading buildup patterns (see 'OI Buildup Patterns').",
        ],
      },
    ],
    relatedTools: [
      { href: "/option-chain", label: "Option Chain" },
      { href: "/charts", label: "Historical Charts" },
    ],
    relatedTerms: ["oi-buildup-patterns", "what-is-pcr", "what-is-max-pain"],
  },
  {
    slug: "what-is-pcr",
    term: "PCR",
    title: "What is PCR (Put-Call Ratio)? — NSE Options Explained",
    metaDescription:
      "PCR compares total Put OI to total Call OI as a rough sentiment gauge. Learn how to read it, and why a high or low PCR isn't a trading signal by itself.",
    sections: [
      {
        paragraphs: [
          "The Put-Call Ratio (PCR) divides total Put open interest by total Call open interest across an option chain. It's one of the most-watched \"sentiment\" numbers on any option chain, and one of the most commonly overinterpreted.",
        ],
      },
      {
        heading: "How to read it",
        paragraphs: [
          "A PCR meaningfully above 1 means Put OI dominates — more capital is positioned in Puts than Calls. This is often read as a bullish signal, on the logic that Put writers (who profit if the market doesn't fall) are more active. A PCR meaningfully below 1 is the mirror case, often read as bearish.",
          "Different traders use different thresholds for what counts as \"meaningfully\" above or below 1 — there's no universal cutoff. A ratio close to 1 is usually read as neutral, without a strong lean either way.",
        ],
      },
      {
        heading: "What PCR does not tell you",
        paragraphs: [
          "PCR is a snapshot of current positioning, not a forecast. It doesn't tell you why positions were opened (hedging looks the same as speculation in the OI numbers), and OI can shift quickly. Treat a high or low PCR as one input to consider alongside price action and other OI data — not a standalone buy/sell signal.",
        ],
      },
    ],
    relatedTools: [
      { href: "/option-chain", label: "Option Chain" },
      { href: "/charts", label: "PCR History Chart" },
    ],
    relatedTerms: ["what-is-open-interest", "what-is-max-pain"],
  },
  {
    slug: "what-is-max-pain",
    term: "Max Pain",
    title: "What is Max Pain in Options? — NSE Options Explained",
    metaDescription:
      "Max Pain is the strike where option buyers as a group would lose the most at expiry, based on current OI. Learn how it's calculated and its real limits.",
    sections: [
      {
        paragraphs: [
          "Max Pain is the strike price at which, if the underlying expired exactly there, the total payout to all option holders (across every strike) would be smallest — equivalently, where option writers as a group would keep the most premium.",
        ],
      },
      {
        heading: "How it's calculated",
        paragraphs: [
          "For every candidate expiry price, you sum the intrinsic value that every open Call and Put would pay out to its holder if the underlying settled there, weighted by each strike's open interest. The strike where that total is lowest is Max Pain. It's a mechanical calculation over current OI — nothing about it involves predicting the future.",
        ],
      },
      {
        heading: "The \"pull toward Max Pain\" idea — and its limits",
        paragraphs: [
          "Some traders believe price tends to drift toward the Max Pain strike as expiry approaches, on the theory that large option writers have an incentive (and sometimes the size) to influence price toward the level that costs them least. This effect, if it exists at all, is modest, inconsistent, and easily overwhelmed by real news or broad market moves. Max Pain also changes daily as OI shifts, so \"today's Max Pain\" is not a fixed target.",
          "Use Max Pain as one data point about where OI is concentrated, not as a price prediction.",
        ],
      },
    ],
    relatedTools: [
      { href: "/option-chain", label: "Option Chain" },
      { href: "/charts", label: "Max Pain History Chart" },
    ],
    relatedTerms: ["what-is-open-interest", "what-is-pcr"],
  },
  {
    slug: "what-is-implied-volatility",
    term: "Implied Volatility",
    title: "What is Implied Volatility (IV)? — NSE Options Explained",
    metaDescription:
      "Implied Volatility is the market's expectation of future price swings, priced into an option's premium. Learn what high vs. low IV means for option pricing.",
    sections: [
      {
        paragraphs: [
          "Implied Volatility (IV) is the level of future price fluctuation that, when plugged into an option-pricing model, produces the option's current market price. It's expressed as an annualized percentage and is forward-looking by construction — it reflects what the market expects, not what already happened.",
        ],
      },
      {
        heading: "Why IV moves option premiums",
        paragraphs: [
          "Higher expected volatility makes both Calls and Puts more valuable, because a bigger expected swing increases the chance of a large payout in either direction. This is why option premiums often rise before known events (results, policy announcements) even if the underlying price hasn't moved — the market is pricing in a wider expected range, not predicting a direction.",
        ],
      },
      {
        heading: "IV crush",
        paragraphs: [
          "After the event the market was pricing in has passed, IV typically drops sharply even if the outcome was as expected — this is often called \"IV crush.\" An option bought purely for a volatility spike can lose value fast once that spike passes, independent of which way the underlying moved.",
        ],
      },
    ],
    relatedTools: [
      { href: "/option-chain", label: "Option Chain" },
      { href: "/ltp-calculator", label: "LTP Calculator" },
    ],
    relatedTerms: ["option-greeks", "what-is-ltp"],
  },
  {
    slug: "option-greeks",
    term: "Option Greeks",
    title: "Option Greeks Explained: Delta, Gamma, Theta, Vega",
    metaDescription:
      "Delta, Gamma, Theta and Vega measure how an option's price reacts to the underlying, time, and volatility. A plain-language guide to what each one means.",
    sections: [
      {
        paragraphs: [
          "The \"Greeks\" are a set of numbers, each named after a Greek letter, that describe how an option's price is expected to react to a change in one specific factor — the underlying price, time, or volatility — holding everything else constant.",
        ],
      },
      {
        heading: "Delta",
        paragraphs: [
          "Delta estimates how much an option's price moves for a ₹1 move in the underlying. A Call's delta ranges from 0 to 1; a Put's from -1 to 0. An at-the-money option typically has a delta near 0.5 (Call) or -0.5 (Put); deep in-the-money options approach ±1, deep out-of-the-money options approach 0.",
        ],
      },
      {
        heading: "Gamma",
        paragraphs: [
          "Gamma measures how fast Delta itself changes as the underlying moves. It's highest for at-the-money options near expiry — meaning their sensitivity to price moves can change very quickly.",
        ],
      },
      {
        heading: "Theta",
        paragraphs: [
          "Theta estimates how much value an option loses per day purely from the passage of time, all else equal — often called \"time decay.\" Theta is typically negative for option buyers (long options) and accelerates as expiry approaches.",
        ],
      },
      {
        heading: "Vega",
        paragraphs: [
          "Vega measures how much an option's price changes for a 1-percentage-point change in implied volatility. Longer-dated options generally have higher Vega than near-expiry ones.",
        ],
      },
    ],
    relatedTools: [
      { href: "/option-chain", label: "Option Chain (Power mode shows Greeks)" },
    ],
    relatedTerms: ["what-is-implied-volatility", "what-is-ltp"],
  },
  {
    slug: "how-to-read-option-chain",
    term: "Option Chain",
    title: "How to Read an Option Chain — A Beginner's Guide",
    metaDescription:
      "A strike-by-strike walkthrough of what every column in an NSE option chain means, and how CE and PE columns mirror each other around the ATM strike.",
    sections: [
      {
        paragraphs: [
          "An option chain lists every available strike price for an instrument and expiry, with Call (CE) data on one side and Put (PE) data on the other, usually with the strike price down the middle.",
        ],
      },
      {
        heading: "Reading the layout",
        paragraphs: [
          "The strike closest to the current underlying price is the At-The-Money (ATM) strike. Strikes above the ATM are typically Out-of-The-Money (OTM) for Calls and In-The-Money (ITM) for Puts; strikes below are the reverse. This mirroring is why a well-designed option chain lays Calls and Puts out symmetrically around the ATM row.",
        ],
      },
      {
        heading: "The core columns",
        paragraphs: [
          "OI and Change in OI show positioning and how it shifted today. Volume shows how much has traded today. LTP and % change show the current price and its move. IV shows the market's expected future volatility for that specific strike. Together, these let you compare not just where the underlying is, but where the market's attention and money are concentrated across strikes.",
        ],
      },
      {
        heading: "A practical way to start",
        paragraphs: [
          "Rather than trying to absorb the whole chain at once, most beginners get more out of first identifying the ATM strike, then scanning outward a few strikes on each side, watching where OI and Change in OI are largest — those are usually the strikes worth paying attention to first.",
        ],
      },
    ],
    relatedTools: [{ href: "/option-chain", label: "Try the Option Chain (Beginner mode)" }],
    relatedTerms: ["what-is-open-interest", "oi-buildup-patterns"],
  },
  {
    slug: "oi-buildup-patterns",
    term: "OI Buildup Patterns",
    title: "Long Buildup, Short Buildup, Short Covering & Long Unwinding Explained",
    metaDescription:
      "Combining price direction with change in OI produces four classic buildup patterns. A plain-language guide to what each one usually means.",
    sections: [
      {
        paragraphs: [
          "Comparing which way price moved with which way Open Interest moved produces four commonly-referenced patterns. None of them are guarantees — they're a shorthand for what the OI change is consistent with.",
        ],
      },
      {
        heading: "Long buildup — price up, OI up",
        paragraphs: [
          "New long positions are being opened as price rises, consistent with growing bullish conviction being backed by new money rather than short-covering alone.",
        ],
      },
      {
        heading: "Short buildup — price down, OI up",
        paragraphs: [
          "New short positions are being opened as price falls — new bearish conviction, not just existing longs bailing out.",
        ],
      },
      {
        heading: "Short covering — price up, OI down",
        paragraphs: [
          "Price is rising while OI falls, consistent with existing short positions being closed (bought back) rather than fresh buying — a move driven more by unwinding bearish bets than new bullish ones.",
        ],
      },
      {
        heading: "Long unwinding — price down, OI down",
        paragraphs: [
          "Price is falling while OI falls, consistent with existing long positions being closed out rather than fresh selling pressure.",
        ],
      },
      {
        heading: "The important caveat",
        paragraphs: [
          "These labels describe what the price/OI combination is consistent with, not what's certainly happening — OI changes reflect net positioning across every participant, including hedgers whose motives look identical to speculators' in the numbers. Small moves in either price or OI are often just noise; a useful reading tool applies a minimum-move threshold before calling something a \"buildup\" at all, rather than flagging every tick.",
        ],
      },
    ],
    relatedTools: [{ href: "/option-chain", label: "Option Chain (shows a buildup signal per contract)" }],
    relatedTerms: ["what-is-open-interest", "how-to-read-option-chain"],
  },
];

export function getGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return GLOSSARY_ENTRIES.find((e) => e.slug === slug);
}
