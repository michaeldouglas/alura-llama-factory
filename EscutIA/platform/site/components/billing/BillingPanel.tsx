"use client";

import { useState } from "react";

import { BILLING_CATALOG, PAID_PLAN_LOOKUP_KEYS } from "@/lib/billing/catalog";

type BillingStatus = {
  planKey: string;
  planName: string;
  subscriptionStatus: string;
  subscriptionId: boolean;
  cancelAtPeriodEnd: boolean;
  withdrawalEligible: boolean;
  currentPeriodEnd: string;
  humanCareEnabled: boolean;
  usage: { baseLimit: number; baseUsed: number; addonRemaining: number; remaining: number; endsAt: string };
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function priceLabel(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);
}

export default function BillingPanel({ initial }: { initial: BillingStatus }) {
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function openPortal() {
    setBusy("portal"); setNotice("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível abrir o gerenciamento.");
      window.location.assign(data.url);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível abrir o gerenciamento."); setBusy(null); }
  }

  async function buyAddon() {
    setBusy("addon"); setNotice("");
    try {
      const requestId = crypto.randomUUID();
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lookupKey: "escutia_ai_responses_100_onetime", requestId }) });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível abrir o pacote adicional.");
      window.location.assign(data.url);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível abrir o pacote adicional."); setBusy(null); }
  }

  async function contractPlan(lookupKey: string) {
    setBusy(lookupKey); setNotice("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lookupKey, requestId: crypto.randomUUID() }) });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível iniciar a contratação.");
      window.location.assign(data.url);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível iniciar a contratação."); setBusy(null); }
  }

  async function requestWithdrawal() {
    if (!window.confirm("O cancelamento por arrependimento encerra sua assinatura e seu acesso pago imediatamente. O reembolso integral será solicitado à Stripe. Deseja continuar?")) return;
    setBusy("withdrawal"); setNotice("");
    try {
      const response = await fetch("/api/billing/withdrawal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { canceled?: boolean; refunded?: boolean; refundPending?: boolean; error?: string } | null;
      if (!response.ok && !data?.canceled) throw new Error(data?.error || "Não foi possível concluir o cancelamento.");

      setStatus((current) => ({
        ...current,
        planKey: "free",
        planName: "EscutIA Grátis",
        subscriptionStatus: "canceled",
        subscriptionId: false,
        cancelAtPeriodEnd: false,
        withdrawalEligible: false,
        usage: { ...current.usage, baseLimit: 20, baseUsed: 0, addonRemaining: 0, remaining: 20 },
      }));
      setNotice(data?.refundPending ? "Sua assinatura foi cancelada. O reembolso integral ficou pendente de conclusão na Stripe." : data?.refunded ? "Sua assinatura foi cancelada e o reembolso integral foi solicitado." : "Sua assinatura foi cancelada. Não havia cobrança paga pendente para reembolsar.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível concluir o cancelamento.");
    } finally { setBusy(null); }
  }

  return <div className="mt-9 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <section aria-labelledby="billing-plan-title" className="rounded-[2rem] bg-navy p-7 text-white shadow-2xl shadow-navy/15 sm:p-10">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-peach">plano atual</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h2 id="billing-plan-title" className="text-3xl font-black">{status.planName}</h2><p className="mt-2 text-white/60">Status: {status.subscriptionStatus === "active" ? "ativo" : status.subscriptionStatus}</p></div>{status.subscriptionId && <div className="flex flex-wrap gap-3"><button type="button" onClick={openPortal} disabled={busy === "portal" || busy === "withdrawal"} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-navy transition hover:bg-peach disabled:opacity-60">{busy === "portal" ? "Abrindo…" : "Gerenciar assinatura"}</button>{status.withdrawalEligible ? <button type="button" onClick={() => void requestWithdrawal()} disabled={busy !== null} className="rounded-full border border-peach/35 px-5 py-3 text-sm font-bold text-peach transition hover:bg-peach/10 disabled:cursor-not-allowed disabled:opacity-60">{busy === "withdrawal" ? "Cancelando…" : "Cancelar em até 7 dias"}</button> : null}</div>}</div>
      {status.withdrawalEligible ? <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">Ainda está dentro do prazo de arrependimento: o acesso pago será encerrado imediatamente e o reembolso integral será solicitado.</p> : null}
      {status.cancelAtPeriodEnd && <p className="mt-6 rounded-2xl border border-peach/30 bg-peach/10 px-4 py-3 text-sm leading-6 text-peach">Sua assinatura está programada para terminar em {dateLabel(status.currentPeriodEnd)}. O acesso continua disponível até essa data.</p>}
      <div className="mt-9 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Base usada</p><p className="mt-2 text-2xl font-black">{status.usage.baseUsed}/{status.usage.baseLimit}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Adicionais</p><p className="mt-2 text-2xl font-black">{status.usage.addonRemaining}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Disponíveis</p><p className="mt-2 text-2xl font-black">{status.usage.remaining}</p></div></div>
      <p className="mt-6 text-sm leading-6 text-white/55">Seu limite é renovado conforme o ciclo exibido até {dateLabel(status.usage.endsAt)}.</p>
    </section>
    {status.planKey !== "free" ? <section aria-labelledby="billing-addon-title" className="rounded-[2rem] border border-navy/10 bg-white/75 p-7 shadow-xl shadow-navy/5 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.14em] text-purple">mais espaço quando precisar</p><h2 id="billing-addon-title" className="mt-4 text-2xl font-black text-navy">100 respostas adicionais</h2><p className="mt-3 text-sm leading-7 text-navy/60">Compra única de R$ 9,90. As respostas ficam disponíveis apenas até o encerramento do ciclo atual.</p><button type="button" onClick={buyAddon} disabled={busy === "addon" || status.subscriptionStatus !== "active"} className="mt-7 w-full rounded-full bg-purple px-5 py-3 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-45">{busy === "addon" ? "Abrindo…" : "Adicionar 100 respostas"}</button><p className="mt-4 text-xs leading-5 text-navy/45">Disponível para Essencial, Premium e Cuidado Humano ativos. Não altera o plano principal.</p></section> : null}
    {status.planKey === "free" ? <section aria-labelledby="billing-contract-title" className="lg:col-span-2 rounded-[2rem] border border-purple/15 bg-[#f0edff] p-7 shadow-xl shadow-navy/5 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.14em] text-purple">contrate por aqui</p><h2 id="billing-contract-title" className="mt-4 text-2xl font-black text-navy">Escolha um plano pago</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-navy/65">Você já está no plano Grátis. Se quiser mais espaço para conversar, escolha uma opção abaixo e continue direto para o Checkout seguro da Stripe.</p><div className="mt-7 grid gap-4 md:grid-cols-3">{PAID_PLAN_LOOKUP_KEYS.map((lookupKey) => { const plan = BILLING_CATALOG[lookupKey]; const unavailable = plan.planKey === "human_care" && !status.humanCareEnabled; return <article key={lookupKey} className="flex flex-col rounded-2xl border border-navy/10 bg-white/80 p-5"><div className="min-h-24"><h3 className="text-lg font-black text-navy">{plan.name.replace("EscutIA ", "")}</h3><p className="mt-2 text-2xl font-black tabular-nums text-purple">{priceLabel(plan.amount)}<span className="text-sm font-bold text-navy/45">/mês</span></p></div><p className="mt-4 text-sm leading-6 text-navy/60">{plan.monthlyAiResponses} respostas da IA por mês.</p>{unavailable ? <span className="mt-6 inline-flex justify-center rounded-full border border-navy/10 px-4 py-3 text-sm font-bold text-navy/45">Em preparação</span> : <button type="button" onClick={() => void contractPlan(lookupKey)} disabled={busy !== null} className="mt-6 inline-flex justify-center rounded-full bg-purple px-4 py-3 text-sm font-bold text-white transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy === lookupKey ? "Abrindo…" : `Contratar ${plan.name.replace("EscutIA ", "")}`}</button>}</article>; })}</div><p className="mt-5 text-xs leading-5 text-navy/50">A cobrança começa somente depois que você confirmar os dados no Checkout.</p></section> : null}
    {notice && <p role="alert" className="lg:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{notice}</p>}
  </div>;
}
