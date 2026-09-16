import { describe, expect, it } from "vitest";
import { validateAlertInput, type AlertInput } from "./validateAlertInput";

function makeInput(overrides: Partial<AlertInput> = {}): AlertInput {
  return {
    instrument: "NIFTY",
    expiry: "2026-09-25",
    type: "LTP_THRESHOLD",
    strike: 25000,
    optionType: "CE",
    operator: "gte",
    thresholdValue: 100,
    ...overrides,
  };
}

describe("validateAlertInput", () => {
  it("requires instrument and expiry regardless of type", () => {
    expect(validateAlertInput(makeInput({ instrument: "" }))).toMatch(/instrument/);
    expect(validateAlertInput(makeInput({ expiry: "" }))).toMatch(/expiry/);
  });

  it("accepts a fully-specified LTP_THRESHOLD alert", () => {
    expect(validateAlertInput(makeInput())).toBeNull();
  });

  it("rejects LTP_THRESHOLD missing operator or threshold", () => {
    expect(validateAlertInput(makeInput({ operator: null }))).toMatch(/operator/);
    expect(validateAlertInput(makeInput({ thresholdValue: null }))).toMatch(/thresholdValue/);
  });

  it("does not require an operator for PERCENT_MOVE/OI_CHANGE/VOLUME_SPIKE", () => {
    for (const type of ["PERCENT_MOVE", "OI_CHANGE", "VOLUME_SPIKE"] as const) {
      expect(validateAlertInput(makeInput({ type, operator: null }))).toBeNull();
    }
  });

  it("requires strike+optionType for PERCENT_MOVE but not IMPORTANT_STRIKE_MOVE's optionType", () => {
    expect(
      validateAlertInput(makeInput({ type: "PERCENT_MOVE", optionType: null })),
    ).toMatch(/strike and optionType/);
    expect(
      validateAlertInput(
        makeInput({ type: "IMPORTANT_STRIKE_MOVE", optionType: null, operator: null, thresholdValue: null }),
      ),
    ).toBeNull();
  });

  it("requires an operator (but not optionType/threshold) for SR_CROSSING", () => {
    const base = makeInput({
      type: "SR_CROSSING",
      optionType: null,
      thresholdValue: null,
    });
    expect(validateAlertInput({ ...base, operator: null })).toMatch(/operator/);
    expect(validateAlertInput(base)).toBeNull();
  });

  it("requires only a strike for UNUSUAL_ACTIVITY", () => {
    const input = makeInput({
      type: "UNUSUAL_ACTIVITY",
      optionType: null,
      operator: null,
      thresholdValue: null,
    });
    expect(validateAlertInput(input)).toBeNull();
    expect(validateAlertInput({ ...input, strike: null })).toMatch(/strike/);
  });
});
