"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { CHECK_IN_OPTIONS, JOURNAL_TYPE_COPY, JOURNAL_TYPES, type ConversationSentiment, type JournalType } from "@/lib/conversation";

export type ConversationClosureData = {
  checkOutSentiment: ConversationSentiment | null;
  journalType: JournalType | null;
  journalText: string;
};

export default function ConversationClosure({ privateMode, busy, onCancel, onSave }: { privateMode: boolean; busy: boolean; onCancel: () => void; onSave: (data: ConversationClosureData) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [checkOutSentiment, setCheckOutSentiment] = useState<ConversationSentiment | null>(null);
  const [journalType, setJournalType] = useState<JournalType | null>(null);
  const [journalText, setJournalText] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable()[0];
    first?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus();
    };
  }, [busy, onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ checkOutSentiment, journalType: journalText.trim() ? journalType : null, journalText: journalText.trim() });
  }

  return <div className="modal-backdrop-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-navy/35 p-4 backdrop-blur-[2px] motion-reduce:animate-none"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="conversation-closure-title" className="modal-enter w-full max-w-xl rounded-[2rem] border border-white/70 bg-[#fffdfb] p-6 shadow-[0_28px_90px_rgba(26,31,61,0.22)] motion-reduce:animate-none sm:p-9"><p className="eyebrow">fechando por agora</p><h2 id="conversation-closure-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy sm:text-3xl">Como você está saindo?</h2><p className="mt-3 text-sm leading-7 text-navy/55">Se quiser, registre como você se percebe neste momento. Não é uma conclusão sobre você.</p><div className="mt-5 flex flex-wrap gap-2">{CHECK_IN_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={checkOutSentiment === option.value} onClick={() => setCheckOutSentiment((current) => current === option.value ? null : option.value)} className={`rounded-full border px-3.5 py-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none ${checkOutSentiment === option.value ? "border-purple bg-purple text-white" : "border-navy/10 bg-warm/45 text-navy/60 hover:border-purple/30 hover:text-purple"}`}>{option.label}</button>)}<button type="button" aria-pressed={checkOutSentiment === null} onClick={() => setCheckOutSentiment(null)} className="rounded-full border border-navy/10 bg-white px-3.5 py-2 text-xs font-black text-navy/45 transition-colors hover:border-navy/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none">Prefiro não responder</button></div><div className="mt-7 border-t border-navy/8 pt-6"><label htmlFor="conversation-journal" className="block text-sm font-black text-navy">Quer guardar algo desta conversa?</label><p className="mt-1 text-xs leading-5 text-navy/45">Uma frase, reflexão, conquista, preocupação ou próximo passo.</p><div className="mt-3 flex flex-wrap gap-2">{JOURNAL_TYPES.map((type) => <button key={type} type="button" aria-pressed={journalType === type} onClick={() => setJournalType((current) => current === type ? null : type)} className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none ${journalType === type ? "border-purple bg-purple/[0.08] text-purple" : "border-navy/10 text-navy/50 hover:bg-warm"}`}>{JOURNAL_TYPE_COPY[type]}</button>)}</div><textarea id="conversation-journal" name="conversation-journal" value={journalText} onChange={(event) => setJournalText(event.target.value)} maxLength={2000} rows={4} placeholder="Escreva algo para guardar…" className="mt-3 w-full resize-none rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm leading-7 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20 motion-reduce:transition-none" /></div>{privateMode ? <p className="mt-4 rounded-xl bg-warm/60 p-3 text-xs leading-5 text-navy/50">Como esta conversa é privada, o check-out e a anotação serão usados apenas para você encerrar este momento e não serão salvos.</p> : null}<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} disabled={busy} className="inline-flex items-center justify-center rounded-xl border border-navy/10 px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">Continuar conversando</button><button type="submit" form="conversation-closure-form" disabled={busy} className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-wait disabled:opacity-45 motion-reduce:transition-none">{busy ? "Salvando…" : "Encerrar e guardar"}</button></div><form id="conversation-closure-form" onSubmit={handleSubmit} className="hidden" /></div></div>;
}
