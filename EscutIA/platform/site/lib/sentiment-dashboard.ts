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

export type SentimentDashboardSummary = {
  from: string;
  to: string;
  total: number;
  counts: Record<SentimentLabel, number>;
  points: SentimentDashboardPoint[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

  // Avoid rendering an unexpectedly large chart when a malformed or overly broad
  // query reaches the endpoint.
  if (to.getTime() - from.getTime() > 1000 * 60 * 60 * 24 * 90) {
    from = addDays(to, -90);
  }

  return { from, to };
}

function getSelectedSentiments(values?: string | null): SentimentLabel[] {
  if (!values) return [...SENTIMENT_LABELS];
  const selected = values.split(",").filter((value): value is SentimentLabel => SENTIMENT_LABELS.includes(value as SentimentLabel));
  return selected.length ? selected : [...SENTIMENT_LABELS];
}

export async function getSentimentDashboardSummary(
  userId: string,
  options: { from?: string | null; to?: string | null; sentiments?: string | null } = {},
): Promise<SentimentDashboardSummary> {
  const { from, to } = getDateRange(options.from, options.to);
  const selectedSentiments = getSelectedSentiments(options.sentiments);
  const endExclusive = addDays(to, 1);
  const records = await prisma.sentimentRecord.findMany({
    where: {
      userId,
      createdAt: { gte: from, lt: endExclusive },
      sentiment: { in: selectedSentiments },
    },
    select: { sentiment: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const points = new Map<string, SentimentDashboardPoint>();
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
  }

  const counts: Record<SentimentLabel, number> = { negativo: 0, neutro: 0, positivo: 0 };
  for (const record of records) {
    if (!SENTIMENT_LABELS.includes(record.sentiment as SentimentLabel)) continue;
    const sentiment = record.sentiment as SentimentLabel;
    const point = points.get(formatDate(record.createdAt));
    if (!point) continue;
    point[sentiment] += 1;
    point.total += 1;
    counts[sentiment] += 1;
  }

  return {
    from: formatDate(from),
    to: formatDate(to),
    total: records.length,
    counts,
    points: Array.from(points.values()),
  };
}
