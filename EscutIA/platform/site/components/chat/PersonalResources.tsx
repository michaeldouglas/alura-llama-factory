"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { RESOURCE_KIND_COPY, type ResourceKind } from "@/lib/conversation";

type PersonalResource = { id: string; kind: ResourceKind; content: string };

export default function PersonalResources({ onUse }: { onUse: (content: string) => void }) {
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<PersonalResource[]>([]);
  const [kind, setKind] = useState<ResourceKind>("atividade");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!open || resources.length) return;
    void loadResources();
  }, [open, resources.length]);

  async function loadResources() {
    try {
      const response = await fetch("/api/resources");
      const data = await response.json() as { resources?: PersonalResource[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar seus recursos.");
      setResources(data.resources ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar seus recursos.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, content: trimmed }) });
      const data = await response.json() as { resource?: PersonalResource; error?: string };
      if (!response.ok || !data.resource) throw new Error(data.error || "Não foi possível guardar o recurso.");
      setResources((current) => [data.resource as PersonalResource, ...current]);
      setContent("");
      setNotice("Recurso guardado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível guardar o recurso.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este recurso pessoal?")) return;
    const response = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setNotice("Não foi possível excluir o recurso agora.");
      return;
    }
    setResources((current) => current.filter((resource) => resource.id !== id));
    setNotice("Recurso excluído.");
  }

  return <section className="border-t border-navy/8 px-4 py-4" aria-labelledby="personal-resources-title"><button type="button" aria-expanded={open} aria-controls="personal-resources-panel" onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none"><span><span id="personal-resources-title" className="block text-xs font-black uppercase tracking-[0.14em] text-navy/40">Recursos pessoais</span><span className="mt-1 block text-xs text-navy/45">Coisas úteis que você reconhece</span></span><ChevronDown aria-hidden="true" className={`h-4 w-4 text-navy/45 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} /></button>{open ? <div id="personal-resources-panel" className="mt-3" aria-live="polite"><form onSubmit={(event) => void handleSubmit(event)}><label htmlFor="resource-kind" className="sr-only">Tipo de recurso</label><select id="resource-kind" name="resource-kind" value={kind} onChange={(event) => setKind(event.target.value as ResourceKind)} className="w-full rounded-xl border border-navy/10 bg-warm/60 px-3 py-2.5 text-xs font-bold text-navy outline-none focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20"><option value="atividade">Atividade</option><option value="pessoa">Pessoa de confiança</option><option value="lugar">Lugar seguro</option><option value="frase">Frase</option><option value="lembranca">Lembrança positiva</option></select><label htmlFor="resource-content" className="sr-only">Conteúdo do recurso</label><textarea id="resource-content" name="resource-content" value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} rows={2} placeholder="Ex.: caminhar no parque…" className="mt-2 w-full resize-none rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-xs leading-5 text-navy outline-none focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" /><button type="submit" disabled={!content.trim() || busy} className="mt-2 w-full rounded-xl bg-navy px-3 py-2.5 text-xs font-black text-white transition-[background-color,transform] hover:bg-purple active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transform-none motion-reduce:transition-none">{busy ? "Guardando…" : "Guardar recurso"}</button></form>{notice ? <p className="mt-2 text-xs leading-5 text-navy/50">{notice}</p> : null}{resources.length ? <div className="mt-4 space-y-2"><p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-navy/35">Para revisitar</p>{resources.map((resource) => <div key={resource.id} className="rounded-xl bg-warm/50 p-3"><p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-purple/70">{RESOURCE_KIND_COPY[resource.kind]}</p><p className="mt-1 break-words text-xs leading-5 text-navy/70">{resource.content}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { onUse(resource.content); setNotice("Recurso colocado na mensagem."); }} className="text-[0.68rem] font-black text-purple hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/40">Revisitar na conversa</button><button type="button" onClick={() => void handleDelete(resource.id)} className="text-[0.68rem] font-bold text-navy/40 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">Excluir</button></div></div>)}</div> : <p className="mt-4 text-xs leading-5 text-navy/40">Ainda não há recursos guardados. Você decide o que vale guardar.</p>}</div> : null}</section>;
}
