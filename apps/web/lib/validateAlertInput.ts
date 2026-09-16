import type { AlertType } from "@ltp/core";

export interface AlertInput {
  instrument: string;
  expiry: string;
  type: AlertType;
  strike: number | null;
  optionType: "CE" | "PE" | null;
  operator: "gte" | "lte" | null;
  thresholdValue: number | null;
}

/**
 * Each AlertType needs a different subset of fields to be meaningful —
 * this mirrors exactly what `evaluateAlert` (@ltp/core) reads for that
 * type, so a request that would silently never trigger is rejected up
 * front instead of creating a dead alert.
 */
export function validateAlertInput(input: AlertInput): string | null {
  if (!input.instrument) return "instrument is required";
  if (!input.expiry) return "expiry is required";

  switch (input.type) {
    case "LTP_THRESHOLD":
    case "IV_THRESHOLD":
      if (input.strike === null || input.optionType === null) return "strike and optionType are required";
      if (input.operator === null) return "operator is required";
      if (input.thresholdValue === null) return "thresholdValue is required";
      return null;

    case "PERCENT_MOVE":
    case "OI_CHANGE":
    case "VOLUME_SPIKE":
      if (input.strike === null || input.optionType === null) return "strike and optionType are required";
      if (input.thresholdValue === null) return "thresholdValue is required";
      return null;

    case "IMPORTANT_STRIKE_MOVE":
      if (input.strike === null) return "strike is required";
      return null;

    case "SR_CROSSING":
      if (input.strike === null) return "strike is required";
      if (input.operator === null) return "operator is required";
      return null;

    case "UNUSUAL_ACTIVITY":
      if (input.strike === null) return "strike is required";
      return null;

    default:
      return "unknown alert type";
  }
}
