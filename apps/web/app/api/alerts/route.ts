import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@ltp/db";
import { checkCapacity } from "@ltp/entitlements";
import { AuthRequiredError, requireUser } from "@/lib/requireUser";
import { validateAlertInput } from "@/lib/validateAlertInput";
import { ensureAlertEvaluationRunning } from "@/lib/alertEvaluator";

const ALERT_TYPES = [
  "LTP_THRESHOLD",
  "PERCENT_MOVE",
  "OI_CHANGE",
  "VOLUME_SPIKE",
  "IV_THRESHOLD",
  "IMPORTANT_STRIKE_MOVE",
  "SR_CROSSING",
  "UNUSUAL_ACTIVITY",
] as const;

const createAlertSchema = z.object({
  instrument: z.string().min(1),
  expiry: z.string().min(1),
  type: z.enum(ALERT_TYPES),
  strike: z.number().int().nullable().optional(),
  optionType: z.enum(["CE", "PE"]).nullable().optional(),
  operator: z.enum(["gte", "lte"]).nullable().optional(),
  thresholdValue: z.number().nullable().optional(),
});

export async function GET() {
  ensureAlertEvaluationRunning();
  try {
    const user = await requireUser();
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { triggers: { orderBy: { triggeredAt: "desc" }, take: 5 } },
    });
    return NextResponse.json({ alerts });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  ensureAlertEvaluationRunning();
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const input = {
      instrument: parsed.data.instrument,
      expiry: parsed.data.expiry,
      type: parsed.data.type,
      strike: parsed.data.strike ?? null,
      optionType: parsed.data.optionType ?? null,
      operator: parsed.data.operator ?? null,
      thresholdValue: parsed.data.thresholdValue ?? null,
    };

    const validationError = validateAlertInput(input);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const currentCount = await prisma.alert.count({ where: { userId: user.id, active: true } });
    const capacity = checkCapacity(user.plan, "maxActiveAlerts", currentCount);
    if (!capacity.allowed) {
      return NextResponse.json({ error: capacity.reason }, { status: 403 });
    }

    const alert = await prisma.alert.create({ data: { ...input, userId: user.id } });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    throw error;
  }
}
