import { prisma } from "@ltp/db";
import type { BillingProvider, CancelResult, CheckoutSessionResult } from "../types";

/**
 * The provider used whenever no real payment processor is configured
 * (no `STRIPE_SECRET_KEY`) — which is the only state this project has
 * ever run in, since no real Stripe account exists in this environment
 * and the project rule is never to fabricate payment credentials.
 *
 * Unlike `@ltp/ai`'s template-provider fallback (which is safe to use in
 * production — it just means simpler AI answers), letting this provider
 * run in production would mean **free upgrades with no payment**, so it
 * refuses to operate outside development. A production deployment without
 * a real `STRIPE_SECRET_KEY` configured should have no working upgrade
 * path at all, not a silently-free one.
 */
export class DevBillingProvider implements BillingProvider {
  readonly name = "dev";

  private assertNotProduction(): void {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DevBillingProvider must never run in production — it grants Premium with no payment. " +
          "Configure STRIPE_SECRET_KEY to enable real billing.",
      );
    }
  }

  async createCheckoutSession(input: {
    userId: string;
    userEmail: string;
  }): Promise<CheckoutSessionResult> {
    this.assertNotProduction();

    await prisma.$transaction([
      prisma.user.update({ where: { id: input.userId }, data: { plan: "PREMIUM" } }),
      prisma.subscription.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, plan: "PREMIUM", status: "ACTIVE", provider: null },
        update: { plan: "PREMIUM", status: "ACTIVE", provider: null },
      }),
      prisma.billingEvent.create({
        data: {
          userId: input.userId,
          type: "manual_upgrade",
          detail: `Dev/demo upgrade — no real payment (no billing provider configured for ${input.userEmail})`,
        },
      }),
    ]);

    return { mode: "immediate" };
  }

  async cancelSubscription(input: { userId: string }): Promise<CancelResult> {
    this.assertNotProduction();

    await prisma.$transaction([
      prisma.user.update({ where: { id: input.userId }, data: { plan: "FREE" } }),
      prisma.subscription.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, plan: "FREE", status: "CANCELED", provider: null },
        update: { plan: "FREE", status: "CANCELED" },
      }),
      prisma.billingEvent.create({
        data: { userId: input.userId, type: "manual_downgrade", detail: "Dev/demo downgrade" },
      }),
    ]);

    return { mode: "immediate" };
  }
}
