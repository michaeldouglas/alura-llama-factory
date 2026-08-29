import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/DashboardSidebar";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const displayName = session.user.name || session.user.email?.split("@")[0] || "pessoa";
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex">
      <DashboardSidebar name={displayName} email={session.user.email ?? null} image={session.user.image ?? null} active="profile" />
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[980px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <header><p className="eyebrow">meu perfil</p><h1 className="mt-3 text-4xl font-black tracking-[-0.06em] sm:text-6xl">Seu espaço pessoal</h1><p className="mt-3 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Aqui ficam os dados da sua conta EscutIA.</p></header>
          <section className="mt-9 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] bg-gradient-brand p-7 text-white shadow-2xl shadow-pink/20 sm:p-10"><div className="flex items-center gap-5">{session.user.image ? <Image src={session.user.image} alt={`Foto de ${displayName}`} width={80} height={80} className="h-20 w-20 rounded-full border-4 border-white/50 object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/50 bg-white/20 text-xl font-black">{initials}</div>}<div><p className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">perfil conectado</p><h2 className="mt-1 text-2xl font-black">{displayName}</h2></div></div><p className="mt-8 text-white/80">Sua conta Google está conectada à EscutIA.</p></div>
            <div className="rounded-[2rem] border border-navy/8 bg-white/70 p-7 shadow-xl shadow-navy/5 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.14em] text-purple">conta</p><h2 className="mt-4 text-2xl font-black">Seus dados</h2><dl className="mt-6 space-y-4 text-sm"><div><dt className="font-bold text-navy/45">Nome</dt><dd className="mt-1 break-words text-navy/80">{session.user.name || "Não informado"}</dd></div><div><dt className="font-bold text-navy/45">E-mail</dt><dd className="mt-1 break-words text-navy/80">{session.user.email || "Não informado"}</dd></div></dl></div>
          </section>
        </div>
      </div>
    </main>
  );
}
