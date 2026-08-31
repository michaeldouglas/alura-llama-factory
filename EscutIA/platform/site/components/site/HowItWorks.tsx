import { LogIn, MessageCircle, Sparkles, type LucideIcon } from "lucide-react";

type Step = {
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  { number: "01", title: "Entre com sua conta", text: "Ao clicar em “Conversar agora”, você entra com o Google para acessar seu espaço pessoal.", icon: LogIn },
  { number: "02", title: "Conte o que está acontecendo", text: "Escreva livremente sobre seu dia, sentimentos ou preocupações. Você escolhe o que compartilhar.", icon: MessageCircle },
  { number: "03", title: "Organize seus pensamentos", text: "A conversa ajuda você a olhar para o momento com mais clareza e continuar no seu ritmo.", icon: Sparkles },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="soft-grid border-y border-purple/5 bg-white/40 py-24 lg:py-32">
      <div className="site-container">
        <div className="max-w-2xl"><span className="eyebrow">simples por natureza</span><h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-navy sm:text-5xl">Do primeiro clique à primeira conversa, sem complicação.</h2><p className="mt-5 text-lg leading-8 text-navy/60">Acesse seu espaço, escreva do seu jeito e use a conversa para colocar as ideias em ordem.</p></div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return <article key={step.number} className="step-card rounded-[28px] border border-white bg-white/80 p-7 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple/8"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f0edff] text-purple"><Icon aria-hidden="true" className="step-icon transition-transform duration-200 motion-reduce:transition-none" size={21} strokeWidth={2.25} /></span><span className="text-sm font-black text-navy/20">{step.number}</span></div><h3 className="mt-8 text-xl font-extrabold text-navy">{step.title}</h3><p className="mt-3 leading-7 text-navy/60">{step.text}</p></article>;
          })}
        </div>
      </div>
    </section>
  );
}
