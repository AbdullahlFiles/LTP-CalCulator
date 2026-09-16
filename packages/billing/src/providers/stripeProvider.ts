import Stripe from "stripe";
import { prisma } from "@ltp/db";
import type { BillingProvider, CancelResult, CheckoutSessionResult } from "../types";

/**
 * Real Stripe-backed provider. Never constructed with a fabricated key —
 * `getBillingProvider()` in `index.ts` only instantiates this when
 * `process.env.STRIPE_SECRET_KEY` is genuinely set. Written as real,
 * working integration code (not a stub), but unexercised in this
 * environment: no Stripe account/product/price exists here to test
 * against, and the project rule is never to fabricate those. See
 * docs/phase-11/README.md.
 */
export class StripeBillingProvider implements BillingProvider {
  readonly name = "stripe";
  private readonly client: Stripe;

  constructor(
    secretKey: string,
    private readonly priceId: string,
    private readonly siteUrl: string,
  ) {
    if (!secretKey) {
      throw new Error("StripeBillingProvider requires a real STRIPE_SECRET_KEY — none was provided.");
    }
    if (!priceId) {
      throw new Error("StripeBillingProvider requires STRIPE_PRICE_ID_PREMIUM to be set.");
    }
    this.client = new Stripe(secretKey);
  }

  async createCheckoutSession(input: {
    userId: string;
    userEmail: string;
  }): Promise<CheckoutSessionResult> {
    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      customer_email: input.userEmail,
      client_reference_id: input.userId,
      line_items: [{ price: this.priceId, quantity: 1 }],
      success_url: `${this.siteUrl}/dashboard?upgraded=true`,
      cancel_url: `${this.siteUrl}/pricing`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout session URL.");
    }

    return { mode: "redirect", redirectUrl: session.url };
  }

  async cancelSubscription(input: { userId: string }): Promise<CancelResult> {
    const subscription = await prisma.subscription.findUnique({ where: { userId: input.userId } });
    if (!subscription?.providerSubscriptionId) {
      throw new Error("No Stripe subscription on file for this user.");
    }

    const canceled = await this.client.subscriptions.update(subscription.providerSubscriptionId, {
      cancel_at_period_end: true,
    });

    const effectiveAt = canceled.items.data[0]?.current_period_end;
    return {
      mode: "scheduled",
      effectiveAt: effectiveAt ? new Date(effectiveAt * 1000).toISOString() : undefined,
    };
  }
}

/**
 * Verifies and applies a Stripe webhook event. Only meaningful when
 * Stripe is the active provider — the `/api/billing/webhook` route
 * rejects requests when `STRIPE_WEBHOOK_SECRET` isn't set, rather than
 * silently accepting unverified payloads.
 */
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
  webhookSecret: string,
  secretKey: string,
): Promise<{ handled: boolean; type: string }> {
  const client = new Stripe(secretKey);
  const event = client.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { plan: "PREMIUM" } }),
        prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: "PREMIUM",
            status: "ACTIVE",
            provider: "stripe",
            providerCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            providerSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : undefined,
          },
          update: {
            plan: "PREMIUM",
            status: "ACTIVE",
            provider: "stripe",
            providerCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            providerSubscriptionId:
              typeof session.subscription === "string" ? session.subscription : undefined,
          },
        }),
        prisma.billingEvent.create({
          data: { userId, type: `stripe_webhook:${event.type}`, detail: session.id },
        }),
      ]);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const existing = await prisma.subscription.findFirst({
        where: { providerSubscriptionId: sub.id },
      });
      if (!existing) break;

      await prisma.$transaction([
        prisma.user.update({ where: { id: existing.userId }, data: { plan: "FREE" } }),
        prisma.subscription.update({
          where: { userId: existing.userId },
          data: { plan: "FREE", status: "CANCELED" },
        }),
        prisma.billingEvent.create({
          data: { userId: existing.userId, type: `stripe_webhook:${event.type}`, detail: sub.id },
        }),
      ]);
      break;
    }

    default:
      return { handled: false, type: event.type };
  }

  return { handled: true, type: event.type };
}
