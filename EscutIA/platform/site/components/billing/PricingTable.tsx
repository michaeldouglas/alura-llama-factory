"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

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

function planAction(item: PricingItem, humanCareEnabled: boolean, busy: string | null, onCheckout: (item: PricingItem) => void) {
  if (item.planKey === "human_care" && !humanCareEnabled) return <span className="inline-flex rounded-full border border-navy/10 px-4 py-3 text-center text-sm font-bold text-navy/45">Em preparação</span>;
  if (item.planKey === "free") return <a href="/chat" className="inline-flex rounded-full bg-navy px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-purple">Começar grátis</a>;
  return <button type="button" onClick={() => onCheckout(item)} disabled={busy === item.lookupKey} className="inline-flex rounded-full bg-purple px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-navy disabled:cursor-wait disabled:opacity-60">{busy === item.lookupKey ? "Abrindo…" : item.billingType === "one_time" ? "Adicionar respostas" : "Escolher plano"}</button>;
}

export default function PricingTable({ items, humanCareEnabled }: { items: PricingItem[]; humanCareEnabled: boolean }) {
  const { data: session } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function handleCheckout(item: PricingItem) {
    if (!session?.user?.id) {
      await signIn("google", { callbackUrl: "/planos" });
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
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-[30px] border border-navy/10 bg-white shadow-xl shadow-navy/5">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <caption className="sr-only">Comparação dos planos e do pacote adicional da EscutIA</caption>
          <thead className="bg-navy text-sm text-white">
            <tr><th scope="col" className="px-6 py-5 font-bold">Plano</th><th scope="col" className="px-6 py-5 font-bold">Preço</th><th scope="col" className="px-6 py-5 font-bold">Cobrança</th><th scope="col" className="px-6 py-5 font-bold">Respostas da IA</th><th scope="col" className="px-6 py-5 font-bold">Atendimento humano</th><th scope="col" className="px-6 py-5 font-bold">Ação</th></tr>
          </thead>
          <tbody className="divide-y divide-navy/8">
            {items.map((item) => (
              <tr key={item.lookupKey} className="align-top transition hover:bg-warm/60">
                <th scope="row" className="px-6 py-6"><p className="font-black text-navy">{item.name}</p><p className="mt-2 max-w-xs text-sm font-normal leading-6 text-navy/55">{item.description}</p></th>
                <td className="whitespace-nowrap px-6 py-6 text-lg font-black text-purple">{formatPrice(item.amount, item.billingType)}</td>
                <td className="px-6 py-6 text-sm text-navy/65">{item.billingType === "recurring" ? "Recorrente mensal" : "Pagamento único"}</td>
                <td className="px-6 py-6 text-sm font-semibold text-navy/75">{item.monthlyAiResponses ? `${item.monthlyAiResponses} por mês` : "100 adicionais"}</td>
                <td className="px-6 py-6 text-sm text-navy/65">{item.includesHumanSession ? `${item.humanSessionsPerMonth} sessão online/mês` : "Não incluído"}</td>
                <td className="px-6 py-6">{planAction(item, humanCareEnabled, busy, handleCheckout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-navy/55 sm:flex-row sm:justify-between"><p>O pacote adicional vale somente até o fim do ciclo mensal vigente e não é renovado automaticamente.</p><p>Role horizontalmente para comparar todos os detalhes.</p></div>
      {notice && <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{notice}</p>}
    </div>
  );
}
