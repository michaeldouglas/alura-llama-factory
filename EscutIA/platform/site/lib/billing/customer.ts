import { prisma } from "@/lib/prisma";
import { createStripeCustomer } from "@/lib/stripe";
import { findPriceById, type StripeSubscription } from "@/lib/stripe";
import { FREE_LOOKUP_KEY, getPlanByLookupKey } from "@/lib/billing/catalog";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"]);

export async function ensureBillingProfile(userId: string) {
  return prisma.billingProfile.upsert({
    where: { userId },
    create: { userId, planKey: "free", priceLookupKey: FREE_LOOKUP_KEY, subscriptionStatus: "active" },
    update: {},
  });
}

export async function getOrCreateStripeCustomer(userId: string) {
  const profile = await ensureBillingProfile(userId);
  if (profile.stripeCustomerId) return { profile, customerId: profile.stripeCustomerId };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user) throw new Error("USER_NOT_FOUND");
  const customer = await createStripeCustomer({ userId, email: user.email, name: user.name });
  try {
    const updated = await prisma.billingProfile.update({ where: { userId }, data: { stripeCustomerId: customer.id } });
    return { profile: updated, customerId: customer.id };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Unique constraint")) throw error;
    const existing = await ensureBillingProfile(userId);
    return { profile: existing, customerId: existing.stripeCustomerId || customer.id };
  }
}

export async function findUserIdByStripeCustomerId(stripeCustomerId: string) {
  const profile = await prisma.billingProfile.findUnique({ where: { stripeCustomerId }, select: { userId: true } });
  return profile?.userId ?? null;
}

export async function downgradeToFree(userId: string) {
  return prisma.billingProfile.upsert({
    where: { userId },
    create: { userId, planKey: "free", priceLookupKey: FREE_LOOKUP_KEY, subscriptionStatus: "canceled" },
    update: {
      planKey: "free",
      priceLookupKey: FREE_LOOKUP_KEY,
      priceId: null,
      subscriptionId: null,
      subscriptionStatus: "canceled",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      subscriptionCreatedAt: null,
    },
  });
}

export async function syncStripeSubscription(subscription: StripeSubscription, userId?: string | null) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const resolvedUserId = userId ?? await findUserIdByStripeCustomerId(customerId);
  if (!resolvedUserId) throw new Error("BILLING_USER_NOT_FOUND");
  const item = subscription.items.data[0];
  if (!item) throw new Error("STRIPE_SUBSCRIPTION_PRICE_MISSING");
  const price = item.price.lookup_key ? item.price : await findPriceById(item.price.id);
  const catalogItem = getPlanByLookupKey(price.lookup_key ?? "");
  if (!catalogItem?.planKey) throw new Error("STRIPE_PLAN_LOOKUP_KEY_INVALID");
  const existingProfile = await prisma.billingProfile.findUnique({ where: { userId: resolvedUserId } });
  if (
    existingProfile?.subscriptionId &&
    existingProfile.subscriptionId !== subscription.id &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(existingProfile.subscriptionStatus)
  ) {
    return resolvedUserId;
  }
  const periodItem = subscription.items.data[0];
  const startTimestamp = subscription.current_period_start ?? periodItem.current_period_start ?? subscription.billing_cycle_anchor;
  const endTimestamp = subscription.current_period_end ?? periodItem.current_period_end;
  if (typeof startTimestamp !== "number" || typeof endTimestamp !== "number" || !Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp) || startTimestamp <= 0 || endTimestamp <= startTimestamp) {
    throw new Error("STRIPE_SUBSCRIPTION_PERIOD_INVALID");
  }
  const start = new Date(startTimestamp * 1000);
  const end = new Date(endTimestamp * 1000);
  const subscriptionCreatedAt = typeof subscription.created === "number" ? new Date(subscription.created * 1000) : null;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("STRIPE_SUBSCRIPTION_PERIOD_INVALID");
  }
  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: resolvedUserId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: price.id,
      priceLookupKey: price.lookup_key ?? catalogItem.lookupKey,
      planKey: catalogItem.planKey,
      status: subscription.status,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscriptionCreatedAt,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
    },
    update: {
      userId: resolvedUserId,
      stripeCustomerId: customerId,
      stripePriceId: price.id,
      priceLookupKey: price.lookup_key ?? catalogItem.lookupKey,
      planKey: catalogItem.planKey,
      status: subscription.status,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      subscriptionCreatedAt,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
    },
  });
  if (subscription.status === "canceled" || subscription.ended_at) {
    await downgradeToFree(resolvedUserId);
  } else {
    await prisma.billingProfile.upsert({
      where: { userId: resolvedUserId },
      create: {
        userId: resolvedUserId,
        stripeCustomerId: customerId,
        planKey: catalogItem.planKey,
        priceLookupKey: price.lookup_key ?? catalogItem.lookupKey,
        priceId: price.id,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionCreatedAt,
      },
      update: {
        stripeCustomerId: customerId,
        planKey: catalogItem.planKey,
        priceLookupKey: price.lookup_key ?? catalogItem.lookupKey,
        priceId: price.id,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        subscriptionCreatedAt,
      },
    });
  }
  return resolvedUserId;
}
