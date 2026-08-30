import DashboardSidebar from "@/components/DashboardSidebar";
import ImmediateHelp from "@/components/ImmediateHelp";
import SentimentDashboard from "@/components/SentimentDashboard";
import { getDashboardPageData } from "@/lib/dashboard-page";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: { from?: string; to?: string; sentiments?: string } }) {
  const data = await getDashboardPageData(searchParams);

  return <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex"><DashboardSidebar name={data.name} email={data.email} image={data.image} /><div className="min-w-0 flex-1"><SentimentDashboard initialSummary={data.summary} initialSelected={data.initialSelected} initialRecords={data.records} section="overview" /></div><ImmediateHelp /></main>;
}
