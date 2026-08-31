import Image from "next/image";

export default function About() {
  return (
    <section id="sobre" className="py-24 lg:py-32"><div className="site-container grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center"><div><span className="eyebrow">sobre a escutia</span><div className="mt-7 grid h-28 w-28 place-items-center rounded-[34px] bg-white/70 p-5 shadow-xl shadow-pink/10"><Image src="/escutia-mark.png" alt="Marca da EscutIA" width={1254} height={1254} className="h-full w-full object-contain" /></div></div><div><h2 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-navy sm:text-5xl">Um espaço digital para colocar em palavras o que está acontecendo.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-navy/60">A EscutIA nasceu para tornar o apoio emocional mais acessível através da tecnologia. Um lugar para organizar o que está por dentro e encontrar um pouco mais de clareza no dia a dia, sem se passar por acompanhamento profissional.</p></div></div></section>
  );
}
