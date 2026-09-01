import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";
import PricingTable from "@/components/billing/PricingTable";
import { BILLING_CATALOG, isHumanCareEnabled } from "@/lib/billing/catalog";
import { authOptions } from "@/lib/auth";
import { getBillingSnapshot } from "@/lib/billing/entitlements";

export const metadata: Metadata = { title: "Planos e preços", description: "Compare os planos da EscutIA, seus limites de respostas e os recursos disponíveis em cada opção.", alternates: { canonical: "/planos" } };
export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  const billing = session?.user?.id ? await getBillingSnapshot(session.user.id) : null;
  const currentPlanKey = billing?.planKey ?? null;
  const currentPeriodEnd = billing?.profile.currentPeriodEnd?.toISOString() ?? null;
  const items = [BILLING_CATALOG.escutia_free_monthly, BILLING_CATALOG.escutia_essential_monthly, BILLING_CATALOG.escutia_premium_monthly, BILLING_CATALOG.escutia_human_care_monthly, BILLING_CATALOG.escutia_ai_responses_100_onetime];
  return <div className="min-h-screen overflow-hidden bg-warm text-navy"><Header /><main id="main-content"><section className="relative overflow-hidden pb-16 pt-20 lg:pb-24 lg:pt-28"><div aria-hidden="true" className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-peach/25 blur-3xl" /><div className="site-container relative"><span className="eyebrow">escolha com calma</span><h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.055em] sm:text-7xl">Um espaço que acompanha o seu ritmo.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-navy/65">Compare os planos e escolha o nível de acesso que faz sentido para você. A EscutIA oferece tecnologia de apoio emocional sem diagnósticos e sem substituir profissionais de saúde.</p><p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-navy/50">Ainda conhecendo a EscutIA? Comece pelo plano Grátis. Se você já estiver conectado, o botão mostrará o seu plano atual ou a próxima ação disponível.</p></div></section><section className="site-container pb-24" aria-labelledby="pricing-title"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">planos escutia</p><h2 id="pricing-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Veja o que está incluído</h2></div><p className="max-w-sm text-sm leading-6 text-navy/55">Todos os preços estão em reais. Só há cobrança mensal nos planos de assinatura.</p></div><PricingTable items={items} humanCareEnabled={isHumanCareEnabled()} currentPlanKey={currentPlanKey} currentPeriodEnd={currentPeriodEnd} /><div className="mt-8 rounded-[26px] border border-purple/15 bg-[#f0edff] p-6 text-sm leading-7 text-navy/65"><strong className="text-navy">Sobre o Cuidado Humano:</strong> a sessão é realizada por psicólogo humano habilitado, mediante agendamento e disponibilidade. Este plano permanece em preparação até que o atendimento profissional esteja operacional.</div></section></main><Footer /></div>;
}
