import { describe, expect, it } from "vitest";
import { evaluateAlert, type AlertEvaluationContext, type AlertRule } from "./alerts";

function makeContext(overrides: Partial<AlertEvaluationContext> = {}): AlertEvaluationContext {
  return {
    underlyingPrice: 25000,
    importantStrikes: [{ strike: 25100 }],
    unusualActivity: [{ strike: 25200, optionType: "CE" }],
    contracts: [
      {
        strike: 25000,
        optionType: "CE",
        ltp: 150,
        ltpChangePercent: 8,
        oi: 40000,
        oiChangePercent: 12,
        volume: 20000,
        iv: 18,
      },
    ],
    ...overrides,
  };
}

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    type: "LTP_THRESHOLD",
    strike: 25000,
    optionType: "CE",
    operator: "gte",
    thresholdValue: 100,
    ...overrides,
  };
}

describe("evaluateAlert — LTP_THRESHOLD", () => {
  it("triggers when LTP crosses above the threshold", () => {
    const result = evaluateAlert(makeRule({ operator: "gte", thresholdValue: 100 }), makeContext());
    expect(result.triggered).toBe(true);
    expect(result.message).toMatch(/crossed above/);
  });

  it("does not trigger when the threshold isn't met", () => {
    const result = evaluateAlert(makeRule({ operator: "gte", thresholdValue: 200 }), makeContext());
    expect(result.triggered).toBe(false);
    expect(result.message).toBeNull();
  });

  it("does not trigger when the contract doesn't exist in the context", () => {
    const result = evaluateAlert(makeRule({ strike: 99999 }), makeContext());
    expect(result.triggered).toBe(false);
  });
});

describe("evaluateAlert — PERCENT_MOVE", () => {
  it("triggers on an absolute percent move at or beyond the threshold", () => {
    const result = evaluateAlert(
      makeRule({ type: "PERCENT_MOVE", operator: null, thresholdValue: 5 }),
      makeContext(),
    );
    expect(result.triggered).toBe(true);
  });

  it("triggers on a large negative move too (uses absolute value)", () => {
    const context = makeContext({
      contracts: [
        {
          strike: 25000,
          optionType: "CE",
          ltp: 100,
          ltpChangePercent: -8,
          oi: 1000,
          oiChangePercent: 0,
          volume: 100,
          iv: 15,
        },
      ],
    });
    const result = evaluateAlert(makeRule({ type: "PERCENT_MOVE", operator: null, thresholdValue: 5 }), context);
    expect(result.triggered).toBe(true);
  });
});

describe("evaluateAlert — OI_CHANGE", () => {
  it("triggers when OI % change meets the threshold", () => {
    const result = evaluateAlert(makeRule({ type: "OI_CHANGE", operator: null, thresholdValue: 10 }), makeContext());
    expect(result.triggered).toBe(true);
  });
});

describe("evaluateAlert — VOLUME_SPIKE", () => {
  it("triggers when volume reaches the absolute threshold", () => {
    const result = evaluateAlert(
      makeRule({ type: "VOLUME_SPIKE", operator: null, thresholdValue: 15000 }),
      makeContext(),
    );
    expect(result.triggered).toBe(true);
  });

  it("does not trigger below the threshold", () => {
    const result = evaluateAlert(
      makeRule({ type: "VOLUME_SPIKE", operator: null, thresholdValue: 50000 }),
      makeContext(),
    );
    expect(result.triggered).toBe(false);
  });
});

describe("evaluateAlert — IV_THRESHOLD", () => {
  it("triggers when IV crosses the threshold", () => {
    const result = evaluateAlert(
      makeRule({ type: "IV_THRESHOLD", operator: "gte", thresholdValue: 15 }),
      makeContext(),
    );
    expect(result.triggered).toBe(true);
  });
});

describe("evaluateAlert — IMPORTANT_STRIKE_MOVE", () => {
  it("triggers when the strike is currently flagged important", () => {
    const result = evaluateAlert(
      makeRule({ type: "IMPORTANT_STRIKE_MOVE", strike: 25100, optionType: null, operator: null, thresholdValue: null }),
      makeContext(),
    );
    expect(result.triggered).toBe(true);
  });

  it("does not trigger for a strike that isn't flagged", () => {
    const result = evaluateAlert(
      makeRule({ type: "IMPORTANT_STRIKE_MOVE", strike: 24000, optionType: null, operator: null, thresholdValue: null }),
      makeContext(),
    );
    expect(result.triggered).toBe(false);
  });
});

describe("evaluateAlert — SR_CROSSING", () => {
  it("triggers when the underlying crosses above the level", () => {
    const result = evaluateAlert(
      makeRule({ type: "SR_CROSSING", strike: 24900, optionType: null, operator: "gte", thresholdValue: null }),
      makeContext({ underlyingPrice: 25000 }),
    );
    expect(result.triggered).toBe(true);
  });

  it("does not trigger when the underlying hasn't crossed", () => {
    const result = evaluateAlert(
      makeRule({ type: "SR_CROSSING", strike: 25500, optionType: null, operator: "gte", thresholdValue: null }),
      makeContext({ underlyingPrice: 25000 }),
    );
    expect(result.triggered).toBe(false);
  });
});

describe("evaluateAlert — UNUSUAL_ACTIVITY", () => {
  it("triggers when the strike+optionType is currently flagged unusual", () => {
    const result = evaluateAlert(
      makeRule({ type: "UNUSUAL_ACTIVITY", strike: 25200, optionType: "CE", operator: null, thresholdValue: null }),
      makeContext(),
    );
    expect(result.triggered).toBe(true);
  });

  it("does not trigger for a different strike", () => {
    const result = evaluateAlert(
      makeRule({ type: "UNUSUAL_ACTIVITY", strike: 25300, optionType: "CE", operator: null, thresholdValue: null }),
      makeContext(),
    );
    expect(result.triggered).toBe(false);
  });
});
