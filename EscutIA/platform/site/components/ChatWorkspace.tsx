"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SentimentLabel = "negativo" | "neutro" | "positivo";

type UserProfile = {
  name: string | null;
  email: string | null;
  image: string | null;
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sentiment?: SentimentLabel | null;
};

type ChatWorkspaceProps = {
  user: UserProfile;
  currentSentiment: SentimentLabel | null;
  currentSentimentAt: string | null;
  initialConversations: ConversationSummary[];
};

const SENTIMENT_LABELS: Record<SentimentLabel, string> = {
  negativo: "Sentimento negativo",
  neutro: "Sentimento neutro",
  positivo: "Sentimento positivo",
};

const SENTIMENT_TONES: Record<SentimentLabel, string> = {
  negativo: "border-rose-200 bg-rose-50 text-rose-700",
  neutro: "border-amber-200 bg-amber-50 text-amber-700",
  positivo: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getDisplayName(user: UserProfile) {
  return user.name || user.email?.split("@")[0] || "pessoa";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function formatSentimentDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Avatar({ user, size = "normal" }: { user: UserProfile; size?: "normal" | "large" }) {
  const displayName = getDisplayName(user);
  const dimension = size === "large" ? 48 : 38;
  return user.image ? (
    <Image
      src={user.image}
      alt={`Foto de ${displayName}`}
      width={dimension}
      height={dimension}
      className={`${size === "large" ? "h-12 w-12" : "h-10 w-10"} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={`${size === "large" ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs"} grid shrink-0 place-items-center rounded-full bg-purple/15 font-black text-purple`}
    >
      {getInitials(displayName)}
    </span>
  );
}

function Logo() {
  return (
    <Link href="/" aria-label="EscutIA — voltar para a página inicial">
      <Image src="/logo.png" alt="EscutIA" width={132} height={45} priority className="h-auto w-[122px]" />
    </Link>
  );
}

function ExitIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" />
      <path d="M13 8l4 4-4 4M8.5 12H17" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function SentimentBadge({ sentiment }: { sentiment: SentimentLabel }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${SENTIMENT_TONES[sentiment]}`}>{SENTIMENT_LABELS[sentiment]}</span>;
}

export default function ChatWorkspace({ user, currentSentiment: initialSentiment, currentSentimentAt: initialSentimentAt, initialConversations }: ChatWorkspaceProps) {
  const displayName = getDisplayName(user);
  const [currentSentiment, setCurrentSentiment] = useState<SentimentLabel | null>(initialSentiment);
  const [currentSentimentAt, setCurrentSentimentAt] = useState<string | null>(initialSentimentAt);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sentimentDraft, setSentimentDraft] = useState("");
  const [busy, setBusy] = useState<"sending" | "validating" | "loading" | null>(null);
  const [notice, setNotice] = useState("Seu sentimento fica salvo apenas no seu espaço pessoal.");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [sentimentModalOpen, setSentimentModalOpen] = useState(!initialSentiment);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return conversations;
    return conversations.filter((conversation) => conversation.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  }, [conversations, search]);

  useEffect(() => {
    if (!sentimentModalOpen) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) setSentimentModalOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [busy, sentimentModalOpen]);

  function rememberConversation(id: string, title: string) {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== id);
      return [{ id, title: title.slice(0, 80), updatedAt: new Date().toISOString() }, ...next];
    });
  }

  async function createConversation(content: string) {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: content }),
    });
    const data = (await response.json()) as { conversation?: ConversationSummary; error?: string };
    if (!response.ok || !data.conversation) throw new Error(data.error || "Não foi possível criar a conversa.");
    return data.conversation;
  }

  async function persistMessage(content: string, conversationId: string | null) {
    const conversation = conversationId ? null : await createConversation(content);
    const id = conversationId || conversation?.id;
    if (!id) throw new Error("Não foi possível identificar a conversa.");
    const response = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Não foi possível salvar a mensagem.");
    return { id, title: conversation?.title || content };
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setNotice("Salvando sua mensagem…");
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", content }]);
    setBusy("sending");
    try {
      const saved = await persistMessage(content, activeConversationId);
      setActiveConversationId(saved.id);
      rememberConversation(saved.id, saved.title);
      setNotice("Mensagem salva. Quando quiser, você pode atualizar seu sentimento no card acima.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a mensagem.");
    } finally {
      setBusy(null);
    }
  }

  async function handleValidateSentiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = sentimentDraft.trim();
    if (!content || busy) return;
    setBusy("validating");
    setNotice("Analisando… a primeira avaliação pode levar alguns instantes enquanto o modelo é carregado.");
    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = (await response.json()) as { sentiment?: SentimentLabel; sentimentAt?: string; error?: string };
      if (!response.ok || !data.sentiment) throw new Error(data.error || "Não foi possível validar o sentimento.");
      setCurrentSentiment(data.sentiment);
      setCurrentSentimentAt(data.sentimentAt || new Date().toISOString());
      setSentimentDraft("");
      setSentimentModalOpen(false);
      setNotice("Seu sentimento foi atualizado. Isso é um apoio para a conversa, não um diagnóstico.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível validar o sentimento.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSelectConversation(id: string) {
    if (busy) return;
    setBusy("loading");
    setSidebarOpen(false);
    setConversationOpen(true);
    setNotice("Carregando conversa…");
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = (await response.json()) as { conversation?: { messages: ChatMessage[] }; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Não foi possível carregar a conversa.");
      setActiveConversationId(id);
      setMessages(data.conversation.messages);
      setNotice("Conversa carregada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar a conversa.");
    } finally {
      setBusy(null);
    }
  }

  function handleNewConversation() {
    if (busy) return;
    setActiveConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
    setConversationOpen(true);
    setNotice("Nova conversa pronta. Escreva no seu ritmo.");
  }

  function handleToggleConversation() {
    if (conversationOpen) {
      setConversationOpen(false);
      return;
    }

    setSidebarOpen(false);
    setConversationOpen(true);
  }

  function openSentimentModal() {
    if (busy) return;
    setSentimentDraft("");
    setSentimentModalOpen(true);
  }

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#f9f6f3] text-navy">
      <div className="flex min-h-screen">
        {sidebarOpen ? <button type="button" aria-label="Fechar painel lateral" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-navy/20 lg:hidden" /> : null}

        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[min(88vw,320px)] flex-col border-r border-navy/8 bg-white shadow-xl transition-[transform,width] duration-300 ease-out lg:static lg:h-screen lg:shadow-none lg:translate-x-0 ${sidebarOpen ? "translate-x-0 lg:w-[300px]" : "-translate-x-full lg:w-0 lg:overflow-hidden"}`}>
          <div className="border-b border-navy/8 px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <Link href="/" aria-label="Sair do chat e voltar para a página inicial" title="Sair do chat" className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">
                <ExitIcon />
              </Link>
            </div>

            <div className="mt-8 flex items-start gap-3">
              <Avatar user={user} size="large" />
              <div className="min-w-0 pt-1">
                <p className="truncate text-sm font-black text-navy">{displayName}</p>
                <p className="mt-0.5 text-xs text-navy/50">seu espaço pessoal</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-purple/10 bg-purple/[0.045] p-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-navy/40">Seu sentimento hoje</p>
              {currentSentiment && currentSentimentAt ? (
                <div className="mt-3">
                  <SentimentBadge sentiment={currentSentiment} />
                  <p className="mt-2 text-xs leading-5 text-navy/50">Registrado em {formatSentimentDate(currentSentimentAt)}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-5 text-navy/55">Ainda não registrado</p>
              )}
              <button type="button" onClick={openSentimentModal} disabled={Boolean(busy)} className="mt-3 text-xs font-black text-purple transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50">
                {currentSentiment ? "Editar sentimento" : "Registrar agora"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((current) => !current)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-navy/40">
                Histórico
                <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[0.65rem]">{filteredConversations.length}</span>
              </span>
              <ChevronIcon open={historyOpen} />
            </button>

            {historyOpen ? (
              <div className="mt-2">
                <label htmlFor="conversation-search" className="sr-only">Buscar conversas</label>
                <div className="relative">
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40">
                    <path d="m14.5 14.5 3 3m-1.5-7a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                  </svg>
                  <input id="conversation-search" name="conversation-search" type="search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversas…" className="w-full rounded-xl border border-navy/10 bg-warm/70 py-3 pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" />
                </div>

                <div className="mt-3">
                  {filteredConversations.length ? (
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <button key={conversation.id} type="button" onClick={() => void handleSelectConversation(conversation.id)} className={`w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 ${activeConversationId === conversation.id ? "bg-warm" : ""}`}>
                          <p className="truncate text-sm font-bold text-navy">{conversation.title}</p>
                          <p className="mt-1 text-xs text-navy/40">{formatConversationDate(conversation.updatedAt)}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-5 text-sm leading-6 text-navy/45">Seu histórico está vazio. As conversas aparecerão aqui quando você começar a usar esse espaço.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-navy/8 p-4">
            <button type="button" onClick={handleNewConversation} disabled={Boolean(busy)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50">
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Nova conversa
            </button>
            <Link href="/dashboard" className="mt-3 block text-center text-xs font-bold text-navy/50 transition-colors hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">Voltar ao dashboard</Link>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-navy/8 bg-white/55 px-5 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              {!conversationOpen ? (
                <button type="button" aria-label={sidebarOpen ? "Fechar painel lateral" : "Abrir painel lateral"} title={sidebarOpen ? "Fechar painel lateral" : "Abrir painel lateral"} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((current) => !current)} className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">
                  <PanelIcon />
                </button>
              ) : null}
              {!sidebarOpen || conversationOpen ? <Logo /> : null}
            </div>
            {!sidebarOpen || conversationOpen ? (
              <div className="flex items-center gap-2">
                <Link href="/" aria-label="Sair do chat e voltar para a página inicial" title="Sair do chat" className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 lg:hidden">
                  <ExitIcon />
                </Link>
                <span className="hidden max-w-[9rem] truncate text-sm font-bold text-navy sm:inline">{displayName}</span>
                <Avatar user={user} />
              </div>
            ) : null}
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
              {!sidebarOpen && !conversationOpen ? (
                <button type="button" onClick={() => setSidebarOpen(true)} className="hidden items-center gap-2 self-start text-xs font-black uppercase tracking-[0.12em] text-purple transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 lg:inline-flex">
                  <PanelIcon />
                  Abrir painel
                </button>
              ) : null}

              {!conversationOpen ? (
                <section aria-labelledby="sentiment-heading" className="relative overflow-hidden rounded-[2rem] border border-navy/8 bg-white px-6 py-7 shadow-[0_20px_60px_rgba(26,31,61,0.07)] sm:px-10 sm:py-10">
                <div aria-hidden="true" className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple/10 blur-2xl" />
                <div className="relative">
                  <p className="eyebrow">seu espaço pessoal</p>
                  <h1 id="sentiment-heading" className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.05em] text-balance sm:text-5xl">Como você está se sentindo hoje?</h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Antes de conversar, registre o que está presente em você agora. Esse é um ponto de partida para se observar com mais calma.</p>

                  <div className="mt-8 flex flex-col gap-5 border-t border-navy/8 pt-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      {currentSentiment && currentSentimentAt ? (
                        <>
                          <p className="text-sm font-black text-navy">Seu sentimento hoje</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <SentimentBadge sentiment={currentSentiment} />
                            <p className="text-xs text-navy/45">Registrado em {formatSentimentDate(currentSentimentAt)}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-black text-navy">Ainda não registramos seu sentimento</p>
                          <p className="mt-1 text-sm text-navy/50">Leva só alguns instantes e pode ser atualizado a qualquer momento.</p>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={openSentimentModal} disabled={Boolean(busy)} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50">
                      {currentSentiment ? "Editar sentimento" : "Registrar sentimento"}
                    </button>
                  </div>
                </div>
                </section>
              ) : null}

              {!conversationOpen ? <p className="px-1 text-xs leading-5 text-navy/45" aria-live="polite">{notice}</p> : null}

              <section aria-labelledby="conversation-heading" className={`overflow-hidden rounded-[1.5rem] border border-navy/8 bg-white/75 ${conversationOpen ? "mx-auto w-full max-w-3xl shadow-[0_20px_60px_rgba(26,31,61,0.07)]" : ""}`}>
                <button type="button" aria-expanded={conversationOpen} onClick={handleToggleConversation} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple/50 sm:px-8">
                  <div>
                    <p className="eyebrow text-[0.68rem]">seu próximo passo</p>
                    <h2 id="conversation-heading" className="mt-2 text-xl font-black tracking-[-0.03em]">Seu espaço de conversa</h2>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-black text-purple">
                    {conversationOpen ? <span role="presentation" onClick={(event) => event.stopPropagation()}><span className="mr-2 inline-flex items-center gap-2" title="Abrir painel lateral"><PanelIcon /></span></span> : null}
                    {conversationOpen ? "Fechar" : "Abrir"}
                    <ChevronIcon open={conversationOpen} />
                  </span>
                </button>

                {conversationOpen ? (
                  <div className="border-t border-navy/8">
                    <div className="max-h-[28rem] overflow-y-auto px-6 py-6 sm:px-8">
                      {messages.length ? (
                        <div className="flex flex-col gap-5">
                          {messages.map((message) => (
                            <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                              {message.role === "assistant" ? <div aria-hidden="true" className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-black text-white">E</div> : null}
                              <div className={`max-w-[min(42rem,88%)] rounded-2xl px-4 py-3 text-[0.95rem] leading-7 shadow-sm ${message.role === "user" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-navy/8 bg-white text-navy/80"}`}>
                                <p className="break-words">{message.content}</p>
                                {message.sentiment ? <p className="mt-3"><SentimentBadge sentiment={message.sentiment} /></p> : null}
                              </div>
                              {message.role === "user" ? <Avatar user={user} /> : null}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-navy/12 bg-warm/50 px-5 py-8 text-center">
                          <p className="text-sm font-bold text-navy/65">Quando quiser, este espaço estará aqui para você.</p>
                          <p className="mt-1 text-sm leading-6 text-navy/45">O registro do sentimento acima é o primeiro passo. A conversa pode começar depois.</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-navy/8 bg-white/70 px-6 py-5 sm:px-8">
                      <form onSubmit={(event) => void handleSend(event)}>
                        <label htmlFor="chat-message" className="sr-only">Escreva uma mensagem</label>
                        <textarea id="chat-message" name="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={3} placeholder="Escreva como você está se sentindo…" className="w-full resize-none rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm leading-6 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" />
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-navy/45">Mensagens ficam no seu histórico privado.</p>
                          <button type="submit" disabled={!draft.trim() || Boolean(busy)} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">
                            {busy === "sending" ? "Enviando…" : "Enviar mensagem"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </section>
      </div>

      {sentimentModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-navy/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="sentiment-modal-title" aria-describedby="sentiment-modal-description" className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-[#fffdfb] p-6 shadow-[0_28px_90px_rgba(26,31,61,0.22)] sm:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="eyebrow">um instante para você</p>
                <h2 id="sentiment-modal-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy sm:text-3xl">Como você está se sentindo?</h2>
              </div>
              <button type="button" aria-label="Fechar registro de sentimento" title="Fechar" onClick={() => setSentimentModalOpen(false)} disabled={busy === "validating"} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy/45 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-40">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"><path d="m7 7 10 10M17 7 7 17" /></svg>
              </button>
            </div>
            <p id="sentiment-modal-description" className="mt-4 text-sm leading-7 text-navy/55">Não precisa encontrar as palavras perfeitas. Conte do jeito que conseguir; vamos observar o sentimento predominante juntos.</p>

            <form onSubmit={(event) => void handleValidateSentiment(event)} className="mt-7">
              <label htmlFor="sentiment-message" className="mb-2 block text-sm font-black text-navy">O que está acontecendo aí dentro?</label>
              <textarea id="sentiment-message" name="sentiment-message" value={sentimentDraft} onChange={(event) => setSentimentDraft(event.target.value)} maxLength={2000} rows={6} placeholder="Por exemplo: hoje acordei mais leve porque…" className="w-full resize-none rounded-2xl border border-navy/12 bg-white px-4 py-3 text-sm leading-7 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" />
              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-navy/40">Seu registro é privado e pode ser atualizado depois.</p>
                <button type="submit" disabled={!sentimentDraft.trim() || Boolean(busy)} className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">
                  {busy === "validating" ? "Analisando…" : "Registrar sentimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
