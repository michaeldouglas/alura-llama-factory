"use client";

import { useState } from "react";

type BillingStatus = {
  planKey: string;
  planName: string;
  subscriptionStatus: string;
  subscriptionId: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  humanCareEnabled: boolean;
  usage: { baseLimit: number; baseUsed: number; addonRemaining: number; remaining: number; endsAt: string };
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export default function BillingPanel({ initial }: { initial: BillingStatus }) {
  const status = initial;
  const [busy, setBusy] = useState<"portal" | "addon" | null>(null);
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
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lookupKey: "escutia_ai_responses_100_onetime" }) });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível abrir o pacote adicional.");
      window.location.assign(data.url);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível abrir o pacote adicional."); setBusy(null); }
  }

  return <div className="mt-9 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <section aria-labelledby="billing-plan-title" className="rounded-[2rem] bg-navy p-7 text-white shadow-2xl shadow-navy/15 sm:p-10">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-peach">plano atual</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h2 id="billing-plan-title" className="text-3xl font-black">{status.planName}</h2><p className="mt-2 text-white/60">Status: {status.subscriptionStatus === "active" ? "ativo" : status.subscriptionStatus}</p></div>{status.subscriptionId && <button type="button" onClick={openPortal} disabled={busy === "portal"} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-navy transition hover:bg-peach disabled:opacity-60">{busy === "portal" ? "Abrindo…" : "Gerenciar assinatura"}</button>}</div>
      {status.cancelAtPeriodEnd && <p className="mt-6 rounded-2xl border border-peach/30 bg-peach/10 px-4 py-3 text-sm leading-6 text-peach">Sua assinatura está programada para terminar em {dateLabel(status.currentPeriodEnd)}. O acesso continua disponível até essa data.</p>}
      <div className="mt-9 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Base usada</p><p className="mt-2 text-2xl font-black">{status.usage.baseUsed}/{status.usage.baseLimit}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Adicionais</p><p className="mt-2 text-2xl font-black">{status.usage.addonRemaining}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Disponíveis</p><p className="mt-2 text-2xl font-black">{status.usage.remaining}</p></div></div>
      <p className="mt-6 text-sm leading-6 text-white/55">Seu limite é renovado conforme o ciclo exibido até {dateLabel(status.usage.endsAt)}.</p>
    </section>
    <section aria-labelledby="billing-addon-title" className="rounded-[2rem] border border-navy/10 bg-white/75 p-7 shadow-xl shadow-navy/5 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.14em] text-purple">mais espaço quando precisar</p><h2 id="billing-addon-title" className="mt-4 text-2xl font-black text-navy">100 respostas adicionais</h2><p className="mt-3 text-sm leading-7 text-navy/60">Compra única de R$ 9,90. As respostas ficam disponíveis apenas até o encerramento do ciclo atual.</p><button type="button" onClick={buyAddon} disabled={busy === "addon" || status.planKey === "free" || status.subscriptionStatus !== "active"} className="mt-7 w-full rounded-full bg-purple px-5 py-3 text-sm font-bold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-45">{busy === "addon" ? "Abrindo…" : "Adicionar 100 respostas"}</button><p className="mt-4 text-xs leading-5 text-navy/45">Disponível para Essencial, Premium e Cuidado Humano ativos. Não altera o plano principal.</p></section>
    {notice && <p role="alert" className="lg:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{notice}</p>}
  </div>;
}
