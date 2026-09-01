"use client";

import { FormEvent, ReactNode, useState } from "react";

import {
  CHECK_IN_OPTIONS,
  CONVERSATION_MODE_COPY,
  CONVERSATION_MODES,
  type ConversationMode,
  type ConversationSentiment,
} from "@/lib/conversation";

type RecentConversation = { id: string; title: string; updatedAt: string };

export function ToggleSwitch({ checked, onChange, children, name }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; name?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-navy/15 transition-[background-color] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-purple peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-purple/40 motion-reduce:transition-none motion-reduce:after:transition-none"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

export type ConversationSetupOptions = {
  mode: ConversationMode;
  checkInSentiment: ConversationSentiment | null;
  privateMode: boolean;
  resumeConversationId: string | null;
};

type ConversationSetupProps = {
  conversations: RecentConversation[];
  initialMode?: ConversationMode;
  initialPrivateMode?: boolean;
  initialResumeConversationId?: string | null;
  onStart: (options: ConversationSetupOptions) => void;
};

export default function ConversationSetup({ conversations, initialMode = "ouvir", initialPrivateMode = false, initialResumeConversationId = null, onStart }: ConversationSetupProps) {
  const [mode, setMode] = useState<ConversationMode>(initialMode);
  const [checkInSentiment, setCheckInSentiment] = useState<ConversationSentiment | null>(null);
  const [privateMode, setPrivateMode] = useState(initialPrivateMode);
  const [resumeConversationId, setResumeConversationId] = useState<string | null>(initialResumeConversationId);
  const latestConversation = conversations[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onStart({ mode, checkInSentiment, privateMode, resumeConversationId });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <section aria-labelledby="conversation-mode-title" className="rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-7">
        <p className="eyebrow text-[0.68rem]">escolha o ritmo</p>
        <h2 id="conversation-mode-title" className="mt-2 text-2xl font-black tracking-[-0.04em] text-navy">Como você quer ser acolhido?</h2>
        <div className="mt-5 grid gap-2">
          {CONVERSATION_MODES.map((option) => {
            const copy = CONVERSATION_MODE_COPY[option];
            const selected = mode === option;
            return <button key={option} type="button" aria-pressed={selected} onClick={() => setMode(option)} className={`rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 active:scale-[0.99] motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-purple bg-purple/[0.06]" : "border-navy/8 bg-warm/25 hover:border-purple/25"}`}><span className="block text-sm font-black text-navy">{copy.label}</span><span className="mt-1 block text-xs leading-5 text-navy/50">{copy.description}</span></button>;
          })}
        </div>
      </section>

      <div className="grid gap-5">
        <section aria-labelledby="conversation-check-in-title" className="rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-7">
          <p className="eyebrow text-[0.68rem]">antes de começar</p>
          <h2 id="conversation-check-in-title" className="mt-2 text-xl font-black tracking-[-0.04em] text-navy">Como você chega?</h2>
          <p className="mt-2 text-sm leading-6 text-navy/50">Opcional. É apenas o que você escolhe registrar agora.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CHECK_IN_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={checkInSentiment === option.value} onClick={() => setCheckInSentiment((current) => current === option.value ? null : option.value)} className={`rounded-full border px-3.5 py-2 text-xs font-black transition-[background-color,border-color,color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transform-none motion-reduce:transition-none ${checkInSentiment === option.value ? "border-purple bg-purple text-white" : "border-navy/10 bg-warm/45 text-navy/60 hover:border-purple/30 hover:text-purple"}`}>{option.label}</button>)}
            <button type="button" aria-pressed={checkInSentiment === null} onClick={() => setCheckInSentiment(null)} className={`rounded-full border px-3.5 py-2 text-xs font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none ${checkInSentiment === null ? "border-navy/20 bg-navy/5 text-navy" : "border-navy/10 bg-white text-navy/45 hover:border-navy/20"}`}>Prefiro não responder</button>
          </div>
        </section>

        <section aria-labelledby="conversation-privacy-title" className="rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-7">
          <ToggleSwitch checked={privateMode} onChange={setPrivateMode} name="private-mode">
            <span id="conversation-privacy-title" role="heading" aria-level={2} className="block text-sm font-black text-navy">Conversa sem registro</span>
            <p className="mt-1 text-xs leading-5 text-navy/50">{privateMode ? "Esta conversa não será criada nem aparecerá no histórico. Ao encerrá-la, o conteúdo sai da tela." : "A conversa será guardada no seu histórico para você retomar quando quiser."}</p>
          </ToggleSwitch>
        </section>

        {!privateMode && latestConversation ? <section aria-labelledby="conversation-resume-title" className="rounded-[1.75rem] border border-navy/8 bg-white p-5 shadow-[0_16px_50px_rgba(26,31,61,0.05)] sm:p-7"><h2 id="conversation-resume-title" className="text-sm font-black text-navy">Quer retomar um assunto?</h2><p className="mt-1 text-xs leading-5 text-navy/50">A nova conversa pode partir do seu registro mais recente.</p><div className="mt-3 grid gap-2"><button type="button" aria-pressed={resumeConversationId === null} onClick={() => setResumeConversationId(null)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none ${resumeConversationId === null ? "border-purple bg-purple/[0.05] text-purple" : "border-navy/8 text-navy/55 hover:bg-warm"}`}>Começar um assunto completamente novo</button><button type="button" aria-pressed={resumeConversationId === latestConversation.id} onClick={() => setResumeConversationId(latestConversation.id)} className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transition-none ${resumeConversationId === latestConversation.id ? "border-purple bg-purple/[0.05]" : "border-navy/8 hover:bg-warm"}`}><span className="block truncate text-xs font-bold text-navy">Continuar: {latestConversation.title}</span><span className="mt-1 block text-[0.68rem] text-navy/40">Última conversa atualizada</span></button></div></section> : null}
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3 border-t border-navy/8 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-navy/45">Você pode mudar de assunto ou encerrar quando quiser.</p><button type="submit" className="inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition-[background-color,transform] hover:bg-purple active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 motion-reduce:transform-none motion-reduce:transition-none">Começar conversa</button></div>
    </form>
  );
}
