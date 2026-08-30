const steps = [
  { number: "01", title: "Conte como você está", text: "Converse livremente sobre seu dia, sentimentos ou preocupações.", icon: "◌" },
  { number: "02", title: "A EscutIA escuta", text: "A conversa se adapta ao contexto e ao que você está expressando.", icon: "✦" },
  { number: "03", title: "Continue no seu ritmo", text: "Use a plataforma sempre que quiser organizar pensamentos ou simplesmente conversar.", icon: "↗" },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="soft-grid border-y border-purple/5 bg-white/40 py-24 lg:py-32">
      <div className="site-container">
        <div className="max-w-2xl"><span className="eyebrow">simples por natureza</span><h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-navy sm:text-5xl">Uma conversa pode ser o começo de algo mais leve.</h2><p className="mt-5 text-lg leading-8 text-navy/60">Sem pressa, sem roteiro e sem julgamentos. Você escolhe o que quer compartilhar.</p></div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step) => <article key={step.number} className="rounded-[28px] border border-white bg-white/80 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple/8"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f0edff] text-xl font-bold text-purple">{step.icon}</span><span className="text-sm font-black text-navy/20">{step.number}</span></div><h3 className="mt-8 text-xl font-extrabold text-navy">{step.title}</h3><p className="mt-3 leading-7 text-navy/60">{step.text}</p></article>)}
        </div>
      </div>
    </section>
  );
}
