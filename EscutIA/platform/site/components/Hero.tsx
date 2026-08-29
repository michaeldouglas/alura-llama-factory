import ChatPreview from "@/components/ChatPreview";
import ConversationAction from "@/components/ConversationAction";

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pb-20 pt-16 lg:pb-28 lg:pt-24">
      <div aria-hidden="true" className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-lilac/15 blur-3xl" />
      <div aria-hidden="true" className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-peach/20 blur-3xl" />
      <div className="site-container relative grid items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <div>
          <span className="eyebrow">apoio emocional, quando precisar</span>
          <h1 className="mt-6 max-w-[650px] text-5xl font-black leading-[1.02] tracking-[-0.055em] text-navy sm:text-6xl lg:text-[76px]">
            Fale. Desabafe. <span className="text-gradient">Seja ouvido.</span>
          </h1>
          <p className="mt-7 max-w-[550px] text-lg leading-8 text-navy/65 sm:text-xl">
            Converse sobre o que está acontecendo, organize seus pensamentos e encontre um próximo passo com acolhimento, privacidade e sem julgamentos.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ConversationAction className="rounded-full bg-gradient-brand px-7 py-4 text-center text-sm font-extrabold text-white shadow-xl shadow-pink/20 transition hover:-translate-y-1" />
            <a href="#como-funciona" className="rounded-full border border-navy/12 bg-white/60 px-7 py-4 text-center text-sm font-extrabold text-navy transition hover:-translate-y-1 hover:border-purple hover:text-purple">Saiba mais <span aria-hidden="true">↓</span></a>
          </div>
          <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-navy/50">
            <div className="flex -space-x-2" aria-hidden="true"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-warm bg-peach text-xs">♡</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-warm bg-lilac text-xs">✦</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-warm bg-pink text-xs text-white">◌</span></div>
            Um espaço para você respirar e falar.
          </div>
        </div>
        <ChatPreview />
      </div>
    </section>
  );
}
