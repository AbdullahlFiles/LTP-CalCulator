import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ltp/db";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";

const patchSchema = z.object({ active: z.boolean() });

async function loadOwnedAlert(alertId: string, userId: string) {
  const alert = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!alert || alert.userId !== userId) return null;
  return alert;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
  try {
    const user = await requireUser();
    const { alertId } = await params;

    const alert = await loadOwnedAlert(alertId, user.id);
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Body must be { active: boolean }" }, { status: 400 });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { active: parsed.data.active },
    });
    return NextResponse.json({ alert: updated });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ alertId: string }> }) {
  try {
    const user = await requireUser();
    const { alertId } = await params;

    const alert = await loadOwnedAlert(alertId, user.id);
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.alert.delete({ where: { id: alertId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}
