import { NextResponse } from "next/server";

import { handleStripeEvent } from "@/lib/billing/webhook-handlers";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  try {
    const event = await verifyStripeWebhook(payload, signature);
    const existing = await prisma.stripeEvent.findUnique({ where: { stripeEventId: event.id }, select: { status: true } });
    if (existing?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
    if (!existing) {
      try {
        await prisma.stripeEvent.create({ data: { stripeEventId: event.id, type: event.type, status: "processing" } });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("Unique constraint")) throw error;
        return NextResponse.json({ received: true, duplicate: true });
      }
    } else {
      await prisma.stripeEvent.update({ where: { stripeEventId: event.id }, data: { status: "processing", error: null } });
    }
    try {
      await handleStripeEvent(event);
      await prisma.stripeEvent.update({ where: { stripeEventId: event.id }, data: { status: "processed", processedAt: new Date() } });
      return NextResponse.json({ received: true });
    } catch (error) {
      await prisma.stripeEvent.update({ where: { stripeEventId: event.id }, data: { status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "UNKNOWN_ERROR" } }).catch(() => undefined);
      console.error("Falha ao processar evento Stripe da EscutIA:", error);
      return NextResponse.json({ error: "Evento não processado." }, { status: 500 });
    }
  } catch (error) {
    console.error("Webhook Stripe inválido:", error);
    return NextResponse.json({ error: "Webhook inválido." }, { status: 400 });
  }
}
