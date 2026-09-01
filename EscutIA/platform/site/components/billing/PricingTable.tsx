"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type PricingItem = {
  lookupKey: string;
  name: string;
  description: string;
  amount: number;
  billingType: "recurring" | "one_time";
  planKey?: string;
  monthlyAiResponses?: number;
  includesHumanSession: boolean;
  humanSessionsPerMonth: number;
  eligiblePlans?: string[];
};

function formatPrice(amount: number, billingType: PricingItem["billingType"]) {
  if (amount === 0) return "Grátis";
  return `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100)}${billingType === "recurring" ? "/mês" : ""}`;
}

function formatPeriodEnd(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function planAction(item: PricingItem, humanCareEnabled: boolean, isAuthenticated: boolean, currentPlanKey: string | null, busy: string | null, onCheckout: (item: PricingItem) => void, onFreeStart: () => void, onOpenCancellation: () => void, onPortal: () => void) {
  if (item.planKey === "human_care" && !humanCareEnabled) return <span className="inline-flex rounded-full border border-navy/10 px-4 py-3 text-center text-sm font-bold text-navy/45">Em preparação</span>;
  if (isAuthenticated && item.planKey && item.planKey === currentPlanKey) return <button type="button" disabled aria-label={`${item.name}: plano atual`} className="inline-flex cursor-not-allowed rounded-full border border-navy/15 bg-navy/5 px-4 py-3 text-center text-sm font-bold text-navy/55">Plano atual</button>;
  if (item.planKey === "free") {
    if (isAuthenticated && currentPlanKey && currentPlanKey !== "free") return <button type="button" onClick={onOpenCancellation} className="inline-flex rounded-full border border-navy/15 px-4 py-3 text-center text-sm font-bold text-navy transition hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2">Cancelar meu plano</button>;
    return <button type="button" onClick={onFreeStart} disabled={busy === "free"} className="inline-flex rounded-full bg-navy px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy === "free" ? "Abrindo…" : "Começar grátis"}</button>;
  }
  if (item.billingType === "one_time" && (!isAuthenticated || !currentPlanKey || currentPlanKey === "free")) return <span className="inline-flex max-w-[12rem] rounded-full border border-navy/10 px-4 py-3 text-center text-sm font-bold text-navy/45">Disponível nos planos pagos</span>;
  if (isAuthenticated && currentPlanKey && currentPlanKey !== "free" && item.billingType === "recurring") return <button type="button" onClick={onPortal} disabled={busy === "portal"} className="inline-flex rounded-full bg-purple px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy === "portal" ? "Abrindo…" : "Mudar pelo portal"}</button>;
  return <button type="button" onClick={() => onCheckout(item)} disabled={busy === item.lookupKey} className="inline-flex rounded-full bg-purple px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{busy === item.lookupKey ? "Abrindo…" : item.billingType === "one_time" ? "Adicionar respostas" : isAuthenticated ? "Mudar para este plano" : "Escolher plano"}</button>;
}

export default function PricingTable({ items, humanCareEnabled, currentPlanKey, currentPeriodEnd }: { items: PricingItem[]; humanCareEnabled: boolean; currentPlanKey: string | null; currentPeriodEnd: string | null }) {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelDialogRef = useRef<HTMLDivElement>(null);
  const autoCheckoutKey = useRef<string | null>(null);

  const handleCheckout = useCallback(async (item: PricingItem) => {
    if (!session?.user?.id) {
      await signIn("google", { callbackUrl: `/planos?checkout=${encodeURIComponent(item.lookupKey)}` });
      return;
    }
    setBusy(item.lookupKey);
    setNotice("");
    try {
      const requestId = crypto.randomUUID();
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lookupKey: item.lookupKey, requestId }) });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível iniciar agora.");
      window.location.assign(data.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível iniciar agora.");
      setBusy(null);
    }
  }, [session?.user?.id]);

  const handleFreeStart = useCallback(async () => {
    if (session?.user?.id) {
      window.location.assign("/chat");
      return;
    }
    setBusy("free");
    setNotice("");
    try {
      await signIn("google", { callbackUrl: "/chat" });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível abrir o acesso gratuito agora.");
      setBusy(null);
    }
  }, [session?.user?.id]);

  const openPortal = useCallback(async () => {
    setBusy("portal");
    setNotice("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !data?.url) throw new Error(data?.error || "Não foi possível abrir o gerenciamento.");
      window.location.assign(data.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível abrir o gerenciamento.");
      setBusy(null);
    }
  }, []);

  useEffect(() => {
    if (!cancelDialogOpen) return;
    cancelDialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCancelDialogOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cancelDialogOpen]);

  const pendingCheckoutKey = searchParams.get("checkout");
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id || !currentPlanKey || !pendingCheckoutKey) return;
    const item = items.find((candidate) => candidate.lookupKey === pendingCheckoutKey);
    if (!item || item.billingType !== "recurring" || item.planKey === currentPlanKey || (item.planKey === "human_care" && !humanCareEnabled)) return;
    if (autoCheckoutKey.current === pendingCheckoutKey) return;
    autoCheckoutKey.current = pendingCheckoutKey;
    void handleCheckout(item);
  }, [currentPlanKey, handleCheckout, humanCareEnabled, items, pendingCheckoutKey, session?.user?.id, sessionStatus]);

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-[30px] border border-navy/10 bg-white shadow-xl shadow-navy/5 lg:block">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <caption className="sr-only">Comparação dos planos e do pacote adicional da EscutIA</caption>
          <thead className="bg-navy text-sm text-white">
            <tr><th scope="col" className="px-6 py-5 font-bold">Plano</th><th scope="col" className="px-6 py-5 font-bold">Preço</th><th scope="col" className="px-6 py-5 font-bold">Cobrança</th><th scope="col" className="px-6 py-5 font-bold">Respostas da IA</th><th scope="col" className="px-6 py-5 font-bold">Atendimento humano</th><th scope="col" className="px-6 py-5 font-bold">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-navy/8">
            {items.map((item) => (
              <tr key={item.lookupKey} className="align-top transition hover:bg-warm/60">
                <th scope="row" className="px-6 py-6"><p className="font-black text-navy">{item.name}</p><p className="mt-2 max-w-xs text-sm font-normal leading-6 text-navy/55">{item.description}</p></th>
                <td className="whitespace-nowrap px-6 py-6 text-lg font-black tabular-nums text-purple">{formatPrice(item.amount, item.billingType)}</td>
                <td className="px-6 py-6 text-sm text-navy/65">{item.billingType === "recurring" ? "Recorrente mensal" : "Pagamento único"}</td>
                <td className="px-6 py-6 text-sm font-semibold text-navy/75">{item.monthlyAiResponses ? `${item.monthlyAiResponses} por mês` : "100 adicionais"}</td>
                <td className="px-6 py-6 text-sm text-navy/65">{item.includesHumanSession ? `${item.humanSessionsPerMonth} sessão online/mês` : "Não incluído"}</td>
                <td className="px-6 py-6">{planAction(item, humanCareEnabled, sessionStatus === "authenticated", currentPlanKey, busy, handleCheckout, handleFreeStart, () => setCancelDialogOpen(true), openPortal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:hidden">
        {items.map((item) => (
          <article key={item.lookupKey} className="rounded-[26px] border border-navy/10 bg-white p-6 shadow-lg shadow-navy/5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-navy">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-navy/55">{item.description}</p>
              </div>
              <p className="shrink-0 text-right text-lg font-black tabular-nums text-purple">{formatPrice(item.amount, item.billingType)}</p>
            </div>
            <dl className="mt-5 grid gap-3 border-y border-navy/8 py-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-navy/50">Cobrança</dt><dd className="text-right font-semibold text-navy/75">{item.billingType === "recurring" ? "Mensal" : "Pagamento único"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-navy/50">Respostas da IA</dt><dd className="text-right font-semibold text-navy/75">{item.monthlyAiResponses ? `${item.monthlyAiResponses} por mês` : "100 adicionais"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-navy/50">Atendimento humano</dt><dd className="text-right font-semibold text-navy/75">{item.includesHumanSession ? `${item.humanSessionsPerMonth} sessão/mês` : "Não incluído"}</dd></div>
            </dl>
            <div className="mt-5">{planAction(item, humanCareEnabled, sessionStatus === "authenticated", currentPlanKey, busy, handleCheckout, handleFreeStart, () => setCancelDialogOpen(true), openPortal)}</div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-navy/55 sm:flex-row sm:justify-between"><p>O pacote adicional vale somente até o fim do ciclo mensal vigente e não é renovado automaticamente.</p><p className="lg:hidden">Na versão para celular, os detalhes aparecem em cartões.</p><p className="hidden lg:block">A tabela reúne todos os detalhes para comparação.</p></div>
      {notice && <p role="alert" aria-live="polite" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{notice}</p>}
      {cancelDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-navy/45 p-5" role="presentation"><div ref={cancelDialogRef} role="dialog" aria-modal="true" aria-labelledby="cancel-plan-title" aria-describedby="cancel-plan-description" tabIndex={-1} className="w-full max-w-xl rounded-[30px] border border-white/60 bg-white p-7 text-navy shadow-2xl shadow-navy/25 focus-visible:outline-none sm:p-9"><p className="eyebrow">antes de continuar</p><h2 id="cancel-plan-title" className="mt-3 text-3xl font-black tracking-[-0.04em] [text-wrap:balance]">Cancelar meu plano</h2><div id="cancel-plan-description" className="mt-6 space-y-4 text-sm leading-7 text-navy/70"><p>O cancelamento será confirmado no portal seguro da Stripe, onde você verá a ação final antes de concluí-la.</p><p>{currentPeriodEnd ? <>O cancelamento está configurado para o fim do ciclo atual, em <strong className="text-navy">{formatPeriodEnd(currentPeriodEnd)}</strong>. Você continua com acesso ao plano até essa data e a assinatura não será renovada depois dela.</> : <>O portal mostrará a data exata do fim do ciclo. Você continua com acesso ao plano até essa data e a assinatura não será renovada depois dela.</>}</p><p>O período já pago não é reembolsado automaticamente. Se houver uma fatura pendente ou uma cobrança já iniciada, ela poderá continuar disponível para pagamento no portal.</p></div><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setCancelDialogOpen(false)} className="inline-flex justify-center rounded-full border border-navy/15 px-5 py-3 text-sm font-bold text-navy transition hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2">Voltar</button><button type="button" onClick={() => { setCancelDialogOpen(false); void openPortal(); }} className="inline-flex justify-center rounded-full bg-purple px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2">Continuar para a Stripe</button></div></div></div>}
    </div>
  );
}
