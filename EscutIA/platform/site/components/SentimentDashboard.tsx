"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { SentimentDashboardSummary } from "@/lib/sentiment-dashboard";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

const SENTIMENT_COPY: Record<SentimentLabel, { label: string; color: string; soft: string }> = {
  positivo: { label: "Bem", color: "#4f9f79", soft: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  neutro: { label: "Neutro", color: "#d49b48", soft: "bg-amber-50 text-amber-700 border-amber-200" },
  negativo: { label: "Ruim", color: "#d56f6f", soft: "bg-rose-50 text-rose-700 border-rose-200" },
};

const TODAY = new Date();
const TODAY_VALUE = [TODAY.getFullYear(), String(TODAY.getMonth() + 1).padStart(2, "0"), String(TODAY.getDate()).padStart(2, "0")].join("-");

function formatLongDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function Chart({ summary, selected }: { summary: SentimentDashboardSummary; selected: SentimentLabel[] }) {
  const maxValue = Math.max(1, ...summary.points.map((point) => Math.max(...selected.map((sentiment) => point[sentiment]))));
  const labelEvery = summary.points.length > 22 ? 4 : summary.points.length > 14 ? 2 : 1;

  return (
    <div className="mt-8" role="img" aria-label={`Gráfico de sentimentos entre ${formatLongDate(summary.from)} e ${formatLongDate(summary.to)}`}>
      <div className="relative h-[280px] border-b border-navy/10 pl-8">
        <div className="pointer-events-none absolute inset-0 left-8 flex flex-col justify-between pb-0 pt-1" aria-hidden="true">
          {[maxValue, Math.ceil(maxValue / 2), 0].map((value, index) => <div key={`${value}-${index}`} className="flex items-center gap-3"><span className="-ml-8 w-5 text-right text-[0.65rem] font-bold tabular-nums text-navy/30">{value}</span><span className="h-px flex-1 border-t border-dashed border-navy/8" /></div>)}
        </div>
        <div className="absolute inset-x-0 bottom-0 left-8 top-2 flex items-end gap-1.5 overflow-hidden sm:gap-2">
          {summary.points.map((point, index) => (
            <div key={point.date} className="group flex min-w-[1.1rem] flex-1 flex-col items-center justify-end gap-2 sm:min-w-[1.5rem]">
              <div className="flex h-[248px] w-full items-end justify-center gap-0.5 sm:gap-1">
                {selected.map((sentiment) => {
                  const value = point[sentiment];
                  return <div key={sentiment} className="relative min-w-0 flex-1 rounded-t-[5px] transition-[height,filter] duration-300 group-hover:brightness-90 motion-reduce:transition-none" style={{ height: `${value ? Math.max(5, (value / maxValue) * 100) : 0}%`, backgroundColor: SENTIMENT_COPY[sentiment].color }} title={`${SENTIMENT_COPY[sentiment].label}: ${value} em ${point.label}`} aria-label={`${SENTIMENT_COPY[sentiment].label}: ${value}`} />;
                })}
              </div>
              {index % labelEvery === 0 ? <span className="truncate text-[0.65rem] font-bold text-navy/35">{point.label}</span> : <span className="h-[0.975rem]" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda do gráfico">
        {selected.map((sentiment) => <span key={sentiment} className="inline-flex items-center gap-2 text-xs font-bold text-navy/60"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: SENTIMENT_COPY[sentiment].color }} />{SENTIMENT_COPY[sentiment].label}</span>)}
      </div>
    </div>
  );
}

export default function SentimentDashboard({ initialSummary }: { initialSummary: SentimentDashboardSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [from, setFrom] = useState(initialSummary.from);
  const [to, setTo] = useState(initialSummary.to);
  const [selected, setSelected] = useState<SentimentLabel[]>([...SENTIMENT_LABELS]);
  const [notice, setNotice] = useState("");
  const [isPending, setIsPending] = useState(false);

  const todayPoint = useMemo(() => summary.points.find((point) => point.date === TODAY_VALUE), [summary.points]);
  const todayTotal = todayPoint?.total || 0;

  function toggleSentiment(sentiment: SentimentLabel) {
    setSelected((current) => current.includes(sentiment) ? current.filter((item) => item !== sentiment) : [...current, sentiment]);
  }

  function applyFilters() {
    if (!from || !to || from > to || selected.length === 0) {
      setNotice("Escolha um período válido e pelo menos um sentimento.");
      return;
    }
    setIsPending(true);
    void (async () => {
      try {
        const query = `from=${from}&to=${to}&sentiments=${selected.join(",")}`;
        window.history.replaceState(null, "", `/dashboard?${query}`);
        const response = await fetch(`/api/sentiment/summary?${query}`);
        const data = (await response.json()) as SentimentDashboardSummary & { error?: string };
        if (!response.ok || !data.points) throw new Error(data.error || "Não foi possível atualizar os dados.");
        setSummary(data);
        setNotice("Visão atualizada.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Não foi possível atualizar os dados.");
      } finally {
        setIsPending(false);
      }
    })();
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">visão geral</p><h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-navy sm:text-6xl">Como você está?</h1><p className="mt-3 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Observe seus sentimentos ao longo do tempo. Não é uma nota — é um jeito gentil de perceber seus padrões.</p></div>
        <div className="hidden rounded-2xl border border-purple/10 bg-white/75 px-4 py-3 text-right shadow-sm sm:block"><p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-navy/40">registros no período</p><p className="mt-1 text-2xl font-black tracking-[-0.05em] text-purple">{summary.total}</p></div>
      </header>

      <section aria-labelledby="filters-title" className="mt-9 rounded-[1.75rem] border border-navy/8 bg-white/80 p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 id="filters-title" className="text-sm font-black text-navy">Ajuste sua visão</h2><p className="mt-1 text-xs text-navy/45">Escolha os dias e os sentimentos que quer comparar.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div><label htmlFor="dashboard-from" className="mb-1.5 block text-xs font-bold text-navy/50">De</label><input id="dashboard-from" name="from" type="date" autoComplete="off" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-navy/10 bg-warm/55 px-3 py-2.5 text-sm font-bold text-navy outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/15" /></div><div><label htmlFor="dashboard-to" className="mb-1.5 block text-xs font-bold text-navy/50">Até</label><input id="dashboard-to" name="to" type="date" autoComplete="off" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-navy/10 bg-warm/55 px-3 py-2.5 text-sm font-bold text-navy outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/15" /></div><button type="button" onClick={applyFilters} disabled={isPending} className="h-[42px] rounded-xl bg-navy px-5 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-wait disabled:opacity-60">{isPending ? "Atualizando…" : "Aplicar"}</button></div></div>
        <fieldset className="mt-6 border-t border-navy/8 pt-5"><legend className="text-xs font-bold text-navy/50">Sentimentos para comparar</legend><div className="mt-3 flex flex-wrap gap-2">{SENTIMENT_LABELS.map((sentiment) => { const active = selected.includes(sentiment); return <button key={sentiment} type="button" aria-pressed={active} onClick={() => toggleSentiment(sentiment)} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 ${active ? SENTIMENT_COPY[sentiment].soft : "border-navy/10 bg-white text-navy/35"}`}><span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? SENTIMENT_COPY[sentiment].color : "#aeb0bb" }} />{SENTIMENT_COPY[sentiment].label}</button>; })}</div></fieldset>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="Resumo dos sentimentos">
        {SENTIMENT_LABELS.map((sentiment) => <div key={sentiment} className="rounded-2xl border border-navy/8 bg-white/65 p-5"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-navy/55">{SENTIMENT_COPY[sentiment].label}</span><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COPY[sentiment].color }} /></div><p className="mt-4 text-3xl font-black tracking-[-0.06em] text-navy">{summary.counts[sentiment]}</p><p className="mt-1 text-xs text-navy/40">registros no período</p></div>)}
      </section>

      <section aria-labelledby="chart-title" className="mt-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-8"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-[0.68rem]">seu ritmo</p><h2 id="chart-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Sentimentos por dia</h2></div><p className="text-xs font-bold text-navy/40 sm:text-right">{formatLongDate(summary.from)}<br className="sm:hidden" /> até {formatLongDate(summary.to)}</p></div>{summary.total ? <Chart summary={summary} selected={selected} /> : <div className="mt-8 grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-navy/12 bg-warm/40 px-6 text-center"><div><p className="text-sm font-black text-navy/70">Ainda não há registros nesse recorte.</p><p className="mt-2 max-w-sm text-sm leading-6 text-navy/45">Tente ampliar o período ou registre como você está se sentindo hoje.</p></div></div>}<p className="mt-6 text-xs leading-5 text-navy/40" aria-live="polite">{notice || "Os registros são privados e servem apenas para você acompanhar seu momento."}</p></section>

      <section aria-labelledby="today-title" className="mt-5 grid gap-5 rounded-[1.75rem] border border-purple/10 bg-purple/[0.045] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div><p className="eyebrow text-[0.68rem]">agora</p><h2 id="today-title" className="mt-2 text-xl font-black tracking-[-0.04em] text-navy">Seu retrato de hoje</h2><p className="mt-2 text-sm leading-6 text-navy/55">{todayTotal ? `Você registrou ${todayTotal} ${todayTotal === 1 ? "sentimento" : "sentimentos"} hoje.` : "Você ainda não registrou um sentimento hoje."}</p></div><Link href="/chat" className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Conversar com a EscutIA</Link></section>
    </div>
  );
}
