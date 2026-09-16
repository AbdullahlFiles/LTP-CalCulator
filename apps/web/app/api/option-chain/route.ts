import { NextRequest, NextResponse } from "next/server";
import { getComputedOptionChain } from "@/lib/marketData";
import { getMockExpiries, INSTRUMENTS } from "@/lib/instruments";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const instrument = searchParams.get("instrument") ?? "NIFTY";
  const expiry = searchParams.get("expiry") ?? getMockExpiries()[0];

  const isKnownInstrument = INSTRUMENTS.some((i) => i.symbol === instrument);
  if (!isKnownInstrument) {
    return NextResponse.json(
      { error: `Unknown instrument "${instrument}"` },
      { status: 400 },
    );
  }

  try {
    const chain = await getComputedOptionChain(instrument, expiry);
    return NextResponse.json(chain, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load option chain data",
      },
      { status: 502 },
    );
  }
}
