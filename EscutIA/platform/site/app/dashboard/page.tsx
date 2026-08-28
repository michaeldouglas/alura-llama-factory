import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import SignOutButton from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const displayName = session.user.name || session.user.email?.split("@")[0] || "pessoa";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-warm text-navy">
      <div className="site-container py-8 sm:py-12">
        <header className="flex items-center justify-between gap-4">
          <a href="/" className="text-xl font-black tracking-[-0.04em]">
            Escut<span className="text-purple">IA</span>
          </a>
          <SignOutButton />
        </header>

        <section className="mt-16 max-w-3xl">
          <p className="eyebrow">seu espaço</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.06em] sm:text-7xl">
            Olá, {displayName.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-navy/65">
            Este é o começo do seu espaço pessoal na EscutIA. Em breve, você poderá
            continuar suas conversas por aqui.
          </p>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] bg-gradient-brand p-8 text-white shadow-2xl shadow-pink/20 sm:p-10">
            <div className="flex items-center gap-5">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={`Foto de ${displayName}`}
                  className="h-20 w-20 rounded-full border-4 border-white/50 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/50 bg-white/20 text-xl font-black">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/70">
                  perfil conectado
                </p>
                <h2 className="mt-1 text-2xl font-black">{displayName}</h2>
              </div>
            </div>
            <p className="mt-8 text-white/80">Sua conta Google está conectada à EscutIA.</p>
          </div>

          <div className="rounded-[32px] border border-navy/8 bg-white/65 p-8 shadow-xl shadow-navy/5 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-purple">conta</p>
            <h2 className="mt-4 text-2xl font-black">Seus dados</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="font-bold text-navy/45">Nome</dt>
                <dd className="mt-1 break-words text-navy/80">{session.user.name || "Não informado"}</dd>
              </div>
              <div>
                <dt className="font-bold text-navy/45">E-mail</dt>
                <dd className="mt-1 break-words text-navy/80">{session.user.email || "Não informado"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </main>
  );
}
