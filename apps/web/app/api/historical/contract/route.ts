import { NextRequest, NextResponse } from "next/server";
import { aggregateTimeSeries } from "@ltp/core";
import { prisma } from "@ltp/db";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";
import { ensureCollecting } from "@/lib/historicalCollector";

const METRICS = ["ltp", "oi", "volume", "iv"] as const;
type Metric = (typeof METRICS)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instrument = searchParams.get("instrument") ?? "NIFTY";
  const expiry = searchParams.get("expiry") ?? getMockExpiries()[0];
  const strikeParam = searchParams.get("strike");
  const optionType = searchParams.get("optionType") ?? "CE";
  const metric = (searchParams.get("metric") ?? "ltp") as Metric;
  const bucketCount = Number(searchParams.get("bucketCount") ?? 60);

  if (!INSTRUMENTS.some((i) => i.symbol === instrument)) {
    return NextResponse.json({ error: `Unknown instrument "${instrument}"` }, { status: 400 });
  }
  if (strikeParam === null || Number.isNaN(Number(strikeParam))) {
    return NextResponse.json({ error: "A numeric strike is required" }, { status: 400 });
  }
  if (optionType !== "CE" && optionType !== "PE") {
    return NextResponse.json({ error: `Unknown optionType "${optionType}"` }, { status: 400 });
  }
  if (!METRICS.includes(metric)) {
    return NextResponse.json({ error: `Unknown metric "${metric}"` }, { status: 400 });
  }

  await ensureCollecting(instrument, expiry);

  const strike = Number(strikeParam);
  const rows = await prisma.contractSnapshot.findMany({
    where: { instrument, expiry, strike, optionType },
    orderBy: { capturedAt: "asc" },
    select: { capturedAt: true, ltp: true, oi: true, volume: true, iv: true },
  });

  const points = rows.map((row) => ({
    timestamp: row.capturedAt.getTime(),
    value: row[metric],
  }));

  return NextResponse.json(
    {
      instrument,
      expiry,
      strike,
      optionType,
      metric,
      points: aggregateTimeSeries(points, bucketCount),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
