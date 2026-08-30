"use client";

import { useState } from "react";

export default function AccountData() {
  const [pending, setPending] = useState<"records" | "conversations" | null>(null);
  const [notice, setNotice] = useState("");

  async function deleteData(kind: "records" | "conversations") {
    const isRecords = kind === "records";
    const confirmed = window.confirm(isRecords
      ? "Excluir todos os registros de sentimentos? Essa ação não poderá ser desfeita."
      : "Excluir todas as conversas? Essa ação não poderá ser desfeita.");
    if (!confirmed) return;

    setPending(kind);
    setNotice("");
    try {
      const response = await fetch(isRecords ? "/api/sentiment/records" : "/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: isRecords ? "EXCLUIR_REGISTROS" : "EXCLUIR_CONVERSAS" }),
      });
      const data = await response.json() as { deleted?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir a exclusão.");
      setNotice(`${data.deleted || 0} ${isRecords ? "registro(s) de sentimento" : "conversa(s)"} foram excluído(s).`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível concluir a exclusão.");
    } finally {
      setPending(null);
    }
  }

  return <section aria-labelledby="data-title" className="mt-5 rounded-[2rem] border border-navy/8 bg-white/75 p-7 shadow-xl shadow-navy/5 sm:p-10"><p className="text-sm font-black uppercase tracking-[0.14em] text-purple">seus dados</p><h2 id="data-title" className="mt-3 text-2xl font-black">Conta e dados</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-navy/55">A EscutIA mantém sua identificação da conta Google, seus registros de sentimentos e as conversas que você salvou para que o espaço pessoal funcione. Esses dados ficam associados apenas ao seu usuário.</p><div className="mt-7 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-navy/8 bg-warm/45 p-5"><h3 className="text-sm font-black text-navy">Exportar registros</h3><p className="mt-2 text-sm leading-6 text-navy/50">Baixe seus registros de sentimentos com data, sentimento e relato, quando houver.</p><div className="mt-4 flex flex-wrap gap-2"><a href="/api/sentiment/export?format=csv" download className="rounded-xl bg-navy px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Baixar CSV</a><a href="/api/sentiment/export?format=json" download className="rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-xs font-black text-navy/65 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Baixar JSON</a></div></div><div className="rounded-2xl border border-rose-200/70 bg-rose-50/45 p-5"><h3 className="text-sm font-black text-navy">Excluir dados</h3><p className="mt-2 text-sm leading-6 text-navy/50">As exclusões abaixo são separadas e permanentes. Confirme cada uma antes de continuar.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button type="button" onClick={() => void deleteData("records")} disabled={Boolean(pending)} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-wait disabled:opacity-50">{pending === "records" ? "Excluindo…" : "Excluir registros"}</button><button type="button" onClick={() => void deleteData("conversations")} disabled={Boolean(pending)} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-wait disabled:opacity-50">{pending === "conversations" ? "Excluindo…" : "Excluir conversas"}</button></div></div></div>{notice ? <p className="mt-5 text-sm font-bold text-navy/65" role="status" aria-live="polite">{notice}</p> : null}<p className="mt-6 border-t border-navy/8 pt-5 text-xs leading-5 text-navy/45">A exclusão completa da conta não está disponível nesta etapa, porque a identidade é gerenciada pelo fluxo seguro do NextAuth/Google. Você pode encerrar a sessão pelo menu da conta.</p></section>;
}
