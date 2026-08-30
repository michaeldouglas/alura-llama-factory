"use client";

import { useEffect, useRef, useState } from "react";

type DeleteKind = "records" | "conversations";

const DELETE_COPY: Record<DeleteKind, { title: string; description: string; successLabel: string }> = {
  records: {
    title: "Excluir registros de sentimentos?",
    description: "Todos os seus registros e relatos de sentimentos serão removidos definitivamente. As conversas não serão alteradas.",
    successLabel: "registros de sentimento",
  },
  conversations: {
    title: "Excluir conversas?",
    description: "Todas as conversas salvas e suas mensagens serão removidas definitivamente. Os registros de sentimentos continuarão disponíveis.",
    successLabel: "conversas",
  },
};

export default function AccountData() {
  const [pending, setPending] = useState<DeleteKind | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteKind | null>(null);
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deleteTarget) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [deleteTarget]);

  useEffect(() => {
    if (!deleteTarget) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setDeleteTarget(null);
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [deleteTarget, pending]);

  async function deleteData(kind: DeleteKind) {
    if (pending) return;

    setPending(kind);
    setNotice("");
    try {
      const isRecords = kind === "records";
      const response = await fetch(isRecords ? "/api/sentiment/records" : "/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: isRecords ? "EXCLUIR_REGISTROS" : "EXCLUIR_CONVERSAS" }),
      });
      const data = await response.json() as { deleted?: number; remaining?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir a exclusão.");
      if (data.remaining !== 0) throw new Error("A exclusão não foi concluída por completo. Atualize a página e tente novamente.");

      setDeleteTarget(null);
      setNotice(`${data.deleted || 0} ${DELETE_COPY[kind].successLabel} foram excluídos. Verificação concluída: nenhum dado desse tipo permanece.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível concluir a exclusão.");
    } finally {
      setPending(null);
    }
  }

  const copy = deleteTarget ? DELETE_COPY[deleteTarget] : null;

  return (
    <>
      <section aria-labelledby="data-title" className="mt-5 rounded-[2rem] border border-navy/8 bg-white/75 p-7 shadow-xl shadow-navy/5 sm:p-10">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-purple">seus dados</p>
        <h2 id="data-title" className="mt-3 text-2xl font-black">Conta e dados</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-navy/55">A EscutIA mantém sua identificação da conta Google, seus registros de sentimentos e as conversas que você salvou para que o espaço pessoal funcione. Esses dados ficam associados apenas ao seu usuário.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-navy/8 bg-warm/45 p-5">
            <h3 className="text-sm font-black text-navy">Exportar registros</h3>
            <p className="mt-2 text-sm leading-6 text-navy/50">Baixe seus registros de sentimentos com data, sentimento e relato, quando houver.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/api/sentiment/export?format=csv" download className="rounded-xl bg-navy px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Baixar CSV</a>
              <a href="/api/sentiment/export?format=json" download className="rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-xs font-black text-navy/65 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Baixar JSON</a>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/45 p-5">
            <h3 className="text-sm font-black text-navy">Excluir dados</h3>
            <p className="mt-2 text-sm leading-6 text-navy/50">As exclusões abaixo são separadas e permanentes. Escolha uma opção para revisar a ação antes de confirmar.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(Object.keys(DELETE_COPY) as DeleteKind[]).map((kind) => <button key={kind} type="button" onClick={() => setDeleteTarget(kind)} disabled={Boolean(pending)} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-wait disabled:opacity-50">{pending === kind ? "Excluindo…" : `Excluir ${kind === "records" ? "registros" : "conversas"}`}</button>)}
            </div>
          </div>
        </div>

        {notice ? <p className="mt-5 text-sm font-bold text-navy/65" role="status" aria-live="polite">{notice}</p> : null}
        <p className="mt-6 border-t border-navy/8 pt-5 text-xs leading-5 text-navy/45">Os botões acima removem somente os registros de sentimentos ou as conversas escolhidas. A conta Google e a identidade de acesso são gerenciadas pelo provedor de login e não são apagadas nesta tela; para sair, use o menu da conta.</p>
      </section>

      {deleteTarget && copy ? <div className="modal-backdrop-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-navy/45 p-5 backdrop-blur-sm motion-reduce:animate-none" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setDeleteTarget(null); }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" className="modal-enter w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white p-6 shadow-2xl shadow-navy/25 motion-reduce:animate-none sm:p-8">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-rose-600">confirmação necessária</p>
          <h2 id="delete-dialog-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy">{copy.title}</h2>
          <p id="delete-dialog-description" className="mt-3 text-sm leading-7 text-navy/60">{copy.description}</p>
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold leading-5 text-rose-800">Essa ação não poderá ser desfeita. A resposta será conferida no servidor para garantir que nenhum item desse tipo permaneça.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(pending)} className="rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-bold text-navy/60 transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={() => void deleteData(deleteTarget)} disabled={pending === deleteTarget} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none">{pending === deleteTarget ? "Excluindo…" : "Excluir definitivamente"}</button>
          </div>
        </div>
      </div> : null}
    </>
  );
}
