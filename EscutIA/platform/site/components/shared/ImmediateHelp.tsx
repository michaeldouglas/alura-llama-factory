"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function ImmediateHelp({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    if (!panel) return undefined;
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusableElements.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleEscape);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  return <div className={`${className || "bottom-4 sm:bottom-6"} fixed right-4 z-40 sm:right-6`}>
    {open ? <div ref={panelRef} id={panelId} role="dialog" aria-modal="true" aria-labelledby={`${panelId}-title`} className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-navy/10 bg-white p-5 text-navy shadow-[0_18px_60px_rgba(26,31,61,0.2)] modal-enter motion-reduce:animate-none">
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-[0.65rem]">apoio imediato</p><h2 id={`${panelId}-title`} className="mt-2 text-lg font-black">Você não precisa passar por isso sozinho</h2></div><button ref={closeButtonRef} type="button" aria-label="Fechar ajuda imediata" title="Fechar" onClick={() => setOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-navy/45 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">×</button></div>
      <p className="mt-3 text-sm leading-6 text-navy/60">Se houver risco imediato, procure ajuda agora:</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-navy/70"><li><strong>SAMU:</strong> ligue <a href="tel:192" className="font-black text-purple underline underline-offset-2">192</a> ou procure uma UPA, pronto-socorro ou hospital.</li><li><strong>CVV:</strong> ligue gratuitamente para <a href="tel:188" className="font-black text-purple underline underline-offset-2">188</a>, disponível 24 horas.</li><li>Procure alguém de confiança que possa permanecer com você.</li></ul>
      <p className="mt-4 text-xs leading-5 text-navy/45">Este acesso não substitui o agente nem tenta avaliar a situação.</p>
    </div> : null}
    <button type="button" aria-expanded={open} aria-controls={panelId} aria-haspopup="dialog" onClick={() => setOpen((current) => !current)} className="rounded-full border border-navy/10 bg-white/95 px-4 py-2.5 text-xs font-black text-navy shadow-lg shadow-navy/10 transition-[background-color,transform] hover:bg-warm hover:text-purple active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transform-none motion-reduce:transition-none">Preciso de ajuda agora</button>
  </div>;
}
