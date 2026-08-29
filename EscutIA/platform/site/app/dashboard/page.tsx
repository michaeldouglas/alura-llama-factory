import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/DashboardSidebar";
import SentimentDashboard from "@/components/SentimentDashboard";
import { authOptions } from "@/lib/auth";
import { getSentimentDashboardSummary } from "@/lib/sentiment-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const displayName = session.user.name || session.user.email?.split("@")[0] || "pessoa";
  const summary = await getSentimentDashboardSummary(session.user.id);

  return <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex"><DashboardSidebar name={displayName} email={session.user.email ?? null} image={session.user.image ?? null} /><div className="min-w-0 flex-1"><SentimentDashboard initialSummary={summary} /></div></main>;
}
