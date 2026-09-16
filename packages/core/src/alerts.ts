import type { OptionType } from "./types";

/**
 * A deliberately minimal, framework-agnostic view of the current market
 * state — just enough for alert evaluation, independent of any specific
 * caller's richer chain type (`apps/web`'s `ComputedOptionChain`, or
 * anything else). Same pattern as `@ltp/ai`'s `MarketContext`: this
 * package never imports a caller's types, callers map into this shape.
 */
export interface AlertEvaluationContract {
  strike: number;
  optionType: OptionType;
  ltp: number | null;
  ltpChangePercent: number | null;
  oi: number | null;
  oiChangePercent: number | null;
  volume: number | null;
  iv: number | null;
}

export interface AlertEvaluationContext {
  underlyingPrice: number;
  importantStrikes: { strike: number }[];
  unusualActivity: { strike: number; optionType?: OptionType }[];
  contracts: AlertEvaluationContract[];
}

export type AlertType =
  | "LTP_THRESHOLD"
  | "PERCENT_MOVE"
  | "OI_CHANGE"
  | "VOLUME_SPIKE"
  | "IV_THRESHOLD"
  | "IMPORTANT_STRIKE_MOVE"
  | "SR_CROSSING"
  | "UNUSUAL_ACTIVITY";

export type AlertOperator = "gte" | "lte";

export interface AlertRule {
  type: AlertType;
  strike: number | null;
  optionType: OptionType | null;
  operator: AlertOperator | null;
  thresholdValue: number | null;
}

export interface AlertEvaluation {
  triggered: boolean;
  /** Human-readable reason, present whenever `triggered` is true. */
  message: string | null;
}

const NOT_TRIGGERED: AlertEvaluation = { triggered: false, message: null };

function compare(value: number, operator: AlertOperator, threshold: number): boolean {
  return operator === "gte" ? value >= threshold : value <= threshold;
}

function findContract(
  context: AlertEvaluationContext,
  strike: number | null,
  optionType: OptionType | null,
): AlertEvaluationContract | undefined {
  if (strike === null || optionType === null) return undefined;
  return context.contracts.find((c) => c.strike === strike && c.optionType === optionType);
}

/**
 * Evaluates one alert rule against the current market state. Pure and
 * side-effect free — the caller decides what to do with a `triggered`
 * result (write an AlertTrigger row, notify, etc). Never fabricates a
 * trigger from missing data: a rule whose required field is null/missing
 * simply doesn't trigger.
 */
export function evaluateAlert(rule: AlertRule, context: AlertEvaluationContext): AlertEvaluation {
  switch (rule.type) {
    case "LTP_THRESHOLD": {
      const contract = findContract(context, rule.strike, rule.optionType);
      if (!contract || contract.ltp === null || rule.operator === null || rule.thresholdValue === null) {
        return NOT_TRIGGERED;
      }
      if (compare(contract.ltp, rule.operator, rule.thresholdValue)) {
        return {
          triggered: true,
          message: `${rule.strike}${rule.optionType} LTP (${contract.ltp}) crossed ${rule.operator === "gte" ? "above" : "below"} ${rule.thresholdValue}.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "PERCENT_MOVE": {
      const contract = findContract(context, rule.strike, rule.optionType);
      if (!contract || contract.ltpChangePercent === null || rule.thresholdValue === null) {
        return NOT_TRIGGERED;
      }
      if (Math.abs(contract.ltpChangePercent) >= rule.thresholdValue) {
        return {
          triggered: true,
          message: `${rule.strike}${rule.optionType} moved ${contract.ltpChangePercent.toFixed(1)}%, at or beyond the ${rule.thresholdValue}% threshold.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "OI_CHANGE": {
      const contract = findContract(context, rule.strike, rule.optionType);
      if (!contract || contract.oiChangePercent === null || rule.thresholdValue === null) {
        return NOT_TRIGGERED;
      }
      if (Math.abs(contract.oiChangePercent) >= rule.thresholdValue) {
        return {
          triggered: true,
          message: `${rule.strike}${rule.optionType} OI changed ${contract.oiChangePercent.toFixed(1)}%, at or beyond the ${rule.thresholdValue}% threshold.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "VOLUME_SPIKE": {
      const contract = findContract(context, rule.strike, rule.optionType);
      if (!contract || contract.volume === null || rule.thresholdValue === null) {
        return NOT_TRIGGERED;
      }
      if (contract.volume >= rule.thresholdValue) {
        return {
          triggered: true,
          message: `${rule.strike}${rule.optionType} volume (${contract.volume}) reached the ${rule.thresholdValue} threshold.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "IV_THRESHOLD": {
      const contract = findContract(context, rule.strike, rule.optionType);
      if (!contract || contract.iv === null || rule.operator === null || rule.thresholdValue === null) {
        return NOT_TRIGGERED;
      }
      if (compare(contract.iv, rule.operator, rule.thresholdValue)) {
        return {
          triggered: true,
          message: `${rule.strike}${rule.optionType} IV (${contract.iv}%) crossed ${rule.operator === "gte" ? "above" : "below"} ${rule.thresholdValue}%.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "IMPORTANT_STRIKE_MOVE": {
      if (rule.strike === null) return NOT_TRIGGERED;
      const isImportant = context.importantStrikes.some((s) => s.strike === rule.strike);
      return isImportant
        ? { triggered: true, message: `Strike ${rule.strike} is now flagged as an important strike.` }
        : NOT_TRIGGERED;
    }

    case "SR_CROSSING": {
      if (rule.strike === null || rule.operator === null) return NOT_TRIGGERED;
      if (compare(context.underlyingPrice, rule.operator, rule.strike)) {
        return {
          triggered: true,
          message: `Underlying (${context.underlyingPrice}) crossed ${rule.operator === "gte" ? "above" : "below"} the ${rule.strike} level.`,
        };
      }
      return NOT_TRIGGERED;
    }

    case "UNUSUAL_ACTIVITY": {
      if (rule.strike === null) return NOT_TRIGGERED;
      const flagged = context.unusualActivity.some(
        (u) => u.strike === rule.strike && (rule.optionType === null || u.optionType === rule.optionType),
      );
      return flagged
        ? { triggered: true, message: `Unusual activity detected at strike ${rule.strike}.` }
        : NOT_TRIGGERED;
    }
  }
}
