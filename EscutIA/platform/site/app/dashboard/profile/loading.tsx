export default function ProfileLoading() {
  return (
    <main id="main-content" className="min-h-screen animate-pulse bg-[#f9f6f3] text-navy motion-reduce:animate-none" role="status" aria-live="polite" aria-label="Carregando seu perfil…">
      <span className="sr-only">Carregando seu perfil…</span>
      <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
        <div className="h-4 w-24 rounded bg-purple/15" />
        <div className="mt-4 h-12 w-80 max-w-full rounded-xl bg-navy/10" />
        <div className="mt-3 h-5 w-[min(34rem,90%)] rounded bg-navy/5" />
        <div className="mt-9 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <div className="h-64 rounded-[2rem] bg-purple/15" />
          <div className="h-64 rounded-[2rem] bg-white/80" />
        </div>
      </div>
    </main>
  );
}
