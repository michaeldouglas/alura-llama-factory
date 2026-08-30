import { downgradeToFree, findUserIdByStripeCustomerId, syncStripeSubscription } from "@/lib/billing/customer";
import { ADDON_LOOKUP_KEY, getCatalogItem } from "@/lib/billing/catalog";
import { grantAddonPurchase, revokeAddonByPaymentIntent } from "@/lib/billing/usage";
import { prisma } from "@/lib/prisma";
import { retrieveSubscription, type StripeCharge, type StripeCheckoutSession, type StripeEventPayload, type StripeInvoice, type StripeSubscription } from "@/lib/stripe";

function asString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function getCustomerId(value: unknown) {
  return typeof value === "string" ? value : value && typeof value === "object" && "id" in value ? asString((value as { id?: unknown }).id) : null;
}

async function handleCheckoutSession(session: StripeCheckoutSession) {
  const metadata = session.metadata ?? {};
  const userId = metadata.escutia_user_id ?? (getCustomerId(session.customer) ? await findUserIdByStripeCustomerId(getCustomerId(session.customer)!) : null);
  if (!userId) throw new Error("BILLING_USER_NOT_FOUND");

  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    await syncStripeSubscription(await retrieveSubscription(subscriptionId), userId);
    return;
  }

  if (session.mode === "payment" && session.payment_status === "paid") {
    const lookupKey = metadata.lookup_key;
    if (lookupKey !== ADDON_LOOKUP_KEY) throw new Error("STRIPE_ADDON_LOOKUP_KEY_INVALID");
    const priceId = metadata.price_id;
    const amount = Number(metadata.amount);
    const currency = metadata.currency || "brl";
    const catalogItem = getCatalogItem(lookupKey);
    if (!priceId || !catalogItem || !Number.isInteger(amount)) throw new Error("STRIPE_ADDON_METADATA_INVALID");
    await grantAddonPurchase({ userId, checkoutSessionId: session.id, paymentIntentId: session.payment_intent, priceId, lookupKey, amount, currency });
  }
}

async function handleSubscription(subscription: StripeSubscription) {
  const customerId = getCustomerId(subscription.customer);
  const userId = customerId ? await findUserIdByStripeCustomerId(customerId) : null;
  await syncStripeSubscription(subscription, userId);
}

async function handleInvoice(invoice: StripeInvoice, paid: boolean) {
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const customerId = getCustomerId(invoice.customer);
  const userId = customerId ? await findUserIdByStripeCustomerId(customerId) : null;
  if (subscriptionId && paid) {
    await syncStripeSubscription(await retrieveSubscription(subscriptionId), userId);
    return;
  }
  if (userId && !paid) {
    await prisma.billingProfile.updateMany({ where: { userId, subscriptionId }, data: { subscriptionStatus: "past_due" } });
  }
}

async function handleRefund(charge: StripeCharge) {
  if (charge.payment_intent) await revokeAddonByPaymentIntent(charge.payment_intent);
}

export async function handleStripeEvent(event: StripeEventPayload) {
  const object = asRecord(event.data.object);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutSession(object as unknown as StripeCheckoutSession);
      return;
    case "checkout.session.async_payment_failed":
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscription(object as unknown as StripeSubscription);
      if (event.type === "customer.subscription.deleted") {
        const customerId = getCustomerId((object as { customer?: unknown }).customer);
        const userId = customerId ? await findUserIdByStripeCustomerId(customerId) : null;
        if (userId) await downgradeToFree(userId);
      }
      return;
    case "invoice.paid":
      await handleInvoice(object as unknown as StripeInvoice, true);
      return;
    case "invoice.payment_failed":
      await handleInvoice(object as unknown as StripeInvoice, false);
      return;
    case "charge.refunded":
      await handleRefund(object as unknown as StripeCharge);
      return;
    default:
      return;
  }
}
