import { prisma } from "@/lib/prisma";
import { getBillingSnapshot, getPlanLimit, hasActiveSubscription } from "@/lib/billing/entitlements";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function getCalendarMonthBounds(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { startsAt: new Date(Date.UTC(year, month - 1, 1)), endsAt: new Date(Date.UTC(year, month, 1)) };
}

async function getPeriodDefinition(userId: string, now: Date, transaction: TransactionClient) {
  const profile = await transaction.billingProfile.findUnique({ where: { userId } });
  const paidProfile = profile && profile.planKey !== "free" && hasActiveSubscription(profile.subscriptionStatus) && profile.currentPeriodStart && profile.currentPeriodEnd && profile.currentPeriodEnd > now ? profile : null;
  const startsAt: Date = paidProfile ? paidProfile.currentPeriodStart! : getCalendarMonthBounds(now).startsAt;
  const endsAt: Date = paidProfile ? paidProfile.currentPeriodEnd! : getCalendarMonthBounds(now).endsAt;
  const planKey = paidProfile ? paidProfile.planKey : "free";
  return { startsAt, endsAt, planKey, baseLimit: getPlanLimit(planKey), periodKey: `${startsAt.toISOString()}_${endsAt.toISOString()}` };
}

async function ensurePeriod(userId: string, now: Date, transaction: TransactionClient) {
  const definition = await getPeriodDefinition(userId, now, transaction);
  return transaction.aiUsagePeriod.upsert({
    where: { userId_periodKey: { userId, periodKey: definition.periodKey } },
    create: { userId, periodKey: definition.periodKey, planKey: definition.planKey, baseLimit: definition.baseLimit, startsAt: definition.startsAt, endsAt: definition.endsAt },
    update: { planKey: definition.planKey, baseLimit: definition.baseLimit, startsAt: definition.startsAt, endsAt: definition.endsAt },
  });
}

async function expireAddons(userId: string, now: Date, transaction: TransactionClient) {
  await transaction.addonPurchase.updateMany({ where: { userId, expiresAt: { lte: now }, status: "paid", remainingUnits: { gt: 0 } }, data: { status: "expired", remainingUnits: 0 } });
}

export async function reserveAiResponse(userId: string, operationKey: string) {
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.aiUsageEntry.findUnique({ where: { operationKey } });
    if (existing && (existing.status === "reserved" || existing.status === "consumed")) return { ok: true, duplicate: true, entryId: existing.id };
    const period = await ensurePeriod(userId, now, transaction);
    await expireAddons(userId, now, transaction);
    const baseAvailable = Math.max(period.baseLimit - period.baseUsed, 0);
    const addon = baseAvailable > 0 ? null : await transaction.addonPurchase.findFirst({ where: { userId, usagePeriodId: period.id, status: "paid", expiresAt: { gt: now }, remainingUnits: { gt: 0 } }, orderBy: { createdAt: "asc" } });
    if (baseAvailable <= 0 && !addon) return { ok: false, reason: "LIMIT_REACHED" as const };
    const kind = addon ? "addon" : "base";
    const entry = existing
      ? await transaction.aiUsageEntry.update({ where: { id: existing.id }, data: { status: "reserved", kind, addonPurchaseId: addon?.id ?? null, releasedAt: null, consumedAt: null } })
      : await transaction.aiUsageEntry.create({ data: { userId, usagePeriodId: period.id, operationKey, kind, addonPurchaseId: addon?.id ?? null } });
    if (addon) {
      await transaction.addonPurchase.update({ where: { id: addon.id }, data: { remainingUnits: { decrement: 1 } } });
      await transaction.aiUsagePeriod.update({ where: { id: period.id }, data: { addonUsed: { increment: 1 } } });
    } else {
      await transaction.aiUsagePeriod.update({ where: { id: period.id }, data: { baseUsed: { increment: 1 } } });
    }
    return { ok: true, duplicate: false, entryId: entry.id };
  });
}

export async function commitAiResponse(operationKey: string) {
  await prisma.aiUsageEntry.updateMany({ where: { operationKey, status: "reserved" }, data: { status: "consumed", consumedAt: new Date() } });
}

export async function releaseAiResponse(operationKey: string) {
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    const entry = await transaction.aiUsageEntry.findUnique({ where: { operationKey } });
    if (!entry || entry.status !== "reserved") return;
    await transaction.aiUsageEntry.update({ where: { id: entry.id }, data: { status: "released", releasedAt: now } });
    await transaction.aiUsagePeriod.update({ where: { id: entry.usagePeriodId }, data: entry.kind === "addon" ? { addonUsed: { decrement: 1 } } : { baseUsed: { decrement: 1 } } });
    if (entry.addonPurchaseId) await transaction.addonPurchase.update({ where: { id: entry.addonPurchaseId }, data: { remainingUnits: { increment: 1 } } });
  });
}

export async function getUsageStatus(userId: string) {
  const snapshot = await getBillingSnapshot(userId);
  const now = new Date();
  const data = await prisma.$transaction(async (transaction) => {
    const period = await ensurePeriod(userId, now, transaction);
    await expireAddons(userId, now, transaction);
    const addons = await transaction.addonPurchase.findMany({ where: { userId, usagePeriodId: period.id, status: "paid", expiresAt: { gt: now } }, select: { remainingUnits: true } });
    return { period, addonRemaining: addons.reduce((sum, addon) => sum + addon.remainingUnits, 0) };
  });
  return {
    planKey: snapshot.planKey,
    planName: snapshot.item.name,
    baseLimit: data.period.baseLimit,
    baseUsed: data.period.baseUsed,
    addonGranted: data.period.addonGranted,
    addonUsed: data.period.addonUsed,
    addonRemaining: data.addonRemaining,
    remaining: Math.max(data.period.baseLimit - data.period.baseUsed, 0) + data.addonRemaining,
    startsAt: data.period.startsAt.toISOString(),
    endsAt: data.period.endsAt.toISOString(),
  };
}

export async function grantAddonPurchase(input: { userId: string; checkoutSessionId: string; paymentIntentId?: string | null; priceId: string; lookupKey: string; amount: number; currency: string }) {
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.addonPurchase.findUnique({ where: { checkoutSessionId: input.checkoutSessionId } });
    if (existing) return existing;
    const period = await ensurePeriod(input.userId, now, transaction);
    const eligible = period.planKey === "essential" || period.planKey === "premium" || period.planKey === "human_care";
    const expiresAt = period.endsAt > now ? period.endsAt : now;
    const purchase = await transaction.addonPurchase.create({
      data: {
        userId: input.userId,
        usagePeriodId: eligible ? period.id : null,
        checkoutSessionId: input.checkoutSessionId,
        paymentIntentId: input.paymentIntentId,
        priceId: input.priceId,
        lookupKey: input.lookupKey,
        amount: input.amount,
        currency: input.currency,
        status: eligible ? "paid" : "blocked",
        grantedUnits: eligible ? 100 : 0,
        remainingUnits: eligible ? 100 : 0,
        expiresAt,
      },
    });
    if (eligible) await transaction.aiUsagePeriod.update({ where: { id: period.id }, data: { addonGranted: { increment: 100 } } });
    return purchase;
  });
}

export async function revokeAddonByPaymentIntent(paymentIntentId: string) {
  return prisma.$transaction(async (transaction) => {
    const purchase = await transaction.addonPurchase.findUnique({ where: { paymentIntentId } });
    if (!purchase || purchase.status === "refunded") return purchase;
    return transaction.addonPurchase.update({ where: { id: purchase.id }, data: { status: "refunded", remainingUnits: 0, refundedAt: new Date() } });
  });
}
