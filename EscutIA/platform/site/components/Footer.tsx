const footerLinks = [
  ["Sobre", "#sobre"],
  ["Segurança", "#seguranca"],
  ["Contato", "#conversar"],
];

export default function Footer() {
  return (
    <footer className="border-t border-navy/8 bg-white/55 py-10"><div className="site-container flex flex-col gap-8 md:flex-row md:items-end md:justify-between"><div><a href="#inicio" className="text-2xl font-black tracking-[-0.05em] text-navy">Escut<span className="text-purple">IA</span></a><p className="mt-3 max-w-xs text-sm leading-6 text-navy/50">Um espaço de apoio emocional para falar, respirar e ser ouvido.</p></div><nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-navy/55">{footerLinks.map(([label, href]) => <a key={label} href={href} className="transition hover:text-purple">{label}</a>)}</nav></div><div className="site-container mt-8 flex flex-col gap-2 border-t border-navy/8 pt-6 text-xs leading-5 text-navy/40 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 EscutIA. Feita para acolher.</p><p>EscutIA não substitui acompanhamento psicológico ou médico.</p></div></footer>
  );
}
