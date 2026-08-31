import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { downgradeToFree, ensureBillingProfile } from "@/lib/billing/customer";
import { prisma } from "@/lib/prisma";
import { cancelSubscriptionImmediately, createRefund, retrieveSubscription, StripeApiError, type StripeInvoice, type StripePaymentIntent } from "@/lib/stripe";

export const runtime = "nodejs";

const WITHDRAWAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

function getPaymentIntent(invoice: StripeInvoice | null | undefined): { id: string; paid: boolean } | null {
  if (!invoice?.payment_intent) return null;
  if (typeof invoice.payment_intent === "string") return { id: invoice.payment_intent, paid: invoice.status === "paid" };
  const paymentIntent = invoice.payment_intent as StripePaymentIntent;
  return { id: paymentIntent.id, paid: paymentIntent.status === "succeeded" };
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Faça login para solicitar o cancelamento." }, { status: 401 });

  try {
    const profile = await ensureBillingProfile(session.user.id);
    if (!profile.subscriptionId || !profile.stripeCustomerId || profile.planKey === "free") {
      return NextResponse.json({ error: "Sua conta não possui uma assinatura paga ativa." }, { status: 409 });
    }

    const subscription = await retrieveSubscription(profile.subscriptionId);
    const createdAt = subscription.created ? subscription.created * 1000 : 0;
    if (!createdAt || Date.now() > createdAt + WITHDRAWAL_WINDOW_MS) {
      return NextResponse.json({ error: "O prazo de 7 dias para arrependimento já terminou. Use o cancelamento normal da assinatura." }, { status: 409 });
    }

    const existing = await prisma.billingWithdrawal.findUnique({ where: { stripeSubscriptionId: subscription.id } });
    if (existing?.status === "refunded" || existing?.status === "canceled_no_payment") {
      return NextResponse.json({ canceled: true, refunded: existing.status === "refunded", duplicate: true });
    }
    if (existing?.status === "processing" && Date.now() - existing.updatedAt.getTime() < STALE_PROCESSING_MS) {
      return NextResponse.json({ error: "Sua solicitação já está sendo processada." }, { status: 409 });
    }

    const withdrawal = existing
      ? await prisma.billingWithdrawal.update({ where: { id: existing.id }, data: { status: "processing", error: null, requestedAt: new Date() } })
      : await prisma.billingWithdrawal.create({ data: { userId: session.user.id, stripeSubscriptionId: subscription.id, status: "processing" } });

    const latestInvoice = typeof subscription.latest_invoice === "object" && subscription.latest_invoice ? subscription.latest_invoice : null;
    const paymentIntent = getPaymentIntent(latestInvoice);
    if (paymentIntent?.id) {
      await prisma.billingWithdrawal.update({ where: { id: withdrawal.id }, data: { stripePaymentIntentId: paymentIntent.id } });
    }

    try {
      await cancelSubscriptionImmediately(subscription.id, `escutia_withdrawal_cancel_${subscription.id}`);
    } catch (error) {
      await prisma.billingWithdrawal.update({ where: { id: withdrawal.id }, data: { status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "CANCEL_FAILED" } });
      throw error;
    }

    await downgradeToFree(session.user.id);
    const canceledAt = new Date();

    if (!paymentIntent?.id || !paymentIntent.paid) {
      await prisma.billingWithdrawal.update({ where: { id: withdrawal.id }, data: { status: "canceled_no_payment", canceledAt } });
      return NextResponse.json({ canceled: true, refunded: false, refundRequired: false });
    }

    try {
      await createRefund(paymentIntent.id, `escutia_withdrawal_refund_${paymentIntent.id}`);
      await prisma.billingWithdrawal.update({ where: { id: withdrawal.id }, data: { status: "refunded", canceledAt, refundedAt: new Date() } });
      return NextResponse.json({ canceled: true, refunded: true });
    } catch (error) {
      await prisma.billingWithdrawal.update({ where: { id: withdrawal.id }, data: { status: "refund_pending", canceledAt, error: error instanceof Error ? error.message.slice(0, 500) : "REFUND_FAILED" } });
      console.error("Assinatura cancelada, mas o reembolso do arrependimento ficou pendente:", error);
      return NextResponse.json({ canceled: true, refunded: false, refundPending: true, error: "A assinatura foi cancelada, mas o reembolso precisa ser concluído." }, { status: 202 });
    }
  } catch (error) {
    console.error("Não foi possível processar o arrependimento da EscutIA:", error);
    if (error instanceof StripeApiError) return NextResponse.json({ error: "A Stripe não conseguiu concluir a solicitação agora." }, { status: 502 });
    return NextResponse.json({ error: "Não foi possível concluir a solicitação agora." }, { status: 503 });
  }
}
