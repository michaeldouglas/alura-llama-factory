import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getSentimentDashboardSummary, getSentimentRecords } from "@/lib/sentiment-dashboard";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

export type DashboardSearchParams = { from?: string; to?: string; sentiments?: string };

export async function getDashboardPageData(searchParams: DashboardSearchParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const displayName = session.user.name || session.user.email?.split("@")[0] || "pessoa";
  const selected = searchParams.sentiments?.split(",").filter((value): value is SentimentLabel => SENTIMENT_LABELS.includes(value as SentimentLabel));
  const initialSelected = selected?.length ? selected : [...SENTIMENT_LABELS];
  const [summary, records] = await Promise.all([
    getSentimentDashboardSummary(session.user.id, searchParams),
    getSentimentRecords(session.user.id, { ...searchParams, page: 1 }),
  ]);

  return {
    name: displayName,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    summary,
    records,
    initialSelected,
  };
}
