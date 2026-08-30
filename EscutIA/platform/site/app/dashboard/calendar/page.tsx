import DashboardSidebar from "@/components/DashboardSidebar";
import ImmediateHelp from "@/components/ImmediateHelp";
import SentimentDashboard from "@/components/SentimentDashboard";
import { getDashboardPageData } from "@/lib/dashboard-page";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: { from?: string; to?: string; sentiments?: string } }) {
  const data = await getDashboardPageData(searchParams);
  return <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex"><DashboardSidebar name={data.name} email={data.email} image={data.image} active="calendar" /><div className="min-w-0 flex-1"><SentimentDashboard initialSummary={data.summary} initialSelected={data.initialSelected} initialRecords={data.records} section="calendar" /></div><ImmediateHelp /></main>;
}
