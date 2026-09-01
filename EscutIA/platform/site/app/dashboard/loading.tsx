export default function DashboardLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy lg:flex">
      <div className="hidden w-[248px] shrink-0 animate-pulse border-r border-navy/10 bg-white p-6 lg:block motion-reduce:animate-none">
        <div className="h-9 w-28 rounded-lg bg-navy/10" />
        <div className="mt-9 h-16 rounded-2xl bg-warm" />
        <div className="mt-8 space-y-2">
          <div className="h-11 rounded-xl bg-navy/10" />
          <div className="h-11 rounded-xl bg-navy/5" />
          <div className="h-11 rounded-xl bg-navy/5" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] animate-pulse px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14 motion-reduce:animate-none" role="status" aria-live="polite" aria-label="Carregando seu dashboard…">
        <span className="sr-only">Carregando seu dashboard…</span>
        <div className="h-4 w-28 rounded bg-purple/15" />
        <div className="mt-4 h-12 w-72 max-w-full rounded-xl bg-navy/10" />
        <div className="mt-3 h-5 w-[min(34rem,90%)] rounded bg-navy/5" />
        <div className="mt-9 h-40 rounded-[1.75rem] bg-white/80" />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-white/80" />
          <div className="h-28 rounded-2xl bg-white/80" />
          <div className="h-28 rounded-2xl bg-white/80" />
        </div>
        <div className="mt-5 h-[390px] rounded-[1.75rem] bg-white/80" />
      </div>
    </main>
  );
}
