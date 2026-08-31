import ChatPreview from "@/components/site/ChatPreview";
import ConversationAction from "@/components/site/ConversationAction";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pb-20 pt-16 lg:pb-28 lg:pt-24">
      <div aria-hidden="true" className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-lilac/15 blur-3xl" />
      <div aria-hidden="true" className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-peach/20 blur-3xl" />
      <div className="site-container relative grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <div>
          <span className="eyebrow hero-enter [--hero-delay:40ms]">apoio emocional, quando precisar</span>
          <h1 className="hero-enter mt-6 max-w-[650px] text-5xl font-black leading-[1.02] tracking-[-0.055em] text-navy [--hero-delay:100ms] sm:text-6xl lg:text-[76px]">
            Um espaço para falar e <span className="text-gradient">encontrar clareza.</span>
          </h1>
          <p className="hero-enter mt-7 max-w-[550px] text-lg leading-8 text-navy/65 [--hero-delay:160ms] sm:text-xl">
            Converse com uma inteligência artificial sobre o que está acontecendo, organize seus pensamentos e encontre um próximo passo no seu ritmo.
          </p>
          <div className="hero-enter mt-9 flex flex-col gap-3 [--hero-delay:220ms] sm:flex-row">
            <ConversationAction className="rounded-full bg-gradient-brand px-7 py-4 text-center text-sm font-extrabold text-white shadow-xl shadow-pink/20 transition hover:-translate-y-1" />
            <a href="#como-funciona" className="group rounded-full border border-navy/12 bg-white/60 px-7 py-4 text-center text-sm font-extrabold text-navy transition-[border-color,color,transform] hover:-translate-y-1 hover:border-purple hover:text-purple active:scale-[0.98]">Entenda como funciona <ArrowDown aria-hidden="true" size={16} className="ml-1 inline-block transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:transition-none" /></a>
          </div>
          <div className="hero-enter mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-navy/50 [--hero-delay:280ms]">
            <span>Plano Grátis para começar</span>
            <span aria-hidden="true" className="text-pink">•</span>
            <span>Sem diagnósticos</span>
            <span aria-hidden="true" className="text-pink">•</span>
            <span>Você escolhe o que compartilhar</span>
          </div>
        </div>
        <ChatPreview />
      </div>
    </section>
  );
}
