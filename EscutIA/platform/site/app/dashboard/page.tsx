import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/DashboardSidebar";
import SentimentDashboard from "@/components/SentimentDashboard";
import { authOptions } from "@/lib/auth";
import { getSentimentDashboardSummary } from "@/lib/sentiment-dashboard";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { from?: string; to?: string; sentiments?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const displayName = session.user.name || session.user.email?.split("@")[0] || "pessoa";
  const selected = searchParams.sentiments?.split(",").filter((value): value is SentimentLabel => SENTIMENT_LABELS.includes(value as SentimentLabel));
  const initialSelected = selected?.length ? selected : [...SENTIMENT_LABELS];
  const summary = await getSentimentDashboardSummary(session.user.id, searchParams);

  return <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex"><DashboardSidebar name={displayName} email={session.user.email ?? null} image={session.user.image ?? null} /><div className="min-w-0 flex-1"><SentimentDashboard initialSummary={summary} initialSelected={initialSelected} /></div></main>;
}
