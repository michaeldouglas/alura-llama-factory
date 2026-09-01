import { prisma } from "@/lib/prisma";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

export type SentimentDashboardPoint = {
  date: string;
  label: string;
  negativo: number;
  neutro: number;
  positivo: number;
  total: number;
};

export type SentimentDashboardComparison = {
  from: string;
  to: string;
  total: number;
  counts: Record<SentimentLabel, number>;
  daysWithRecords: number;
  totalDelta: number;
  totalDeltaPercent: number | null;
  daysDelta: number;
  daysDeltaPercent: number | null;
  hasPreviousData: boolean;
};

export type SentimentCalendarDay = {
  date: string;
  negativo: number;
  neutro: number;
  positivo: number;
  total: number;
};

export type SentimentDashboardSummary = {
  from: string;
  to: string;
  durationDays: number;
  total: number;
  counts: Record<SentimentLabel, number>;
  percentages: Record<SentimentLabel, number>;
  daysWithRecords: number;
  mostRegistered: SentimentLabel | null;
  points: SentimentDashboardPoint[];
  calendar: SentimentCalendarDay[];
  comparison: SentimentDashboardComparison;
};

export type SentimentRecordItem = {
  id: string;
  sentiment: SentimentLabel;
  note: string | null;
  createdAt: string;
  conversation: { id: string; title: string } | null;
};

export const RECORDS_PAGE_SIZE = 12;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DashboardOptions = {
  from?: string | null;
  to?: string | null;
  sentiments?: string | null;
  search?: string | null;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | null | undefined, fallback: Date) {
  if (!value || !DATE_PATTERN.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function getDateRange(fromValue?: string | null, toValue?: string | null) {
  const today = new Date();
  const defaultTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const defaultFrom = addDays(defaultTo, -6);
  let from = parseDate(fromValue, defaultFrom);
  let to = parseDate(toValue, defaultTo);

  if (from > to) [from, to] = [to, from];
  if (to.getTime() - from.getTime() > 1000 * 60 * 60 * 24 * 90) from = addDays(to, -90);

  return { from, to };
}

export function getSelectedSentiments(values?: string | null): SentimentLabel[] {
  if (!values) return [...SENTIMENT_LABELS];
  const selected = values.split(",").filter((value): value is SentimentLabel => SENTIMENT_LABELS.includes(value as SentimentLabel));
  return selected.length ? Array.from(new Set(selected)) : [...SENTIMENT_LABELS];
}

export function isValidDateInput(value: string | null | undefined) {
  if (!value) return true;
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidSentimentFilter(value: string | null | undefined) {
  if (!value) return true;
  const values = value.split(",");
  return values.length > 0 && values.every((item) => SENTIMENT_LABELS.includes(item as SentimentLabel));
}

export function getDashboardRange(options: DashboardOptions = {}) {
  const { from, to } = getDateRange(options.from, options.to);
  return { from, to, fromValue: formatDate(from), toValue: formatDate(to), selectedSentiments: getSelectedSentiments(options.sentiments) };
}

function emptyCounts(): Record<SentimentLabel, number> {
  return { negativo: 0, neutro: 0, positivo: 0 };
}

function roundPercentage(value: number) {
  return Math.round(value * 10) / 10;
}

function dominantSentiment(counts: Record<SentimentLabel, number>, total: number): SentimentLabel | null {
  if (!total) return null;
  const max = Math.max(...SENTIMENT_LABELS.map((sentiment) => counts[sentiment]));
  const leaders = SENTIMENT_LABELS.filter((sentiment) => counts[sentiment] === max);
  return leaders.length === 1 ? leaders[0] : null;
}

function aggregateRecords(records: Array<{ sentiment: string; createdAt: Date }>, from: Date, to: Date) {
  const endExclusive = addDays(to, 1);
  const points = new Map<string, SentimentDashboardPoint>();
  const calendar = new Map<string, SentimentCalendarDay>();

  for (let date = from; date < endExclusive; date = addDays(date, 1)) {
    const key = formatDate(date);
    points.set(key, {
      date: key,
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(date).replace(".", ""),
      negativo: 0,
      neutro: 0,
      positivo: 0,
      total: 0,
    });
    calendar.set(key, { date: key, negativo: 0, neutro: 0, positivo: 0, total: 0 });
  }

  const counts = emptyCounts();
  for (const record of records) {
    if (!SENTIMENT_LABELS.includes(record.sentiment as SentimentLabel)) continue;
    const sentiment = record.sentiment as SentimentLabel;
    const key = formatDate(record.createdAt);
    const point = points.get(key);
    const calendarDay = calendar.get(key);
    if (!point || !calendarDay) continue;
    point[sentiment] += 1;
    point.total += 1;
    calendarDay[sentiment] += 1;
    calendarDay.total += 1;
    counts[sentiment] += 1;
  }

  const total = records.length;
  const percentages = emptyCounts();
  for (const sentiment of SENTIMENT_LABELS) percentages[sentiment] = total ? roundPercentage((counts[sentiment] / total) * 100) : 0;

  return {
    total,
    counts,
    percentages,
    daysWithRecords: Array.from(points.values()).filter((point) => point.total > 0).length,
    mostRegistered: dominantSentiment(counts, total),
    points: Array.from(points.values()),
    calendar: Array.from(calendar.values()),
  };
}

function percentageDelta(current: number, previous: number) {
  return previous ? roundPercentage(((current - previous) / previous) * 100) : null;
}

export async function getSentimentDashboardSummary(userId: string, options: DashboardOptions = {}): Promise<SentimentDashboardSummary> {
  const { from, to, fromValue, toValue, selectedSentiments } = getDashboardRange(options);
  const durationDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const previousTo = addDays(from, -1);
  const previousFrom = addDays(previousTo, -(durationDays - 1));
  const endExclusive = addDays(to, 1);
  const records = await prisma.sentimentRecord.findMany({
    where: { userId, sentiment: { in: selectedSentiments }, createdAt: { gte: previousFrom, lt: endExclusive } },
    select: { sentiment: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const currentRecords = records.filter((record) => record.createdAt >= from && record.createdAt < endExclusive);
  const previousRecords = records.filter((record) => record.createdAt >= previousFrom && record.createdAt < from);
  const current = aggregateRecords(currentRecords, from, to);
  const previous = aggregateRecords(previousRecords, previousFrom, previousTo);

  return {
    from: fromValue,
    to: toValue,
    durationDays,
    total: current.total,
    counts: current.counts,
    percentages: current.percentages,
    daysWithRecords: current.daysWithRecords,
    mostRegistered: current.mostRegistered,
    points: current.points,
    calendar: current.calendar,
    comparison: {
      from: formatDate(previousFrom),
      to: formatDate(previousTo),
      total: previous.total,
      counts: previous.counts,
      daysWithRecords: previous.daysWithRecords,
      totalDelta: current.total - previous.total,
      totalDeltaPercent: percentageDelta(current.total, previous.total),
      daysDelta: current.daysWithRecords - previous.daysWithRecords,
      daysDeltaPercent: percentageDelta(current.daysWithRecords, previous.daysWithRecords),
      hasPreviousData: previous.total > 0,
    },
  };
}

export async function getSentimentRecords(userId: string, options: DashboardOptions & { page?: number } = {}) {
  const { from, to, selectedSentiments } = getDashboardRange(options);
  const page = Number.isInteger(options.page) && (options.page as number) > 0 ? options.page as number : 1;
  const search = typeof options.search === "string" ? options.search.trim().slice(0, 80) : "";
  const where = {
    userId,
    sentiment: { in: selectedSentiments },
    createdAt: { gte: from, lt: addDays(to, 1) },
    ...(search ? { note: { contains: search } } : {}),
  };
  const [records, total] = await Promise.all([
    prisma.sentimentRecord.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * RECORDS_PAGE_SIZE,
      take: RECORDS_PAGE_SIZE,
      select: { id: true, sentiment: true, note: true, createdAt: true, conversation: { select: { id: true, title: true } } },
    }),
    prisma.sentimentRecord.count({ where }),
  ]);

  return {
    from: formatDate(from),
    to: formatDate(to),
    page,
    pageSize: RECORDS_PAGE_SIZE,
    total,
    hasMore: page * RECORDS_PAGE_SIZE < total,
    records: records.map((record): SentimentRecordItem => ({ id: record.id, sentiment: record.sentiment as SentimentLabel, note: record.note, createdAt: record.createdAt.toISOString(), conversation: record.conversation })),
  };
}
