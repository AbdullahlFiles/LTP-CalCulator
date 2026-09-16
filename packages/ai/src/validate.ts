import type { StructuredExplanation } from "./types";

/**
 * Language no AI (or template) output may use, per the project's global
 * rule: never claim guaranteed profits, guaranteed direction, certain
 * predictions, or risk-free trades. This is checked mechanically — a
 * provider passing a vibe check in a prompt is not enough; every response
 * is scanned before it reaches a user.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bguaranteed?\b/i,
  /\brisk[- ]?free\b/i,
  /\bsure[- ]shot\b/i,
  /\bcan'?t lose\b/i,
  /\bwill definitely\b/i,
  /\balways (wins?|profits?|goes?)\b/i,
  /\b100%\s*(sure|certain|guaranteed)\b/i,
  /\bcertain to (rise|fall|go|hit|reach)\b/i,
  /\bno risk\b/i,
  /\bwithout (any )?risk\b/i,
];

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

export function findForbiddenLanguage(text: string): string[] {
  const violations: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = text.match(pattern);
    if (match) violations.push(match[0]);
  }
  return violations;
}

/**
 * Validates a structured explanation before it's shown to a user:
 * - Every section (data/calculation/interpretation/uncertainty) must be
 *   non-empty — an explanation missing its uncertainty section, for
 *   instance, fails just as hard as one with forbidden language, because
 *   the whole point of the structure is that uncertainty is never omitted.
 * - No forbidden guaranteed-outcome language anywhere in any section.
 */
export function validateStructuredExplanation(
  explanation: StructuredExplanation,
): ValidationResult {
  const violations: string[] = [];

  const sections: [string, string[]][] = [
    ["data", explanation.data],
    ["calculation", explanation.calculation],
    ["interpretation", explanation.interpretation],
    ["uncertainty", explanation.uncertainty],
  ];

  for (const [name, lines] of sections) {
    if (lines.length === 0) {
      violations.push(`section "${name}" is empty`);
    }
    for (const line of lines) {
      violations.push(...findForbiddenLanguage(line).map((v) => `forbidden language in ${name}: "${v}"`));
    }
  }

  return { valid: violations.length === 0, violations };
}

/** Same forbidden-language check, for freeform chat responses. */
export function validateChatResponse(text: string): ValidationResult {
  const violations = findForbiddenLanguage(text).map((v) => `forbidden language: "${v}"`);
  return { valid: violations.length === 0, violations };
}
