import { describe, expect, it } from "vitest";
import { aggregateTimeSeries } from "./timeSeries";

describe("aggregateTimeSeries", () => {
  it("returns an empty array unchanged", () => {
    expect(aggregateTimeSeries([], 10)).toEqual([]);
  });

  it("returns the series unchanged when there are fewer points than buckets", () => {
    const points = [
      { timestamp: 1, value: 10 },
      { timestamp: 2, value: 20 },
    ];
    expect(aggregateTimeSeries(points, 10)).toEqual(points);
  });

  it("averages values within each bucket", () => {
    const points = [
      { timestamp: 0, value: 10 },
      { timestamp: 1, value: 20 },
      { timestamp: 10, value: 100 },
      { timestamp: 11, value: 200 },
    ];
    const result = aggregateTimeSeries(points, 2);
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(15); // (10+20)/2
    expect(result[1].value).toBe(150); // (100+200)/2
  });

  it("leaves a bucket's value null (not zero) when it has no samples", () => {
    // 5 points > 4 buckets, so real bucketing kicks in (not the
    // fewer-points-than-buckets passthrough). Points cluster in the first
    // and last quarter of the range, leaving the two middle buckets empty.
    const points = [
      { timestamp: 0, value: 10 },
      { timestamp: 1, value: 12 },
      { timestamp: 2, value: 14 },
      { timestamp: 90, value: 20 },
      { timestamp: 95, value: 22 },
    ];
    const result = aggregateTimeSeries(points, 4);
    expect(result.some((p) => p.value === null)).toBe(true);
    expect(result.some((p) => p.value === 0)).toBe(false);
  });

  it("excludes null-valued samples from the average without treating them as zero", () => {
    const points = [
      { timestamp: 0, value: 10 },
      { timestamp: 1, value: null },
      { timestamp: 2, value: 30 },
    ];
    const result = aggregateTimeSeries(points, 1);
    expect(result[0].value).toBe(20); // (10+30)/2, the null is excluded
  });

  it("collapses same-timestamp points into one averaged point", () => {
    const points = [
      { timestamp: 5, value: 10 },
      { timestamp: 5, value: 30 },
      { timestamp: 5, value: 20 },
    ];
    const result = aggregateTimeSeries(points, 2);
    expect(result).toEqual([{ timestamp: 5, value: 20 }]);
  });
});
