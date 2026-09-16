import type { ContractQuote, OptionChainSnapshot } from "@ltp/core";

export interface ValidationIssue {
  field: string;
  strike?: number;
  optionType?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  /**
   * The snapshot with any invalid *field values* nulled out (never
   * fabricated or clamped to a "safe" number) so a single bad field from a
   * provider doesn't discard an otherwise-good snapshot. `valid` is false
   * only when the snapshot is unusable as a whole (see rules below).
   */
  sanitized: OptionChainSnapshot;
}

function sanitizeContract(
  contract: ContractQuote,
  issues: ValidationIssue[],
): ContractQuote {
  const out = { ...contract };

  const nonNegativeFields: (keyof ContractQuote)[] = ["ltp", "oi", "prevOi", "volume", "bid", "ask"];
  for (const field of nonNegativeFields) {
    const value = out[field];
    if (typeof value === "number" && value < 0) {
      issues.push({
        field,
        strike: contract.strike,
        optionType: contract.optionType,
        message: `${field} was negative (${value}); nulled rather than trusted`,
      });
      (out[field] as number | null) = null;
    }
  }

  if (out.iv !== null && (out.iv < 0 || out.iv > 1000)) {
    issues.push({
      field: "iv",
      strike: contract.strike,
      optionType: contract.optionType,
      message: `iv out of plausible range (${out.iv})`,
    });
    out.iv = null;
  }

  if (out.bid !== null && out.ask !== null && out.bid > out.ask) {
    issues.push({
      field: "bid/ask",
      strike: contract.strike,
      optionType: contract.optionType,
      message: `bid (${out.bid}) greater than ask (${out.ask})`,
    });
    out.bid = null;
    out.ask = null;
  }

  return out;
}

/**
 * Validates a normalized snapshot before it enters the calculation engine.
 *
 * Rules:
 * - Individual out-of-range field values (negative price/OI/volume, an IV
 *   outside 0-1000%, bid > ask) are nulled and reported — the rest of the
 *   contract is kept.
 * - The snapshot as a whole is invalid (`valid: false`) only if it has no
 *   contracts, or if the underlying price is missing/non-positive — those
 *   make every downstream calculation meaningless, so the caller should
 *   discard the update and keep serving the last-known-good snapshot with a
 *   stale-data flag rather than propagate this one.
 */
export function validateSnapshot(snapshot: OptionChainSnapshot): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Number.isFinite(snapshot.underlyingPrice) || snapshot.underlyingPrice <= 0) {
    issues.push({
      field: "underlyingPrice",
      message: `underlyingPrice invalid (${snapshot.underlyingPrice})`,
    });
  }

  const sanitizedContracts = snapshot.contracts.map((c) => sanitizeContract(c, issues));

  const valid =
    Number.isFinite(snapshot.underlyingPrice) &&
    snapshot.underlyingPrice > 0 &&
    snapshot.contracts.length > 0;

  return {
    valid,
    issues,
    sanitized: { ...snapshot, contracts: sanitizedContracts },
  };
}
