import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import BillingPanel from "@/components/billing/BillingPanel";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ImmediateHelp from "@/components/shared/ImmediateHelp";
import { authOptions } from "@/lib/auth";
import { getBillingSnapshot } from "@/lib/billing/entitlements";
import { getUsageStatus } from "@/lib/billing/usage";

export const dynamic = "force-dynamic";

const WITHDRAWAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");
  const [billing, usage] = await Promise.all([getBillingSnapshot(session.user.id), getUsageStatus(session.user.id)]);
  const withdrawalEligible = Boolean(billing.profile.subscriptionId && billing.profile.subscriptionCreatedAt && Date.now() <= billing.profile.subscriptionCreatedAt.getTime() + WITHDRAWAL_WINDOW_MS);
  return <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex"><DashboardSidebar name={session.user.name || session.user.email?.split("@")[0] || "pessoa"} email={session.user.email ?? null} image={session.user.image ?? null} active="billing" /><div className="min-w-0 flex-1"><div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14"><header><p className="eyebrow">assinatura e uso</p><h1 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-6xl">Seu plano</h1><p className="mt-3 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Acompanhe seu limite mensal, veja a validade dos adicionais e gerencie sua assinatura.</p></header><BillingPanel initial={{ planKey: billing.planKey, planName: billing.planKey === "free" ? "EscutIA Grátis" : billing.item.name, subscriptionStatus: billing.profile.subscriptionStatus, subscriptionId: Boolean(billing.profile.subscriptionId), cancelAtPeriodEnd: billing.profile.cancelAtPeriodEnd, withdrawalEligible, currentPeriodEnd: billing.profile.currentPeriodEnd?.toISOString() ?? usage.endsAt, humanCareEnabled: billing.humanCareEnabled, usage: { baseLimit: usage.baseLimit, baseUsed: usage.baseUsed, addonRemaining: usage.addonRemaining, remaining: usage.remaining, endsAt: usage.endsAt } }} /></div></div><ImmediateHelp /></main>;
}
