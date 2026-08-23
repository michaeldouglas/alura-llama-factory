const features = [
  ["24/7", "Apoio emocional 24/7", "Sempre disponível quando você quiser conversar.", "◷"],
  ["01", "Conversas acolhedoras", "Interações respeitosas e sem julgamentos.", "♡"],
  ["02", "Privacidade", "Experiência construída com preocupação com segurança e proteção dos dados.", "⌁"],
  ["03", "Histórico pessoal", "Permitir futuramente acompanhar suas próprias conversas e reflexões.", "▤"],
  ["04", "Reflexões", "Ajudar o usuário a organizar pensamentos e perceber padrões no seu dia a dia.", "✧"],
  ["05", "Encaminhamento responsável", "Em situações que exijam atenção especializada, orientar o usuário a procurar profissionais adequados.", "↗"],
];

export default function Features() {
  return (
    <section id="recursos" className="py-24 lg:py-32">
      <div className="site-container"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="eyebrow">feito para a vida real</span><h2 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.04em] text-navy sm:text-5xl">Tecnologia que encontra você onde você está.</h2></div><p className="max-w-sm leading-7 text-navy/55">Pequenas funcionalidades pensadas para tornar a escuta mais acessível e próxima.</p></div><div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(([number, title, text, icon], index) => <article key={title} className={`rounded-[26px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple/8 ${index === 0 ? "border-purple/20 bg-[#f0edff]" : "border-navy/8 bg-white/55"}`}><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl font-bold text-purple shadow-sm">{icon}</span><span className="text-xs font-black text-navy/25">{number}</span></div><h3 className="mt-7 text-lg font-extrabold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-navy/58">{text}</p></article>)}</div></div>
    </section>
  );
}
