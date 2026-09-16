import { computeMaxPain, computePcr } from "@ltp/core";
import { validateSnapshot } from "@ltp/market-data";
import { prisma } from "@ltp/db";
import { ensureProviderConnected, provider } from "./provider";

/**
 * Periodically samples the provider and writes computed snapshots to
 * Postgres, plus a one-time synthetic backfill so charts aren't empty on
 * first load.
 *
 * This is a Phase 6 MVP simplification of the target architecture
 * (docs/phase-1/README.md §3): in the target design, `apps/realtime-gateway`
 * — a persistent process — owns sampling and writes through the event bus.
 * Here, sampling runs as an in-memory `setInterval` inside the `apps/web`
 * Node process. That only works because this app currently runs as a
 * single long-lived Node process (dev server / `next start`); it would
 * silently stop working on a serverless/edge deployment target, where
 * module-level state doesn't persist between invocations. Moving this loop
 * into `apps/realtime-gateway` is required before choosing that kind of
 * production host — tracked as a Phase 13 deployment-architecture decision,
 * not re-litigated here.
 */
const SAMPLE_INTERVAL_MS = 10_000;
const BACKFILL_POINTS = 60;
const BACKFILL_STEP_MS = 60_000; // 1-minute spacing, covering the last hour

const collecting = new Set<string>();

async function captureSnapshot(
  instrument: string,
  expiry: string,
  capturedAt: Date,
): Promise<void> {
  const raw = await provider.getSnapshot(instrument, expiry);
  const { sanitized, valid } = validateSnapshot(raw);
  if (!valid) return;

  await prisma.chainSnapshot.create({
    data: {
      instrument,
      expiry,
      capturedAt,
      underlyingPrice: sanitized.underlyingPrice,
      pcr: computePcr(sanitized.contracts),
      maxPain: computeMaxPain(sanitized.contracts),
    },
  });

  await prisma.contractSnapshot.createMany({
    data: sanitized.contracts.map((c) => ({
      instrument,
      expiry,
      strike: c.strike,
      optionType: c.optionType,
      capturedAt,
      ltp: c.ltp,
      oi: c.oi,
      volume: c.volume,
      iv: c.iv,
    })),
  });
}

async function backfillIfEmpty(instrument: string, expiry: string): Promise<void> {
  const existing = await prisma.chainSnapshot.count({ where: { instrument, expiry } });
  if (existing > 0) return;

  const now = Date.now();
  for (let i = BACKFILL_POINTS; i >= 1; i--) {
    await captureSnapshot(instrument, expiry, new Date(now - i * BACKFILL_STEP_MS));
  }
}

/**
 * Idempotent: safe to call on every request to a historical endpoint. The
 * first call for a given instrument/expiry backfills synthetic history (if
 * none exists yet) and starts a recurring sampler; later calls are no-ops.
 */
export async function ensureCollecting(instrument: string, expiry: string): Promise<void> {
  await ensureProviderConnected();
  const key = `${instrument}:${expiry}`;
  if (collecting.has(key)) return;
  collecting.add(key);

  await backfillIfEmpty(instrument, expiry);

  setInterval(() => {
    captureSnapshot(instrument, expiry, new Date()).catch((error) => {
      console.error(`[historicalCollector] sample failed for ${key}:`, error);
    });
  }, SAMPLE_INTERVAL_MS);
}
