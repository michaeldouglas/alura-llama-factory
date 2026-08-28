"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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
  sentiment?: "negativo" | "neutro" | "positivo" | null;
};

type ChatWorkspaceProps = {
  user: UserProfile;
  initialConversations: ConversationSummary[];
};

const SENTIMENT_LABELS = {
  negativo: "Sentimento negativo",
  neutro: "Sentimento neutro",
  positivo: "Sentimento positivo",
} as const;

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

function OpeningMessage({ firstName }: { firstName: string }): ChatMessage {
  return {
    id: "opening-message",
    role: "assistant",
    content: `Olá, ${firstName}. Como você está se sentindo hoje?`,
  };
}

export default function ChatWorkspace({ user, initialConversations }: ChatWorkspaceProps) {
  const displayName = getDisplayName(user);
  const firstName = displayName.split(/\s+/)[0] || "pessoa";
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([OpeningMessage({ firstName })]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"sending" | "validating" | "loading" | null>(null);
  const [notice, setNotice] = useState("Você está em um espaço privado e pode escrever com calma.");

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return conversations;
    return conversations.filter((conversation) => conversation.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  }, [conversations, search]);

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
      setNotice("Mensagem salva. Quando quiser, você pode validar o sentimento deste texto.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível salvar a mensagem.");
    } finally {
      setBusy(null);
    }
  }

  async function handleValidate() {
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setNotice("Analisando… a primeira avaliação pode levar alguns instantes enquanto o modelo é carregado.");
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", content }]);
    setBusy("validating");
    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, conversationId: activeConversationId }),
      });
      const data = (await response.json()) as { conversationId?: string; sentiment?: ChatMessage["sentiment"]; response?: string; error?: string };
      if (!response.ok || !data.conversationId || !data.sentiment || !data.response) {
        throw new Error(data.error || "Não foi possível validar o sentimento.");
      }
      setActiveConversationId(data.conversationId);
      rememberConversation(data.conversationId, content);
      setMessages((current) => [...current, { id: `local-${Date.now()}-result`, role: "assistant", content: data.response!, sentiment: data.sentiment }]);
      setNotice("Análise concluída. O resultado é um apoio para a conversa, não um diagnóstico.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível validar o sentimento.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSelectConversation(id: string) {
    if (busy) return;
    setBusy("loading");
    setNotice("Carregando conversa…");
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = (await response.json()) as { conversation?: { messages: ChatMessage[] }; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Não foi possível carregar a conversa.");
      setActiveConversationId(id);
      setMessages([OpeningMessage({ firstName }), ...data.conversation.messages]);
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
    setMessages([OpeningMessage({ firstName })]);
    setNotice("Nova conversa pronta. Escreva no seu ritmo.");
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#f9f6f3] text-navy">
      <div className="flex min-h-screen">
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-navy/8 bg-white/70 lg:flex">
          <div className="border-b border-navy/8 px-6 py-6">
            <Logo />
            <div className="mt-10 flex items-center gap-3">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-navy">{displayName}</p>
                <p className="mt-0.5 text-xs text-navy/50">seu espaço pessoal</p>
              </div>
            </div>
            <label htmlFor="conversation-search" className="mt-8 block text-xs font-black uppercase tracking-[0.14em] text-navy/45">
              Buscar conversas
            </label>
            <div className="relative mt-2">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40">
                <path d="m14.5 14.5 3 3m-1.5-7a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              <input
                id="conversation-search"
                name="conversation-search"
                type="search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar conversas…"
                className="w-full rounded-xl border border-navy/10 bg-warm/70 py-3 pl-10 pr-3 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-purple"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy/35">Histórico</p>
              <span className="text-xs font-bold text-navy/35">{filteredConversations.length}</span>
            </div>
            {filteredConversations.length ? (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void handleSelectConversation(conversation.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-warm ${activeConversationId === conversation.id ? "bg-warm" : ""}`}
                  >
                    <p className="truncate text-sm font-bold text-navy">{conversation.title}</p>
                    <p className="mt-1 text-xs text-navy/40">{formatConversationDate(conversation.updatedAt)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-5 text-sm leading-6 text-navy/45">Suas conversas aparecerão aqui quando você começar a escrever.</p>
            )}
          </div>
          <div className="border-t border-navy/8 p-4">
            <button type="button" onClick={handleNewConversation} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white transition hover:bg-purple">
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Nova conversa
            </button>
            <Link href="/dashboard" className="mt-3 block text-center text-xs font-bold text-navy/50 transition hover:text-purple">Voltar ao dashboard</Link>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-navy/8 bg-white/55 px-5 py-4 lg:hidden">
            <Logo />
            <div className="flex items-center gap-2 text-right">
              <span className="max-w-[9rem] truncate text-sm font-bold text-navy">{displayName}</span>
              <Avatar user={user} />
            </div>
          </header>

          <header className="border-b border-navy/8 bg-white/45 px-5 py-6 sm:px-8 lg:px-12">
            <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-4">
              <div>
                <p className="eyebrow">seu espaço de conversa</p>
                <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Como você está se sentindo hoje?</h1>
                <p className="mt-2 text-sm leading-6 text-navy/55">Escreva o que estiver passando pela sua cabeça. Você pode começar por onde quiser.</p>
              </div>
              <Link href="/" aria-label="Voltar para a página inicial" className="hidden rounded-full border border-navy/10 px-4 py-2 text-xs font-bold text-navy/60 transition hover:border-purple hover:text-purple sm:inline-flex">Sair do chat</Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              {messages.map((message) => (
                <article key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-xs font-black text-white">E</div>}
                  <div className={`max-w-[min(42rem,88%)] rounded-2xl px-4 py-3 text-[0.95rem] leading-7 shadow-sm ${message.role === "user" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-navy/8 bg-white text-navy/80"}`}>
                    <p>{message.content}</p>
                    {message.sentiment && <p className="mt-3 inline-flex rounded-full bg-purple/10 px-3 py-1 text-xs font-bold text-purple">{SENTIMENT_LABELS[message.sentiment]}</p>}
                  </div>
                  {message.role === "user" && <Avatar user={user} />}
                </article>
              ))}
            </div>
          </div>

          <div className="border-t border-navy/8 bg-white/65 px-5 py-5 sm:px-8 lg:px-12">
            <form onSubmit={(event) => void handleSend(event)} className="mx-auto w-full max-w-4xl">
              <label htmlFor="chat-message" className="sr-only">Escreva sua mensagem</label>
              <textarea
                id="chat-message"
                name="chat-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Escreva como você está se sentindo…"
                className="w-full resize-none rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm leading-6 text-navy outline-none transition placeholder:text-navy/35 focus:border-purple"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-navy/45" aria-live="polite">{notice}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => void handleValidate()} disabled={!draft.trim() || Boolean(busy)} className="rounded-xl border border-purple/25 px-4 py-2.5 text-xs font-bold text-purple transition hover:border-purple hover:bg-purple/5 disabled:cursor-not-allowed disabled:opacity-45">{busy === "validating" ? "Validando…" : "Validar sentimento"}</button>
                  <button type="submit" disabled={!draft.trim() || Boolean(busy)} className="rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white transition hover:bg-purple disabled:cursor-not-allowed disabled:opacity-45">{busy === "sending" ? "Enviando…" : "Enviar"}</button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
