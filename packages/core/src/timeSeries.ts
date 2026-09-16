export interface TimePoint {
  timestamp: number;
  value: number | null;
}

/**
 * Downsamples a time series into at most `bucketCount` evenly-spaced
 * buckets, averaging whatever non-null values fall in each bucket.
 *
 * This is the server-side aggregation FR-22 requires: historical endpoints
 * must never hand the browser a raw, unaggregated point-per-sample series
 * for a long range. If there are already fewer points than `bucketCount`,
 * the series is returned unchanged (sorted) — aggregating would only add
 * noise, not reduce payload size.
 *
 * A bucket with no samples gets `value: null` (never a fabricated
 * interpolation) and is timestamped at its bucket midpoint; a bucket with
 * samples is timestamped at its last sample's timestamp.
 */
export function aggregateTimeSeries(
  points: TimePoint[],
  bucketCount: number,
): TimePoint[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length <= bucketCount) return sorted;

  const minT = sorted[0].timestamp;
  const maxT = sorted[sorted.length - 1].timestamp;
  const span = maxT - minT;

  if (span === 0) {
    const values = sorted.map((p) => p.value).filter((v): v is number => v !== null);
    return [
      {
        timestamp: minT,
        value: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
      },
    ];
  }

  const bucketSize = span / bucketCount;
  const buckets: { sum: number; count: number; lastTimestamp: number | null }[] =
    Array.from({ length: bucketCount }, () => ({ sum: 0, count: 0, lastTimestamp: null }));

  for (const p of sorted) {
    const idx = Math.min(bucketCount - 1, Math.floor((p.timestamp - minT) / bucketSize));
    if (p.value !== null) {
      buckets[idx].sum += p.value;
      buckets[idx].count += 1;
    }
    buckets[idx].lastTimestamp = p.timestamp;
  }

  return buckets.map((b, i) => ({
    timestamp: b.lastTimestamp ?? Math.round(minT + bucketSize * (i + 0.5)),
    value: b.count > 0 ? b.sum / b.count : null,
  }));
}
