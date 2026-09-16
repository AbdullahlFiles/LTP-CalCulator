import { NextResponse } from "next/server";
import { prisma } from "@ltp/db";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";

export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = await requireUser();
    const { itemId } = await params;

    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId },
      include: { watchlist: true },
    });

    if (!item || item.watchlist.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.watchlistItem.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}
