import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { ensureBillingProfile } from "@/lib/billing/customer";
import { createBillingPortalSession } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Faça login para gerenciar sua assinatura." }, { status: 401 });
  try {
    const profile = await ensureBillingProfile(session.user.id);
    if (!profile.stripeCustomerId) return NextResponse.json({ error: "Sua conta ainda não possui uma assinatura paga." }, { status: 400 });
    const returnUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")}/dashboard/billing`;
    const portal = await createBillingPortalSession(profile.stripeCustomerId, returnUrl);
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error("Não foi possível abrir o Customer Portal da EscutIA:", error);
    return NextResponse.json({ error: "Não foi possível abrir o gerenciamento agora." }, { status: 503 });
  }
}
