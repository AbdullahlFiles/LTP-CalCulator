import { evaluateAlert, type AlertRule } from "@ltp/core";
import { prisma } from "@ltp/db";
import { getComputedOptionChain } from "./marketData";
import { toAlertContext } from "./alertContext";

/**
 * The "notification infrastructure" from the Phase 8 spec, in its MVP
 * form: a periodic loop that evaluates every active alert against live
 * computed data and records an `AlertTrigger` row when a condition is
 * met. Real delivery (email/push/SMS) needs a real provider and
 * credentials this environment doesn't have — per the project rule
 * against fabricating those, delivery is out of scope here; this is the
 * detection half of the pipeline, fully working end to end, with the
 * trigger history visible in the dashboard. See docs/phase-8/README.md.
 *
 * Same process-local caveat as `historicalCollector.ts` and `aiCache.ts`:
 * valid for the current long-lived Node process, a Phase 13 deployment
 * decision (move to a real scheduled job / worker) on a stateless target.
 */
const EVAL_INTERVAL_MS = 15_000;
const TRIGGER_COOLDOWN_MS = 5 * 60 * 1000;

let started = false;

async function evaluationTick(): Promise<void> {
  const activeAlerts = await prisma.alert.findMany({ where: { active: true } });
  if (activeAlerts.length === 0) return;

  const groups = new Map<string, typeof activeAlerts>();
  for (const alert of activeAlerts) {
    const key = `${alert.instrument}:${alert.expiry}`;
    const list = groups.get(key) ?? [];
    list.push(alert);
    groups.set(key, list);
  }

  for (const [key, alerts] of groups) {
    const [instrument, expiry] = key.split(":");
    try {
      const chain = await getComputedOptionChain(instrument, expiry);
      const context = toAlertContext(chain);

      for (const alert of alerts) {
        const rule: AlertRule = {
          type: alert.type as AlertRule["type"],
          strike: alert.strike,
          optionType: alert.optionType as AlertRule["optionType"],
          operator: alert.operator as AlertRule["operator"],
          thresholdValue: alert.thresholdValue,
        };

        const result = evaluateAlert(rule, context);
        if (!result.triggered || !result.message) continue;

        const withinCooldown =
          alert.lastTriggeredAt !== null &&
          Date.now() - alert.lastTriggeredAt.getTime() < TRIGGER_COOLDOWN_MS;
        if (withinCooldown) continue;

        await prisma.alertTrigger.create({ data: { alertId: alert.id, message: result.message } });
        await prisma.alert.update({ where: { id: alert.id }, data: { lastTriggeredAt: new Date() } });
      }
    } catch (error) {
      console.error(`[alertEvaluator] evaluation failed for ${key}:`, error);
    }
  }
}

/** Idempotent — safe to call from any request path; starts the loop once per process. */
export function ensureAlertEvaluationRunning(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    evaluationTick().catch((error) => console.error("[alertEvaluator] tick failed:", error));
  }, EVAL_INTERVAL_MS);
}
