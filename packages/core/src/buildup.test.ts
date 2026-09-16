import { describe, expect, it } from "vitest";
import { detectBuildup, isUnusual } from "./buildup";
import { makeQuote } from "./testFixtures";

describe("detectBuildup", () => {
  it("detects long buildup: price up, OI up", () => {
    const quote = makeQuote({ ltp: 110, prevClose: 100, oi: 1100, prevOi: 1000 });
    expect(detectBuildup(quote)).toBe("long-buildup");
  });

  it("detects short buildup: price down, OI up", () => {
    const quote = makeQuote({ ltp: 90, prevClose: 100, oi: 1100, prevOi: 1000 });
    expect(detectBuildup(quote)).toBe("short-buildup");
  });

  it("detects short covering: price up, OI down", () => {
    const quote = makeQuote({ ltp: 110, prevClose: 100, oi: 900, prevOi: 1000 });
    expect(detectBuildup(quote)).toBe("short-covering");
  });

  it("detects long unwinding: price down, OI down", () => {
    const quote = makeQuote({ ltp: 90, prevClose: 100, oi: 900, prevOi: 1000 });
    expect(detectBuildup(quote)).toBe("long-unwinding");
  });

  it("returns neutral when moves are below the noise threshold", () => {
    const quote = makeQuote({ ltp: 100.01, prevClose: 100, oi: 1000.5, prevOi: 1000 });
    expect(detectBuildup(quote)).toBe("neutral");
  });

  it("returns neutral (never a guess) when data is missing", () => {
    expect(detectBuildup(makeQuote({ ltp: null }))).toBe("neutral");
    expect(detectBuildup(makeQuote({ oi: null }))).toBe("neutral");
  });
});

describe("isUnusual", () => {
  it("flags a value more than the multiplier times the baseline", () => {
    expect(isUnusual(300, 100, 2)).toBe(true);
    expect(isUnusual(150, 100, 2)).toBe(false);
  });

  it("never flags when value or baseline is missing", () => {
    expect(isUnusual(null, 100)).toBe(false);
    expect(isUnusual(300, null)).toBe(false);
    expect(isUnusual(300, 0)).toBe(false);
  });
});
