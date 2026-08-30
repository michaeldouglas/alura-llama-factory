import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getBillingSnapshot } from "@/lib/billing/entitlements";
import { getUsageStatus } from "@/lib/billing/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const [billing, usage] = await Promise.all([getBillingSnapshot(session.user.id), getUsageStatus(session.user.id)]);
    return NextResponse.json({
      planKey: billing.planKey,
      planName: billing.planKey === "free" ? "EscutIA Grátis" : billing.item.name,
      subscriptionStatus: billing.profile.subscriptionStatus,
      stripeCustomerId: Boolean(billing.profile.stripeCustomerId),
      subscriptionId: Boolean(billing.profile.subscriptionId),
      cancelAtPeriodEnd: billing.profile.cancelAtPeriodEnd,
      currentPeriodStart: billing.profile.currentPeriodStart?.toISOString() ?? usage.startsAt,
      currentPeriodEnd: billing.profile.currentPeriodEnd?.toISOString() ?? usage.endsAt,
      humanCareEnabled: billing.humanCareEnabled,
      usage,
    });
  } catch (error) {
    console.error("Não foi possível carregar o billing da EscutIA:", error);
    return NextResponse.json({ error: "Não foi possível carregar o seu plano agora." }, { status: 503 });
  }
}
