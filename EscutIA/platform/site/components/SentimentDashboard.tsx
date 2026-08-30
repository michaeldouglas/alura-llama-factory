"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { SentimentDashboardSummary, SentimentRecordItem } from "@/lib/sentiment-dashboard";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

const SENTIMENT_COPY: Record<SentimentLabel, { label: string; color: string; soft: string; marker: string }> = {
  positivo: { label: "Bem", color: "#4f9f79", soft: "bg-emerald-50 text-emerald-700 border-emerald-200", marker: "●" },
  neutro: { label: "Neutro", color: "#d49b48", soft: "bg-amber-50 text-amber-700 border-amber-200", marker: "◆" },
  negativo: { label: "Ruim", color: "#d56f6f", soft: "bg-rose-50 text-rose-700 border-rose-200", marker: "■" },
};

type RecordsPayload = {
  records: SentimentRecordItem[];
  page: number;
  hasMore: boolean;
  total: number;
};

type SentimentDashboardProps = {
  initialSummary: SentimentDashboardSummary;
  initialSelected?: SentimentLabel[];
  initialRecords: RecordsPayload;
};

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(dateFromKey(value));
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function makeQuery(from: string, to: string, selected: SentimentLabel[], page?: number) {
  const params = new URLSearchParams({ from, to, sentiments: selected.join(",") });
  if (page) params.set("page", String(page));
  return params.toString();
}

function mostRegisteredLabel(sentiment: SentimentLabel | null, total: number) {
  if (!total) return "Ainda sem registros";
  return sentiment ? SENTIMENT_COPY[sentiment].label : "Empate entre sentimentos";
}

function pointDominant(point: SentimentDashboardSummary["points"][number]): SentimentLabel | null {
  if (!point.total) return null;
  const values = SENTIMENT_LABELS.map((sentiment) => point[sentiment]);
  const max = Math.max(...values);
  const leaders = SENTIMENT_LABELS.filter((sentiment) => point[sentiment] === max);
  return leaders.length === 1 ? leaders[0] : null;
}

function deltaCopy(delta: number, noun: string) {
  if (delta === 0) return `Mesmo número de ${noun} no período anterior equivalente.`;
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${noun} em relação ao período anterior equivalente.`;
}

function QuantityChart({ summary, selected }: { summary: SentimentDashboardSummary; selected: SentimentLabel[] }) {
  const maxValue = Math.max(1, ...summary.points.map((point) => Math.max(...selected.map((sentiment) => point[sentiment]))));
  const labelEvery = summary.points.length > 22 ? 4 : summary.points.length > 14 ? 2 : 1;

  return (
    <div className="mt-8" role="img" aria-label={`Quantidade de registros por sentimento entre ${formatLongDate(summary.from)} e ${formatLongDate(summary.to)}`}>
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
                  return <div key={sentiment} className="relative min-w-0 flex-1 origin-bottom scale-y-0 rounded-t-[5px] transition-[filter,transform] duration-300 group-hover:brightness-90 motion-reduce:transition-none" style={{ transform: value ? `scaleY(${Math.max(0.02, value / maxValue)})` : "scaleY(0)", backgroundColor: SENTIMENT_COPY[sentiment].color }} title={`${SENTIMENT_COPY[sentiment].label}: ${value} em ${point.label}`} aria-label={`${SENTIMENT_COPY[sentiment].label}: ${value}`} />;
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

function EvolutionChart({ summary, selected }: { summary: SentimentDashboardSummary; selected: SentimentLabel[] }) {
  const plottedPoints = summary.points.map((point, index) => {
    if (!point.total) return null;
    const weightedPosition = (point.negativo * 0.18 + point.neutro * 0.5 + point.positivo * 0.82) / point.total;
    return { point, index, x: 36 + (index * 704) / Math.max(1, summary.points.length - 1), y: 220 - weightedPosition * 180 };
  }).filter((item): item is { point: SentimentDashboardSummary["points"][number]; index: number; x: number; y: number } => Boolean(item));
  const labelEvery = summary.points.length > 22 ? 4 : summary.points.length > 14 ? 2 : 1;

  return (
    <div className="mt-8" role="img" aria-label={`Evolução cronológica dos registros entre ${formatLongDate(summary.from)} e ${formatLongDate(summary.to)}. A posição vertical é apenas uma convenção visual para organizar os sentimentos.`}>
      <div className="relative overflow-hidden rounded-2xl border border-navy/8 bg-warm/35 p-3 sm:p-5">
        <div className="mb-2 flex justify-between pl-1 text-[0.65rem] font-bold text-navy/45"><span>Bem</span><span>Neutro</span><span>Ruim</span></div>
        <svg viewBox="0 0 760 260" className="h-[260px] w-full" aria-hidden="true">
          {[40, 130, 220].map((y) => <line key={y} x1="36" x2="740" y1={y} y2={y} stroke="currentColor" strokeDasharray="3 6" className="text-navy/10" />)}
          {plottedPoints.slice(1).map((item, index) => {
            const previous = plottedPoints[index];
            return <line key={`${previous.point.date}-${item.point.date}`} x1={previous.x} x2={item.x} y1={previous.y} y2={item.y} stroke="#5c4dff" strokeLinecap="round" strokeWidth="3" className="opacity-55" />;
          })}
          {plottedPoints.map(({ point, x, y }) => { const dominant = pointDominant(point); return <circle key={point.date} cx={x} cy={y} r="5" fill={dominant ? SENTIMENT_COPY[dominant].color : SENTIMENT_COPY.neutro.color} stroke="white" strokeWidth="3"><title>{point.label}: {point.total} {point.total === 1 ? "registro" : "registros"}{dominant ? ` — ${SENTIMENT_COPY[dominant].label}` : " — empate entre sentimentos"}</title></circle>; })}
          {summary.points.map((point, index) => index % labelEvery === 0 ? <text key={point.date} x={36 + (index * 704) / Math.max(1, summary.points.length - 1)} y="248" textAnchor="middle" className="fill-navy/40 text-[10px] font-bold">{point.label}</text> : null)}
        </svg>
      </div>
      <p className="mt-3 text-xs leading-5 text-navy/45">A linha organiza visualmente os registros ao longo dos dias. Ela não é uma nota emocional nem uma avaliação clínica.</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda da evolução">
        {selected.map((sentiment) => <span key={sentiment} className="inline-flex items-center gap-2 text-xs font-bold text-navy/60"><span aria-hidden="true" className="text-[0.65rem]" style={{ color: SENTIMENT_COPY[sentiment].color }}>{SENTIMENT_COPY[sentiment].marker}</span>{SENTIMENT_COPY[sentiment].label}</span>)}
      </div>
    </div>
  );
}

function SummaryCard({ sentiment, count, percentage }: { sentiment: SentimentLabel; count: number; percentage: number }) {
  const copy = SENTIMENT_COPY[sentiment];
  return <div className="rounded-2xl border border-navy/8 bg-white/65 p-5"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-navy/55">{copy.label}</span><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: copy.color }} /></div><p className="mt-4 text-3xl font-black tracking-[-0.06em] text-navy">{count}</p><p className="mt-1 text-xs text-navy/40">{percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% dos registros</p></div>;
}

function CheckIn({ onSaved, disabled }: { onSaved: (message: string) => Promise<void>; disabled: boolean }) {
  const [sentiment, setSentiment] = useState<SentimentLabel | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function save() {
    if (!sentiment || pending || disabled) return;
    setPending(true);
    setSuccess(false);
    try {
      const response = await fetch("/api/sentiment/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sentiment, note }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar o check-in.");
      setNote("");
      setSentiment(null);
      setSuccess(true);
      await onSaved("Check-in manual salvo. A visão do período foi atualizada.");
    } catch (error) {
      await onSaved(error instanceof Error ? error.message : "Não foi possível salvar o check-in.");
    } finally {
      setPending(false);
    }
  }

  return <section aria-labelledby="check-in-title" className="mt-5 rounded-[1.75rem] border border-purple/10 bg-purple/[0.045] p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow text-[0.68rem]">um registro rápido</p><h2 id="check-in-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Como você está agora?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-navy/55">Escolha uma opção e, se quiser, deixe um relato curto. Esta escolha é registrada como check-in manual; ela não passa pelo classificador.</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="Escolha seu sentimento atual">{SENTIMENT_LABELS.map((item) => { const active = sentiment === item; return <button key={item} type="button" aria-pressed={active} onClick={() => setSentiment(item)} disabled={pending || disabled} className={`rounded-full border px-4 py-2.5 text-xs font-black transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transform-none motion-reduce:transition-none ${active ? SENTIMENT_COPY[item].soft : "border-navy/10 bg-white text-navy/55 hover:border-purple/30 hover:text-purple"}`}>{SENTIMENT_COPY[item].label}</button>; })}</div></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><label htmlFor="manual-check-in-note" className="mb-1.5 block text-xs font-bold text-navy/50">Relato opcional</label><textarea id="manual-check-in-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2} placeholder="Se quiser, escreva algumas palavras…" className="w-full resize-none rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm leading-6 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus:ring-2 focus:ring-purple/15" /></div><button type="button" onClick={() => void save()} disabled={!sentiment || pending || disabled} className="inline-flex h-[46px] shrink-0 items-center justify-center rounded-xl bg-navy px-5 text-sm font-bold text-white transition-[background-color,transform] hover:bg-purple active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none">{pending ? "Salvando…" : "Salvar check-in"}</button></div>{success ? <p className="mt-3 text-sm font-bold text-emerald-700" role="status" aria-live="polite">✓ Seu check-in foi salvo e os dados foram atualizados.</p> : null}</section>;
}

export default function SentimentDashboard({ initialSummary, initialSelected = [...SENTIMENT_LABELS], initialRecords }: SentimentDashboardProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [from, setFrom] = useState(initialSummary.from);
  const [to, setTo] = useState(initialSummary.to);
  const [selected, setSelected] = useState<SentimentLabel[]>(initialSelected);
  const [view, setView] = useState<"quantity" | "evolution">("quantity");
  const [notice, setNotice] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [records, setRecords] = useState(initialRecords.records);
  const [recordsTotal, setRecordsTotal] = useState(initialRecords.total);
  const [recordsPage, setRecordsPage] = useState(initialRecords.page);
  const [recordsHasMore, setRecordsHasMore] = useState(initialRecords.hasMore);
  const [recordsPending, setRecordsPending] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(initialSummary.from.slice(0, 7));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedDayRecords, setSelectedDayRecords] = useState<SentimentRecordItem[]>([]);
  const [selectedDayPending, setSelectedDayPending] = useState(false);

  const availableMonths = useMemo(() => Array.from(new Set(summary.calendar.map((day) => day.date.slice(0, 7)))), [summary.calendar]);
  const calendarByDate = useMemo(() => new Map(summary.calendar.map((day) => [day.date, day])), [summary.calendar]);
  const calendarCells = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => `${calendarMonth}-${String(index + 1).padStart(2, "0")}`)];
  }, [calendarMonth]);

  useEffect(() => {
    if (!availableMonths.includes(calendarMonth)) setCalendarMonth(availableMonths[0] || initialSummary.from.slice(0, 7));
  }, [availableMonths, calendarMonth, initialSummary.from]);

  async function loadDashboard(nextSelected = selected, message?: string) {
    const query = makeQuery(from, to, nextSelected);
    const [summaryResponse, recordsResponse] = await Promise.all([fetch(`/api/sentiment/summary?${query}`), fetch(`/api/sentiment/records?${query}`)]);
    const summaryData = await summaryResponse.json() as SentimentDashboardSummary & { error?: string };
    const recordsData = await recordsResponse.json() as RecordsPayload & { error?: string };
    if (!summaryResponse.ok || !summaryData.points) throw new Error(summaryData.error || "Não foi possível atualizar o dashboard.");
    if (!recordsResponse.ok || !recordsData.records) throw new Error(recordsData.error || "Não foi possível atualizar o histórico.");
    setSummary(summaryData);
    setRecords(recordsData.records);
    setRecordsTotal(recordsData.total);
    setRecordsPage(recordsData.page);
    setRecordsHasMore(recordsData.hasMore);
    if (message) setNotice(message);
  }

  async function applyFilters() {
    if (!from || !to || from > to || selected.length === 0) {
      setNotice("Escolha um período válido e pelo menos um sentimento.");
      return;
    }
    setIsPending(true);
    try {
      window.history.replaceState(null, "", `/dashboard?${makeQuery(from, to, selected)}`);
      await loadDashboard(selected, "Visão atualizada para os filtros escolhidos.");
      setSelectedCalendarDate(null);
      setSelectedDayRecords([]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o dashboard.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleCheckInSaved(message: string) {
    try {
      await loadDashboard(selected, message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : message);
    }
  }

  async function loadMoreRecords() {
    if (recordsPending || !recordsHasMore) return;
    setRecordsPending(true);
    try {
      const response = await fetch(`/api/sentiment/records?${makeQuery(from, to, selected, recordsPage + 1)}`);
      const data = await response.json() as RecordsPayload & { error?: string };
      if (!response.ok || !data.records) throw new Error(data.error || "Não foi possível carregar mais registros.");
      setRecords((current) => [...current, ...data.records]);
      setRecordsTotal(data.total);
      setRecordsPage(data.page);
      setRecordsHasMore(data.hasMore);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar mais registros.");
    } finally {
      setRecordsPending(false);
    }
  }

  async function selectCalendarDay(date: string) {
    setSelectedCalendarDate(date);
    setSelectedDayPending(true);
    try {
      const response = await fetch(`/api/sentiment/records?${makeQuery(date, date, selected)}`);
      const data = await response.json() as RecordsPayload & { error?: string };
      if (!response.ok || !data.records) throw new Error(data.error || "Não foi possível abrir os registros do dia.");
      setSelectedDayRecords(data.records);
    } catch (error) {
      setSelectedDayRecords([]);
      setNotice(error instanceof Error ? error.message : "Não foi possível abrir os registros do dia.");
    } finally {
      setSelectedDayPending(false);
    }
  }

  function startEdit(record: SentimentRecordItem) {
    setEditingRecordId(record.id);
    setEditingNote(record.note || "");
  }

  async function saveEdit(recordId: string) {
    try {
      const response = await fetch(`/api/sentiment/records/${recordId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: editingNote }) });
      const data = await response.json() as { record?: SentimentRecordItem; error?: string };
      if (!response.ok || !data.record) throw new Error(data.error || "Não foi possível atualizar o relato.");
      setRecords((current) => current.map((record) => record.id === recordId ? data.record as SentimentRecordItem : record));
      setSelectedDayRecords((current) => current.map((record) => record.id === recordId ? data.record as SentimentRecordItem : record));
      setEditingRecordId(null);
      setEditingNote("");
      setNotice("Relato atualizado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o relato.");
    }
  }

  async function deleteRecord(record: SentimentRecordItem) {
    if (!window.confirm("Excluir este registro? Essa ação não poderá ser desfeita.")) return;
    try {
      const response = await fetch(`/api/sentiment/records/${record.id}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir o registro.");
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setSelectedDayRecords((current) => current.filter((item) => item.id !== record.id));
      await loadDashboard(selected, "Registro excluído. A visão do período foi atualizada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível excluir o registro.");
    }
  }

  const comparison = summary.comparison;
  const totalDeltaPrefix = comparison.totalDelta > 0 ? "+" : comparison.totalDelta < 0 ? "−" : "";

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">visão geral</p><h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-navy sm:text-6xl">Como você está?</h1><p className="mt-3 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Seus registros ajudam a observar o que apareceu ao longo dos dias. Eles não são uma nota nem uma avaliação clínica.</p></div><div className="hidden rounded-2xl border border-purple/10 bg-white/75 px-4 py-3 text-right shadow-sm sm:block"><p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-navy/40">registros no período</p><p className="mt-1 text-2xl font-black tracking-[-0.05em] text-purple">{summary.total}</p></div></header>

      <section aria-labelledby="filters-title" className="mt-9 rounded-[1.75rem] border border-navy/8 bg-white/80 p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 id="filters-title" className="text-sm font-black text-navy">Ajuste sua visão</h2><p className="mt-1 text-xs text-navy/45">Escolha os dias e os sentimentos que quer comparar.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div><label htmlFor="dashboard-from" className="mb-1.5 block text-xs font-bold text-navy/50">De</label><input id="dashboard-from" name="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-navy/10 bg-warm/55 px-3 py-2.5 text-sm font-bold text-navy outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/15" /></div><div><label htmlFor="dashboard-to" className="mb-1.5 block text-xs font-bold text-navy/50">Até</label><input id="dashboard-to" name="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-navy/10 bg-warm/55 px-3 py-2.5 text-sm font-bold text-navy outline-none transition-colors focus:border-purple focus:ring-2 focus:ring-purple/15" /></div><button type="button" onClick={() => void applyFilters()} disabled={isPending} aria-busy={isPending} className="h-[42px] rounded-xl bg-navy px-5 text-sm font-bold text-white transition-[background-color,transform] hover:bg-purple active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">{isPending ? "Atualizando…" : "Aplicar"}</button></div></div><fieldset className="mt-6 border-t border-navy/8 pt-5"><legend className="text-xs font-bold text-navy/50">Sentimentos para comparar</legend><div className="mt-3 flex flex-wrap gap-2">{SENTIMENT_LABELS.map((sentiment) => { const active = selected.includes(sentiment); return <button key={sentiment} type="button" aria-pressed={active} onClick={() => setSelected((current) => active ? current.filter((item) => item !== sentiment) : [...current, sentiment])} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transform-none motion-reduce:transition-none ${active ? SENTIMENT_COPY[sentiment].soft : "border-navy/10 bg-white text-navy/35"}`}><span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? SENTIMENT_COPY[sentiment].color : "#aeb0bb" }} />{SENTIMENT_COPY[sentiment].label}</button>; })}</div></fieldset></section>

      <CheckIn onSaved={handleCheckInSaved} disabled={isPending} />

      <section aria-labelledby="period-summary-title" className="mt-5 rounded-[1.75rem] border border-navy/8 bg-white/75 p-5 sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[0.68rem]">leitura cuidadosa</p><h2 id="period-summary-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Resumo do período</h2></div><p className="text-xs font-bold text-navy/40 sm:text-right">{formatLongDate(summary.from)}<br className="sm:hidden" /> até {formatLongDate(summary.to)}</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-warm/70 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/40">mais registrado</p><p className="mt-3 text-xl font-black text-navy">{mostRegisteredLabel(summary.mostRegistered, summary.total)}</p><p className="mt-1 text-xs leading-5 text-navy/45">Empates são mantidos sem escolher um sentimento.</p></div><div className="rounded-2xl bg-warm/70 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/40">dias com registro</p><p className="mt-3 text-3xl font-black text-navy">{summary.daysWithRecords}</p><p className="mt-1 text-xs leading-5 text-navy/45">de {summary.durationDays} dias no recorte</p></div><div className="rounded-2xl bg-warm/70 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/40">registros</p><p className="mt-3 text-3xl font-black text-navy">{summary.total}</p><p className="mt-1 text-xs leading-5 text-navy/45">no período escolhido</p></div><div className="rounded-2xl bg-warm/70 p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/40">período anterior</p><p className="mt-3 text-xl font-black text-navy">{comparison.total} registros</p><p className="mt-1 text-xs leading-5 text-navy/45">mesma duração: {formatLongDate(comparison.from)} a {formatLongDate(comparison.to)}</p></div></div><div className="mt-5 rounded-2xl border border-purple/10 bg-purple/[0.04] p-5"><p className="text-sm font-black text-navy">Comparação com o período anterior equivalente</p><div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-navy/60 sm:flex-row sm:flex-wrap sm:gap-x-7"><span>{deltaCopy(comparison.totalDelta, comparison.totalDelta === 1 || comparison.totalDelta === -1 ? "registro" : "registros")}</span><span>{deltaCopy(comparison.daysDelta, comparison.daysDelta === 1 || comparison.daysDelta === -1 ? "dia com registro" : "dias com registro")}</span></div><p className="mt-3 text-xs leading-5 text-navy/45">{comparison.totalDeltaPercent === null ? "A variação percentual dos registros não é exibida porque o período anterior não tem registros suficientes para essa conta." : `Variação dos registros: ${totalDeltaPrefix}${Math.abs(comparison.totalDeltaPercent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%.`}</p></div></section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="Resumo dos sentimentos">{SENTIMENT_LABELS.map((sentiment) => <SummaryCard key={sentiment} sentiment={sentiment} count={summary.counts[sentiment]} percentage={summary.percentages[sentiment]} />)}</section>

      <section aria-labelledby="chart-title" aria-busy={isPending} className="mt-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-[0.68rem]">seu ritmo</p><h2 id="chart-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Registros por dia</h2><p className="mt-2 max-w-xl text-sm leading-6 text-navy/50">Escolha a forma de observar os mesmos dados. A evolução usa apenas uma posição visual para organizar os sentimentos.</p></div><div className="inline-flex rounded-xl border border-navy/10 bg-warm/60 p-1" role="group" aria-label="Modo de visualização do gráfico"><button type="button" aria-pressed={view === "evolution"} onClick={() => setView("evolution")} className={`rounded-lg px-3 py-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 ${view === "evolution" ? "bg-white text-purple shadow-sm" : "text-navy/45 hover:text-navy"}`}>Evolução</button><button type="button" aria-pressed={view === "quantity"} onClick={() => setView("quantity")} className={`rounded-lg px-3 py-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 ${view === "quantity" ? "bg-white text-purple shadow-sm" : "text-navy/45 hover:text-navy"}`}>Quantidade</button></div></div>{summary.total ? (view === "quantity" ? <QuantityChart summary={summary} selected={selected} /> : <EvolutionChart summary={summary} selected={selected} />) : <div className="mt-8 grid min-h-[280px] place-items-center rounded-2xl border border-dashed border-navy/12 bg-warm/40 px-6 text-center"><div><p className="text-sm font-black text-navy/70">Ainda não há registros neste período.</p><p className="mt-2 max-w-sm text-sm leading-6 text-navy/45">Use o check-in acima para criar seu primeiro registro, escolhendo Ruim, Neutro ou Bem. O relato é opcional.</p></div></div>}<p className="mt-6 text-xs leading-5 text-navy/40" aria-live="polite">{notice || "Seus registros são privados e servem apenas para você acompanhar o padrão observado neste período."}</p></section>

      <section aria-labelledby="calendar-title" className="mt-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="eyebrow text-[0.68rem]">visão mensal</p><h2 id="calendar-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Calendário de registros</h2><p className="mt-2 text-sm leading-6 text-navy/50">Selecione um dia para abrir os registros daquele recorte.</p></div><div className="flex items-center justify-between gap-3 sm:justify-end"><button type="button" aria-label="Mês anterior" title="Mês anterior" disabled={availableMonths.indexOf(calendarMonth) <= 0} onClick={() => setCalendarMonth(availableMonths[Math.max(0, availableMonths.indexOf(calendarMonth) - 1)])} className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 text-navy/60 transition-colors hover:bg-warm hover:text-purple disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">←</button><p className="min-w-[9rem] text-center text-sm font-black capitalize text-navy">{formatMonth(calendarMonth)}</p><button type="button" aria-label="Próximo mês" title="Próximo mês" disabled={availableMonths.indexOf(calendarMonth) < 0 || availableMonths.indexOf(calendarMonth) >= availableMonths.length - 1} onClick={() => setCalendarMonth(availableMonths[availableMonths.indexOf(calendarMonth) + 1])} className="grid h-9 w-9 place-items-center rounded-full border border-navy/10 text-navy/60 transition-colors hover:bg-warm hover:text-purple disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">→</button></div></div><div className="mt-7 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-black uppercase tracking-[0.12em] text-navy/35 sm:gap-2">{["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}{calendarCells.map((date, index) => date ? (() => { const day = calendarByDate.get(date); const inRange = date >= summary.from && date <= summary.to; const selectedDay = selectedCalendarDate === date; const label = !inRange ? "Fora do período selecionado" : day?.total ? `${dateFromKey(date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" })}: ${day.dominant ? SENTIMENT_COPY[day.dominant].label : "empate entre sentimentos"}, ${day.total} ${day.total === 1 ? "registro" : "registros"}` : `${dateFromKey(date).toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" })}: sem registro`; return <button key={date} type="button" disabled={!inRange} aria-label={label} title={label} onClick={() => void selectCalendarDay(date)} className={`min-h-12 rounded-xl border p-1 text-xs transition-[background-color,border-color,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transform-none motion-reduce:transition-none sm:min-h-16 ${!inRange ? "cursor-default border-transparent text-navy/15" : selectedDay ? "border-purple bg-purple/10 text-purple" : day?.dominant ? `${SENTIMENT_COPY[day.dominant].soft} text-navy` : "border-navy/8 bg-warm/35 text-navy/40"}`}><span className="block font-black">{date.slice(-2).replace(/^0/, "")}</span><span aria-hidden="true" className="mt-1 block text-[0.6rem] font-black">{!inRange ? "" : day?.total ? day.dominant ? SENTIMENT_COPY[day.dominant].marker : "≍" : "·"}</span></button>; })() : <span key={`blank-${index}`} aria-hidden="true" className="min-h-12 sm:min-h-16" />)}</div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-navy/55"><span>· sem registro</span>{SENTIMENT_LABELS.map((sentiment) => <span key={sentiment} style={{ color: SENTIMENT_COPY[sentiment].color }}>{SENTIMENT_COPY[sentiment].marker} {SENTIMENT_COPY[sentiment].label}</span>)}<span>≍ empate</span></div>{selectedCalendarDate ? <div className="mt-6 rounded-2xl border border-purple/10 bg-purple/[0.04] p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-black text-navy">Registros de {formatLongDate(selectedCalendarDate)}</h3>{selectedDayPending ? <span className="text-xs text-navy/45" role="status">Carregando…</span> : null}</div>{!selectedDayPending && selectedDayRecords.length === 0 ? <p className="mt-3 text-sm leading-6 text-navy/50">Não há registros nesse dia dentro dos filtros atuais.</p> : <div className="mt-4 space-y-3">{selectedDayRecords.map((record) => <div key={record.id} className="rounded-xl border border-navy/8 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${SENTIMENT_COPY[record.sentiment].soft}`}>{SENTIMENT_COPY[record.sentiment].label}</span><span className="text-xs text-navy/45">{formatRecordDate(record.createdAt)}</span></div><p className="mt-3 text-sm leading-6 text-navy/60">{record.note || "Sem relato escrito neste registro."}</p></div>)}</div>}</div> : null}</section>

      <section aria-labelledby="history-title" className="mt-5 rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-8"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-[0.68rem]">memória do período</p><h2 id="history-title" className="mt-2 text-2xl font-black tracking-[-0.05em] text-navy">Histórico de registros</h2><p className="mt-2 text-sm leading-6 text-navy/50">{records.length ? `${records.length} de ${recordsTotal} registros exibidos nos filtros atuais.` : "Nenhum registro encontrado nos filtros atuais."}</p></div><a href="/api/sentiment/export?format=csv" className="text-sm font-black text-purple transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Exportar CSV</a></div>{records.length ? <div className="mt-6 space-y-3">{records.map((record) => <article key={record.id} className="rounded-2xl border border-navy/8 bg-warm/25 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 flex-wrap items-center gap-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${SENTIMENT_COPY[record.sentiment].soft}`}>{SENTIMENT_COPY[record.sentiment].label}</span><time dateTime={record.createdAt} className="text-xs font-bold text-navy/45">{formatRecordDate(record.createdAt)}</time></div><div className="flex flex-wrap gap-2"><Link href={`/chat?recordId=${encodeURIComponent(record.id)}`} className="rounded-lg px-2.5 py-2 text-xs font-black text-purple transition-colors hover:bg-purple/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Conversar sobre este registro</Link><button type="button" onClick={() => startEdit(record)} className="rounded-lg px-2.5 py-2 text-xs font-black text-navy/55 transition-colors hover:bg-white hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Editar relato</button><button type="button" onClick={() => void deleteRecord(record)} className="rounded-lg px-2.5 py-2 text-xs font-black text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">Excluir</button></div></div>{editingRecordId === record.id ? <div className="mt-4"><label htmlFor={`edit-record-${record.id}`} className="sr-only">Editar relato do registro de {formatRecordDate(record.createdAt)}</label><textarea id={`edit-record-${record.id}`} value={editingNote} onChange={(event) => setEditingNote(event.target.value)} maxLength={2000} rows={3} className="w-full resize-none rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm leading-6 text-navy outline-none focus:border-purple focus:ring-2 focus:ring-purple/15" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setEditingRecordId(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-navy/55 hover:bg-white">Cancelar</button><button type="button" onClick={() => void saveEdit(record.id)} className="rounded-lg bg-purple px-3 py-2 text-xs font-bold text-white hover:bg-navy">Salvar relato</button></div></div> : <p className="mt-4 break-words text-sm leading-6 text-navy/60">{record.note || "Sem relato escrito neste registro."}</p>}</article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-navy/12 bg-warm/35 px-6 py-8 text-center"><p className="text-sm font-black text-navy/70">Ainda não há registros para mostrar.</p><p className="mt-2 text-sm leading-6 text-navy/45">Faça um check-in acima para criar o primeiro registro e ele aparecerá aqui.</p></div>}{recordsHasMore ? <button type="button" onClick={() => void loadMoreRecords()} disabled={recordsPending} className="mt-5 w-full rounded-xl border border-navy/10 px-4 py-3 text-sm font-black text-navy/65 transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-wait disabled:opacity-50">{recordsPending ? "Carregando…" : "Carregar mais registros"}</button> : null}</section>

      <section className="mt-5 grid gap-5 rounded-[1.75rem] border border-purple/10 bg-purple/[0.045] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div><p className="eyebrow text-[0.68rem]">agora</p><h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-navy">Quer conversar sobre o que apareceu?</h2><p className="mt-2 text-sm leading-6 text-navy/55">A EscutIA pode acompanhar você a partir do registro que escolher.</p></div><Link href="/chat" className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Conversar com a EscutIA</Link></section>
    </div>
  );
}
