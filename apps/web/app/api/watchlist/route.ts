import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ltp/db";
import { checkCapacity } from "@ltp/entitlements";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";
import { getOrCreateDefaultWatchlist } from "@/lib/getOrCreateDefaultWatchlist";

const addItemSchema = z.object({
  instrument: z.string().min(1),
  expiry: z.string().nullable().optional(),
  strike: z.number().int().nullable().optional(),
  optionType: z.enum(["CE", "PE"]).nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const watchlist = await getOrCreateDefaultWatchlist(user.id);
    const items = await prisma.watchlistItem.findMany({
      where: { watchlistId: watchlist.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ watchlist: { ...watchlist, items } });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const watchlist = await getOrCreateDefaultWatchlist(user.id);
    const newItem = {
      watchlistId: watchlist.id,
      instrument: parsed.data.instrument,
      expiry: parsed.data.expiry ?? null,
      strike: parsed.data.strike ?? null,
      optionType: parsed.data.optionType ?? null,
    };

    // The DB's @@unique constraint alone doesn't catch this case: Postgres
    // (standard SQL) treats NULL as never equal to NULL, so two "watch the
    // whole instrument" rows (expiry/strike/optionType all null) pass the
    // unique index without colliding. An explicit lookup is required for
    // correctness regardless of which fields are null.
    const existing = await prisma.watchlistItem.findFirst({ where: newItem });
    if (existing) {
      return NextResponse.json({ error: "That's already on your watchlist" }, { status: 409 });
    }

    const currentCount = await prisma.watchlistItem.count({ where: { watchlistId: watchlist.id } });
    const capacity = checkCapacity(user.plan, "maxWatchlistItems", currentCount);
    if (!capacity.allowed) {
      return NextResponse.json({ error: capacity.reason }, { status: 403 });
    }

    const item = await prisma.watchlistItem.create({ data: newItem });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Prisma's unique-constraint violation for a duplicate watchlist entry.
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "That's already on your watchlist" }, { status: 409 });
    }
    throw error;
  }
}
