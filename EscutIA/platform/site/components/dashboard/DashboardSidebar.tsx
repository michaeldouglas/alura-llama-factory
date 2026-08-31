import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CircleUserRound, CreditCard, FileText, LayoutDashboard, MessageCircle } from "lucide-react";

import SignOutButton from "@/components/shared/SignOutButton";

type DashboardSidebarProps = {
  name: string;
  email: string | null;
  image: string | null;
  active?: "overview" | "records" | "calendar" | "profile" | "billing";
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function LogoMark() {
  return <Link href="/" aria-label="EscutIA — página inicial" className="flex items-center gap-3"><Image src="/logo.png" alt="EscutIA" width={132} height={45} priority className="h-auto w-[118px]" /></Link>;
}

export default function DashboardSidebar({ name, email, image, active = "overview" }: DashboardSidebarProps) {
  const activeClass = "bg-navy text-white shadow-[0_8px_20px_rgba(26,31,61,0.12)]";
  const inactiveClass = "text-navy/60 transition-colors hover:bg-warm hover:text-purple";
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-navy/10 bg-white px-5 py-5 lg:min-h-screen lg:w-[248px] lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="flex items-center justify-between lg:block">
        <LogoMark />
        <div className="lg:hidden"><SignOutButton /></div>
      </div>

      <div className="mt-8 hidden items-center gap-3 rounded-2xl bg-warm/70 p-3 lg:flex">
        {image ? <Image src={image} alt={`Foto de ${name}`} width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-purple/15 text-xs font-black text-purple">{initials(name)}</span>}
        <div className="min-w-0"><p className="truncate text-sm font-black text-navy">{name}</p><p className="truncate text-xs text-navy/45">{email || "seu espaço pessoal"}</p></div>
      </div>

      <nav aria-label="Navegação principal" className="mt-7 flex gap-2 overflow-x-auto lg:block lg:space-y-1">
        <Link href="/dashboard" aria-current={active === "overview" ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${active === "overview" ? activeClass : inactiveClass}`}><LayoutDashboard aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Visão geral</Link>
        <Link href="/dashboard/records" aria-current={active === "records" ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${active === "records" ? activeClass : inactiveClass}`}><FileText aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Registros</Link>
        <Link href="/dashboard/calendar" aria-current={active === "calendar" ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${active === "calendar" ? activeClass : inactiveClass}`}><CalendarDays aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Calendário</Link>
        <Link href="/chat" className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${inactiveClass}`}><MessageCircle aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Conversar</Link>
        <Link href="/dashboard/profile" aria-current={active === "profile" ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${active === "profile" ? activeClass : inactiveClass}`}><CircleUserRound aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Conta e dados</Link>
        <Link href="/dashboard/billing" aria-current={active === "billing" ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${active === "billing" ? activeClass : inactiveClass}`}><CreditCard aria-hidden="true" className="h-[1.1rem] w-[1.1rem]" />Plano e uso</Link>
      </nav>

      <div className="mt-auto hidden pt-8 lg:block"><p className="px-3 text-xs leading-5 text-navy/40">Um espaço privado para perceber seus dias com mais calma.</p><div className="mt-6"><SignOutButton /></div></div>
    </aside>
  );
}
