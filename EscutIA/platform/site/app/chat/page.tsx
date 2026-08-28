import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main id="main-content" className="min-h-screen bg-warm text-navy">
      <div className="site-container flex min-h-screen flex-col justify-center py-12">
        <p className="eyebrow">seu espaço de conversa</p>
        <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.06em] sm:text-7xl">
          Estamos preparando um lugar para você falar.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-navy/65">
          O chat da EscutIA será a próxima etapa. Sua sessão já está pronta e este
          espaço ficará aqui para receber a conversa quando ela for implementada.
        </p>
        <Link href="/dashboard" className="mt-8 inline-flex w-fit rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-purple">
          Voltar ao dashboard
        </Link>
      </div>
    </main>
  );
}
