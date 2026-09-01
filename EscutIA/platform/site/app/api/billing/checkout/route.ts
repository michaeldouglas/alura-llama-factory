import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { ensureBillingProfile, getOrCreateStripeCustomer } from "@/lib/billing/customer";
import { ADDON_LOOKUP_KEY, getCatalogItem, isHumanCareEnabled, isPaidPlan } from "@/lib/billing/catalog";
import { createCheckoutSession, findPriceByLookupKey, listCustomerSubscriptions, StripeApiError } from "@/lib/stripe";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Faça login para escolher um plano." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { lookupKey?: unknown; requestId?: unknown } | null;
  const lookupKey = typeof body?.lookupKey === "string" ? body.lookupKey : "";
  const requestId = typeof body?.requestId === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(body.requestId) ? body.requestId : randomUUID();
  const item = getCatalogItem(lookupKey);
  if (!item || !item.planKey && lookupKey !== ADDON_LOOKUP_KEY) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  if (lookupKey === "escutia_free_monthly") return NextResponse.json({ error: "O plano Grátis é atribuído no cadastro." }, { status: 400 });
  if (lookupKey === "escutia_human_care_monthly" && !isHumanCareEnabled()) return NextResponse.json({ error: "O Cuidado Humano ainda não está disponível para contratação." }, { status: 409 });

  try {
    const profile = await ensureBillingProfile(session.user.id);
    if (lookupKey === ADDON_LOOKUP_KEY) {
      const eligible = profile.planKey === "essential" || profile.planKey === "premium" || profile.planKey === "human_care";
      const paidStatus = profile.subscriptionStatus === "active" || profile.subscriptionStatus === "trialing";
      if (!eligible || !paidStatus || !profile.subscriptionId || !profile.currentPeriodEnd || profile.currentPeriodEnd <= new Date()) {
        return NextResponse.json({ error: "O pacote adicional está disponível apenas para assinaturas pagas ativas." }, { status: 409 });
      }
    } else if (isPaidPlan(profile.planKey) && profile.subscriptionId) {
      return NextResponse.json({ error: "Sua conta já possui uma assinatura. Use o gerenciamento da assinatura para trocar de plano." }, { status: 409 });
    }
    const price = await findPriceByLookupKey(lookupKey);
    if (price.currency !== item.currency || price.unit_amount !== item.amount || (item.billingType === "recurring" ? price.type !== "recurring" : price.type !== "one_time")) {
      return NextResponse.json({ error: "O preço configurado na Stripe não corresponde ao catálogo da EscutIA." }, { status: 409 });
    }
    const { customerId } = await getOrCreateStripeCustomer(session.user.id);
    if (item.billingType === "recurring") {
      const existingSubscriptions = await listCustomerSubscriptions(customerId);
      const hasExistingSubscription = existingSubscriptions.data.some((subscription) => [
        "active",
        "trialing",
        "past_due",
        "unpaid",
        "incomplete",
        "paused",
      ].includes(subscription.status));
      if (hasExistingSubscription) {
        return NextResponse.json({ error: "Sua conta já possui uma assinatura na Stripe. Use o gerenciamento da assinatura para trocar de plano." }, { status: 409 });
      }
    }
    const baseParameters: Record<string, string> = {
      mode: item.billingType === "recurring" ? "subscription" : "payment",
      customer: customerId,
      client_reference_id: session.user.id,
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl()}/dashboard/billing?checkout=success`,
      cancel_url: `${siteUrl()}/planos?checkout=cancelled`,
      "metadata[escutia_user_id]": session.user.id,
      "metadata[lookup_key]": item.lookupKey,
      "metadata[price_id]": price.id,
      "metadata[amount]": String(item.amount),
      "metadata[currency]": item.currency,
      integration_identifier: `escutia_${item.billingType}_${randomUUID().replace(/-/g, "").slice(0, 8)}`,
    };
    if (item.billingType === "recurring") {
      baseParameters["subscription_data[metadata][escutia_user_id]"] = session.user.id;
      baseParameters["subscription_data[metadata][lookup_key]"] = item.lookupKey;
    } else {
      baseParameters["payment_intent_data[metadata][escutia_user_id]"] = session.user.id;
      baseParameters["payment_intent_data[metadata][lookup_key]"] = item.lookupKey;
    }
    const idempotencyKey = `escutia_checkout_${session.user.id}_${lookupKey}_${requestId}`;
    const checkout = await createCheckoutSession(baseParameters, idempotencyKey);
    return NextResponse.json({ url: checkout.url ?? null });
  } catch (error) {
    console.error("Não foi possível criar Checkout da EscutIA:", error);
    if (error instanceof Error && error.message === "STRIPE_TEST_MODE_REQUIRED") return NextResponse.json({ error: "A Stripe precisa estar configurada com uma chave de Sandbox/Test." }, { status: 503 });
    if (error instanceof StripeApiError) return NextResponse.json({ error: "Não foi possível iniciar o Checkout agora." }, { status: 502 });
    return NextResponse.json({ error: "Não foi possível iniciar o Checkout agora." }, { status: 503 });
  }
}
