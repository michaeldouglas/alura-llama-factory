import { ensureBillingProfile } from "@/lib/billing/customer";
import { BILLING_CATALOG, FREE_LOOKUP_KEY, getCatalogItem, getPlanByLookupKey, isHumanCareEnabled, isPaidPlan, type PlanKey } from "@/lib/billing/catalog";
import { prisma } from "@/lib/prisma";

export function getPlanLimit(planKey: string) {
  return BILLING_CATALOG[
    Object.keys(BILLING_CATALOG).find((key) => BILLING_CATALOG[key as keyof typeof BILLING_CATALOG].planKey === planKey) as keyof typeof BILLING_CATALOG
  ]?.monthlyAiResponses ?? BILLING_CATALOG[FREE_LOOKUP_KEY].monthlyAiResponses ?? 20;
}

export function hasActiveSubscription(status: string) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export function canUsePlan(planKey: string, status: string) {
  if (!isPaidPlan(planKey)) return true;
  return hasActiveSubscription(status) && (planKey !== "human_care" || isHumanCareEnabled());
}

export async function getBillingSnapshot(userId: string) {
  const profile = await ensureBillingProfile(userId);
  const item = getCatalogItem(profile.priceLookupKey) ?? BILLING_CATALOG[FREE_LOOKUP_KEY];
  const planKey = (item.planKey ?? "free") as PlanKey;
  const effectivePaid = isPaidPlan(planKey) && canUsePlan(planKey, profile.subscriptionStatus);
  return {
    profile,
    item,
    planKey: effectivePaid ? planKey : "free" as const,
    baseLimit: effectivePaid ? getPlanLimit(planKey) : getPlanLimit("free"),
    isPaid: effectivePaid,
    humanCareEnabled: isHumanCareEnabled(),
  };
}

export async function getPlanFromSubscriptionPrice(priceId: string, lookupKey?: string | null) {
  const item = lookupKey ? getPlanByLookupKey(lookupKey) : undefined;
  if (item?.planKey) return item;
  const profile = await prisma.billingSubscription.findFirst({ where: { stripePriceId: priceId }, orderBy: { updatedAt: "desc" }, select: { priceLookupKey: true } });
  return profile ? getPlanByLookupKey(profile.priceLookupKey) : undefined;
}
