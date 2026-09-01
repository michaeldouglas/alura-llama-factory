import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import Footer from "@/components/site/Footer";
import Header from "@/components/site/Header";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalPage({ eyebrow, title, intro, updatedAt, children }: LegalPageProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-warm text-navy">
      <Header />
      <main id="main-content">
        <section className="relative overflow-hidden pb-14 pt-20 lg:pb-20 lg:pt-28">
          <div aria-hidden="true" className="absolute -right-28 top-0 h-96 w-96 rounded-full bg-peach/25 blur-3xl" />
          <div className="site-container relative">
            <a
              href="/#inicio"
              className="inline-flex rounded-full border border-navy/10 bg-white/60 px-4 py-2 text-sm font-bold text-navy/65 transition hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Voltar para a EscutIA
            </a>
            <p className="eyebrow mt-10">{eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.055em] [text-wrap:balance] sm:text-7xl">
              {title}
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-navy/65">{intro}</p>
            <p className="mt-5 text-sm font-semibold text-navy/45">Última atualização: {updatedAt}</p>
          </div>
        </section>
        <section className="site-container pb-24" aria-label={title}>
          <article className="max-w-4xl rounded-[30px] border border-navy/8 bg-white/80 p-7 shadow-xl shadow-navy/5 sm:p-10 lg:p-14">
            <div className="space-y-10 text-[0.98rem] leading-8 text-navy/70">{children}</div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
