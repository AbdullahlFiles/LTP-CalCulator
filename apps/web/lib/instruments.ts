/**
 * Supported instruments for the MVP. Real expiries and instrument coverage
 * depend entirely on the licensed data provider chosen in Phase 2 (see
 * docs/phase-0/11-risks-and-assumptions.md, R1) — this list is a
 * placeholder sized to the mock data generator, not a commitment.
 */
export interface InstrumentOption {
  symbol: string;
  label: string;
  /** URL-friendly slug for SEO-indexable per-instrument pages (Phase 9). */
  slug: string;
}

export const INSTRUMENTS: InstrumentOption[] = [
  { symbol: "NIFTY", label: "NIFTY 50", slug: "nifty" },
  { symbol: "BANKNIFTY", label: "BANK NIFTY", slug: "bank-nifty" },
  { symbol: "FINNIFTY", label: "FINNIFTY", slug: "finnifty" },
];

export function getInstrumentBySlug(slug: string): InstrumentOption | undefined {
  return INSTRUMENTS.find((i) => i.slug === slug);
}

/** Placeholder weekly/monthly expiry stand-ins until real expiry data exists. */
export function getMockExpiries(): string[] {
  const today = new Date();
  const expiries: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i * 7);
    expiries.push(d.toISOString().slice(0, 10));
  }
  return expiries;
}
