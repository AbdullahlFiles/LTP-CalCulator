import { NextRequest, NextResponse } from "next/server";
import { aggregateTimeSeries } from "@ltp/core";
import { prisma } from "@ltp/db";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import { ensureCollecting } from "@/lib/historicalCollector";

const METRICS = ["underlyingPrice", "pcr", "maxPain"] as const;
type Metric = (typeof METRICS)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instrument = searchParams.get("instrument") ?? "NIFTY";
  const expiry = searchParams.get("expiry") ?? getMockExpiries()[0];
  const metric = (searchParams.get("metric") ?? "underlyingPrice") as Metric;
  const bucketCount = Number(searchParams.get("bucketCount") ?? 60);

  if (!INSTRUMENTS.some((i) => i.symbol === instrument)) {
    return NextResponse.json({ error: `Unknown instrument "${instrument}"` }, { status: 400 });
  }
  if (!METRICS.includes(metric)) {
    return NextResponse.json({ error: `Unknown metric "${metric}"` }, { status: 400 });
  }

  await ensureCollecting(instrument, expiry);

  const rows = await prisma.chainSnapshot.findMany({
    where: { instrument, expiry },
    orderBy: { capturedAt: "asc" },
    select: { capturedAt: true, underlyingPrice: true, pcr: true, maxPain: true },
  });

  const points = rows.map((row) => ({
    timestamp: row.capturedAt.getTime(),
    value: row[metric],
  }));

  return NextResponse.json(
    {
      instrument,
      expiry,
      metric,
      points: aggregateTimeSeries(points, bucketCount),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
