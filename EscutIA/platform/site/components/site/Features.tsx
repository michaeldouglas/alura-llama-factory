import { ArrowUpRight, BookOpenText, Clock3, Heart, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";

type Feature = {
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  { number: "01", title: "Apoio quando precisar", text: "Acesse seu espaço quando quiser conversar ou registrar como está.", icon: Clock3 },
  { number: "02", title: "Conversas acolhedoras", text: "Interações respeitosas e sem julgamentos.", icon: Heart },
  { number: "03", title: "Seus dados, com clareza", text: "Entenda como os dados são tratados na nossa Política de privacidade.", icon: ShieldCheck },
  { number: "04", title: "Histórico pessoal", text: "Veja suas conversas e registros em um só lugar.", icon: BookOpenText },
  { number: "05", title: "Reflexões", text: "Organize o que você sente e perceba padrões no seu dia a dia.", icon: Sparkles },
  { number: "06", title: "Próximos passos", text: "Quando fizer sentido, encontre orientação para buscar ajuda adequada.", icon: ArrowUpRight },
];

export default function Features() {
  return (
    <section id="recursos" className="py-24 lg:py-32">
      <div className="site-container">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">feito para a vida real</span>
            <h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em] text-navy sm:text-5xl">Recursos para falar, registrar e olhar com mais clareza.</h2>
          </div>
          <p className="max-w-sm leading-7 text-navy/55">A EscutIA reúne só o que precisa para acompanhar sua própria experiência.</p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const cardClassName = [
              "feature-card rounded-[26px] border p-6 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple/8",
              index === 0 ? "border-purple/20 bg-[#f0edff]" : "border-navy/8 bg-white/55",
            ].join(" ");
            return (
              <article key={feature.title} className={cardClassName}>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-purple shadow-sm"><Icon aria-hidden="true" className="feature-icon transition-transform duration-200 motion-reduce:transition-none" size={20} strokeWidth={2.25} /></span>
                  <span className="text-xs font-black text-navy/25">{feature.number}</span>
                </div>
                <h3 className="mt-7 text-lg font-extrabold text-navy">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-navy/58">{feature.text}</p>
                {feature.title === "Seus dados, com clareza" && <a href="/privacidade" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-purple underline decoration-purple/30 underline-offset-4 transition-[color] hover:text-navy">Ler a política <ArrowUpRight aria-hidden="true" size={14} /></a>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
