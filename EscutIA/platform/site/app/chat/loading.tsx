export default function ChatLoading() {
  return (
    <main id="main-content" className="flex h-screen min-h-screen animate-pulse overflow-hidden bg-[#f9f6f3] text-navy motion-reduce:animate-none" role="status" aria-live="polite" aria-label="Carregando seu espaço de conversa…">
      <span className="sr-only">Carregando seu espaço de conversa…</span>
      <aside className="hidden w-[300px] shrink-0 border-r border-navy/8 bg-white p-6 lg:block">
        <div className="h-9 w-28 rounded-lg bg-navy/10" />
        <div className="mt-8 h-14 rounded-2xl bg-warm" />
        <div className="mt-6 h-24 rounded-2xl bg-purple/10" />
        <div className="mt-7 h-10 rounded-xl bg-navy/5" />
        <div className="mt-3 h-24 rounded-xl bg-navy/5" />
      </aside>
      <section className="flex min-w-0 flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col justify-end">
          <div className="mb-5 h-20 w-3/4 rounded-2xl bg-white/80" />
          <div className="h-28 rounded-[1.5rem] bg-white/80" />
        </div>
      </section>
    </main>
  );
}
