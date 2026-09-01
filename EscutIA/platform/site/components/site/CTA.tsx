import ConversationAction from "@/components/site/ConversationAction";

export default function CTA() {
  return (
    <section id="conversar" className="pb-24 lg:pb-32">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-[34px] bg-gradient-brand px-7 py-14 text-center text-white shadow-2xl shadow-pink/20 sm:px-12 sm:py-20">
          <div aria-hidden="true" className="absolute -left-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/15" />
          <div aria-hidden="true" className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.15em] text-white/75">um primeiro passo simples</p>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Comece com uma conversa, no seu ritmo.</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-white/80">Entre com sua conta Google e conheça o espaço gratuito da EscutIA.</p>
            <ConversationAction className="mt-8 inline-flex rounded-full bg-white px-7 py-4 text-sm font-extrabold text-purple shadow-xl transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple" />
            <p className="mt-4 text-xs font-semibold text-white/65">A EscutIA é uma IA de apoio emocional, não um serviço de terapia.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
