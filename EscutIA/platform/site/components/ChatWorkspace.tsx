"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

type AgentEvent =
  | { type: "token"; content: string }
  | {
      type: "done";
      message: ChatMessage;
      userMessage: { id: string };
      sentiment: SentimentLabel | null;
      sentimentAt: string | null;
    }
  | { type: "error"; message: string };

type ChatWorkspaceProps = {
  user: UserProfile;
  currentSentiment: SentimentLabel | null;
  currentSentimentAt: string | null;
  initialConversations: ConversationSummary[];
  initialConversationId?: string | null;
  initialMessages?: ChatMessage[];
};

function normalizeConversationMessages(messages: ChatMessage[]) {
  return messages.map((message, index) => {
    if (message.role !== "assistant") return { ...message, sentiment: null };
    if (message.sentiment) return message;

    const previousMessage = messages[index - 1];
    return previousMessage?.role === "user" && previousMessage.sentiment
      ? { ...message, sentiment: previousMessage.sentiment }
      : message;
  });
}

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

const SENTIMENT_ICON_TONES: Record<SentimentLabel, string> = {
  negativo: "text-rose-500",
  neutro: "text-amber-500",
  positivo: "text-emerald-500",
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

function formatDateInputValue(value: Date) {
  return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
}

function getLocalDateKey(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : formatDateInputValue(date);
}

function formatHistoryDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
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

function isSentimentFromToday(value: string) {
  const registeredAt = new Date(value);
  const today = new Date();
  return registeredAt.getFullYear() === today.getFullYear()
    && registeredAt.getMonth() === today.getMonth()
    && registeredAt.getDate() === today.getDate();
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

function EscutiaAvatar() {
  return (
    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
      <Image src="/escutia-mark.png" alt="EscutIA" width={1254} height={1254} className="h-full w-full object-contain" />
    </div>
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

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Z" />
      <path d="M7.5 9h9M7.5 12h9M7.5 15h5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="m4 4 16 8-16 8 3-8-3-8Z" />
      <path d="M7 12h13" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4H6.5A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="m5 12.5 4.2 4.2L19 7" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="m14.5 5.5 4 4M6 18l1-4.5L16.5 4a2.12 2.12 0 0 1 3 3L10 16.5 6 18Z" />
      <path d="M13 7.5 17 11.5" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M5 7h14M10 4h4l1 3H9l1-3ZM7 7l.7 12.5h8.6L17 7M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

function LogoMark() {
  return (
    <Link href="/" aria-label="EscutIA — voltar para a página inicial" title="EscutIA" className="flex h-11 w-11 shrink-0 items-center overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">
      <Image src="/logo.png" alt="EscutIA" width={132} height={45} priority className="h-[45px] w-[132px] max-w-none" />
    </Link>
  );
}

function CollapsedIconButton({ label, onClick, children, disabled = false }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="grid h-11 w-11 place-items-center rounded-2xl text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none">
      {children}
    </button>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

function EscutiaMoodIcon({ sentiment, className = "h-5 w-5" }: { sentiment: SentimentLabel; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M16 4.5C9.2 1.6 3.5 5.6 3.5 12.2c0 6.1 4.2 10.1 10.5 12.6V29l4.2-3.5c6.1-2.3 10.3-6.8 10.3-13.3C28.5 5.6 22.8 1.6 16 4.5Z" className={SENTIMENT_ICON_TONES[sentiment]} />
      {sentiment === "positivo" ? (
        <>
          <path d="M9.5 12.5c1.1-1.4 2.6-1.4 3.7 0M18.8 12.5c1.1-1.4 2.6-1.4 3.7 0" />
          <path d="M11 17c1.5 2 3 2.8 5 2.8s3.5-.8 5-2.8" />
        </>
      ) : null}
      {sentiment === "neutro" ? (
        <>
          <circle cx="11.5" cy="12.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="20.5" cy="12.5" r=".8" fill="currentColor" stroke="none" />
          <path d="M11.5 18h9" />
        </>
      ) : null}
      {sentiment === "negativo" ? (
        <>
          <path d="M9.5 13.5c1.1-1.4 2.6-1.4 3.7 0M18.8 13.5c1.1-1.4 2.6-1.4 3.7 0" />
          <path d="M11 20c1.5-2 3-2.8 5-2.8s3.5.8 5 2.8" />
        </>
      ) : null}
    </svg>
  );
}

function SentimentBadge({ sentiment, className = "" }: { sentiment: SentimentLabel; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${SENTIMENT_TONES[sentiment]} ${className}`}>
      <EscutiaMoodIcon sentiment={sentiment} className="h-5 w-5 shrink-0" />
      <span>{SENTIMENT_LABELS[sentiment]}</span>
    </span>
  );
}

const MARKDOWN_TONES = {
  assistant: {
    text: "text-navy/80",
    muted: "text-navy/65",
    border: "border-navy/15",
    code: "bg-warm text-navy",
    link: "text-purple decoration-purple/40 hover:text-purple",
  },
  user: {
    text: "text-white",
    muted: "text-white/80",
    border: "border-white/25",
    code: "bg-white/10 text-white",
    link: "text-white underline decoration-white/50 hover:text-white",
  },
} as const;

function MarkdownMessage({ content, tone }: { content: string; tone: keyof typeof MARKDOWN_TONES }) {
  const colors = MARKDOWN_TONES[tone];

  return (
    <div className={`min-w-0 max-w-full overflow-x-auto break-words ${colors.text}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => <h3 className="mb-3 mt-5 text-lg font-black leading-tight tracking-[-0.02em] first:mt-0">{children}</h3>,
          h2: ({ children }) => <h4 className="mb-2.5 mt-5 text-base font-black leading-tight first:mt-0">{children}</h4>,
          h3: ({ children }) => <h5 className="mb-2 mt-4 text-[0.95rem] font-black leading-tight first:mt-0">{children}</h5>,
          ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1.5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className={`font-semibold underline decoration-1 underline-offset-2 transition-colors ${colors.link} motion-reduce:transition-none`}>
              {children}
            </a>
          ),
          blockquote: ({ children }) => <blockquote className={`my-3 border-l-2 pl-4 italic ${colors.border} ${colors.muted}`}>{children}</blockquote>,
          strong: ({ children }) => <strong className="font-black">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className={colors.muted}>{children}</del>,
          hr: () => <hr className={`my-5 ${colors.border}`} />,
          pre: ({ children }) => <pre className={`my-3 max-w-full overflow-x-auto rounded-xl px-3.5 py-3 text-[0.82rem] leading-6 ${colors.code}`}>{children}</pre>,
          code: ({ children, className }) => <code className={`${className ?? ""} rounded-md px-1.5 py-0.5 text-[0.88em] ${colors.code}`}>{children}</code>,
          table: ({ children }) => <table className={`my-3 min-w-[32rem] w-full border-collapse text-left text-[0.86em] ${colors.border}`}>{children}</table>,
          thead: ({ children }) => <thead className={colors.code}>{children}</thead>,
          th: ({ children }) => <th className={`border px-3 py-2 font-black ${colors.border}`}>{children}</th>,
          td: ({ children }) => <td className={`border px-3 py-2 align-top ${colors.border}`}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatWorkspace({ user, currentSentiment: initialSentiment, currentSentimentAt: initialSentimentAt, initialConversations, initialConversationId, initialMessages }: ChatWorkspaceProps) {
  const displayName = getDisplayName(user);
  const router = useRouter();
  const [currentSentiment, setCurrentSentiment] = useState<SentimentLabel | null>(initialSentiment);
  const [currentSentimentAt, setCurrentSentimentAt] = useState<string | null>(initialSentimentAt);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => normalizeConversationMessages(initialMessages ?? []));
  const [search, setSearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [sentimentDraft, setSentimentDraft] = useState("");
  const [busy, setBusy] = useState<"sending" | "validating" | "loading" | "renaming" | "deleting" | null>(null);
  const [notice, setNotice] = useState("Seu sentimento fica salvo apenas no seu espaço pessoal.");
  const [sidebarOpen, setSidebarOpen] = useState(!initialConversationId);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [sentimentPanelOpen, setSentimentPanelOpen] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(Boolean(initialConversationId));
  const [sentimentModalOpen, setSentimentModalOpen] = useState(!initialSentiment);
  const [sentimentReviewOpen, setSentimentReviewOpen] = useState(false);
  const [sentimentReviewHandled, setSentimentReviewHandled] = useState(false);
  const [sentimentStatus, setSentimentStatus] = useState<"unknown" | "today" | "stale">("unknown");
  const [conversationFocusLatestSentiment, setConversationFocusLatestSentiment] = useState(false);
  const [openConversationMenuId, setOpenConversationMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ConversationSummary | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationSummary | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationMenuRef = useRef<HTMLDivElement>(null);
  const lastMessageContent = messages[messages.length - 1]?.content ?? "";
  const sentimentDateLabel = sentimentStatus === "stale" ? "Seu último sentimento" : "Seu sentimento hoje";

  const filteredConversations = useMemo(() => {
    if (!historyDate) return [];
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return conversations.filter((conversation) => {
      if (getLocalDateKey(conversation.updatedAt) !== historyDate) return false;
      return !normalizedSearch || conversation.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
    });
  }, [conversations, historyDate, search]);

  useEffect(() => {
    setHistoryDate(formatDateInputValue(new Date()));
  }, []);

  useEffect(() => {
    if (!sentimentModalOpen && !sentimentReviewOpen) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        setSentimentModalOpen(false);
        setSentimentReviewOpen(false);
        setSentimentReviewHandled(true);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [busy, sentimentModalOpen, sentimentReviewOpen]);

  useEffect(() => {
    if (sentimentReviewHandled || !initialSentiment || !initialSentimentAt) return;

    const isToday = isSentimentFromToday(initialSentimentAt);
    setSentimentStatus(isToday ? "today" : "stale");
    if (!isToday) {
      setSentimentReviewHandled(true);
      setSentimentReviewOpen(true);
      setNotice("Seu último registro foi feito em outro dia. Vamos confirmar como você está hoje.");
    }
  }, [initialSentiment, initialSentimentAt, sentimentReviewHandled]);

  useEffect(() => {
    if (!conversationOpen) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "end" });
  }, [conversationOpen, messages.length, lastMessageContent]);

  useEffect(() => {
    if (!openConversationMenuId) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenConversationMenuId(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openConversationMenuId]);

  useEffect(() => {
    if (!openConversationMenuId) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (conversationMenuRef.current && !conversationMenuRef.current.contains(event.target as Node)) {
        setOpenConversationMenuId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openConversationMenuId]);

  useEffect(() => {
    if (!renameTarget && !deleteTarget) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || busy) return;
      setRenameTarget(null);
      setRenameDraft("");
      setDeleteTarget(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [busy, deleteTarget, renameTarget]);

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

  async function consumeAgentStream(conversationId: string, payload: { message: string; focusLatestSentiment?: boolean; replaceMessageId?: string }, optimisticUserMessageId?: string) {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, ...payload }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Não foi possível iniciar a resposta da EscutIA.");
    }
    if (!response.body) throw new Error("A resposta da EscutIA não iniciou o streaming.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantMessageId: string | null = null;

    const handleEvent = (event: AgentEvent) => {
      if (event.type === "token") {
        const localId = assistantMessageId || `assistant-${Date.now()}`;
        assistantMessageId = localId;
        setMessages((current) => {
          const existing = current.some((message) => message.id === localId);
          if (!existing) return [...current, { id: localId, role: "assistant", content: event.content }];
          return current.map((message) => message.id === localId ? { ...message, content: message.content + event.content } : message);
        });
        return;
      }

      if (event.type === "done") {
        setMessages((current) => {
          const reconciled = current.map((message) => {
            const isUserMessage = message.id === optimisticUserMessageId || message.id === event.userMessage.id;
            return isUserMessage
              ? { ...message, id: event.userMessage.id, sentiment: null }
              : message;
          });

          if (!assistantMessageId) return [...reconciled, event.message];
          return reconciled.some((message) => message.id === assistantMessageId)
            ? reconciled.map((message) => message.id === assistantMessageId ? event.message : message)
            : [...reconciled, event.message];
        });
        if (event.sentiment) setCurrentSentiment(event.sentiment);
        if (event.sentimentAt) setCurrentSentimentAt(event.sentimentAt);
        setNotice("A EscutIA respondeu. Continue no seu ritmo.");
        return;
      }

      if (event.type === "error") throw new Error(event.message);
    };

    const readLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      handleEvent(JSON.parse(trimmed) as AgentEvent);
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      lines.forEach(readLine);
      if (done) break;
    }
    if (buffer.trim()) readLine(buffer);
  }

  async function handleCopyMessage(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      setNotice("Mensagem copiada.");
      window.setTimeout(() => {
        setCopiedMessageId((current) => current === message.id ? null : current);
      }, 1800);
    } catch {
      setNotice("Não foi possível copiar a mensagem. Selecione o texto e tente novamente.");
    }
  }

  function startEditingMessage(message: ChatMessage) {
    if (busy || message.role !== "user") return;
    setEditingMessageId(message.id);
    setEditingDraft(message.content);
  }

  function cancelEditingMessage() {
    if (busy) return;
    setEditingMessageId(null);
    setEditingDraft("");
  }

  async function handleEditMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageId = editingMessageId;
    const content = editingDraft.trim();
    if (!messageId || !content || !activeConversationId || busy) return;

    const messageIndex = messages.findIndex((message) => message.id === messageId);
    if (messageIndex < 0) return;

    setEditingMessageId(null);
    setEditingDraft("");
    setMessages((current) => current.slice(0, messageIndex + 1).map((message, index) => index === messageIndex ? { ...message, content, sentiment: null } : message));
    setBusy("sending");
    setNotice("Atualizando sua mensagem e preparando uma nova resposta…");

    try {
      await consumeAgentStream(activeConversationId, { message: content, replaceMessageId: messageId }, messageId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar a mensagem.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    setDraft("");
    setNotice("A EscutIA está lendo sua mensagem…");
    const optimisticUserMessageId = `local-${Date.now()}`;
    setMessages((current) => [...current, { id: optimisticUserMessageId, role: "user", content }]);
    setBusy("sending");
    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createConversation(content);
        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
        rememberConversation(conversation.id, conversation.title);
      }
      await consumeAgentStream(conversationId, { message: content, focusLatestSentiment: conversationFocusLatestSentiment }, optimisticUserMessageId);
      // Keep this component mounted while the NDJSON stream is consumed. If we
      // navigate immediately after creating the conversation, the route can
      // remount with only the user message before the assistant response is
      // persisted, making the first answer appear only after a refresh.
      if (!activeConversationId) {
        router.push(`/chat/${conversationId}`);
      }
      setConversationFocusLatestSentiment(false);
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
      setSentimentStatus("today");
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
    setOpenConversationMenuId(null);
    setConversationFocusLatestSentiment(false);
    setBusy("loading");
    setSidebarOpen(false);
    setConversationOpen(true);
    setNotice("Carregando conversa…");
    try {
      const response = await fetch(`/api/conversations/${id}`);
      const data = (await response.json()) as { conversation?: { messages: ChatMessage[] }; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error || "Não foi possível carregar a conversa.");
      setActiveConversationId(id);
      setMessages(normalizeConversationMessages(data.conversation.messages));
      router.push(`/chat/${id}`);
      setNotice("Conversa carregada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar a conversa.");
    } finally {
      setBusy(null);
    }
  }

  function getConversationUrl(id: string) {
    return `${window.location.origin}/chat/${id}`;
  }

  async function handleShareConversation(conversation: ConversationSummary) {
    setOpenConversationMenuId(null);
    const url = getConversationUrl(conversation.id);

    try {
      if (navigator.share) {
        await navigator.share({ title: conversation.title, url });
        setNotice("Conversa compartilhada.");
      } else {
        await navigator.clipboard.writeText(url);
        setNotice("Link da conversa copiado.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Não foi possível compartilhar. Copie o link da barra de endereço.");
    }
  }

  function openRenameModal(conversation: ConversationSummary) {
    setOpenConversationMenuId(null);
    setRenameTarget(conversation);
    setRenameDraft(conversation.title);
  }

  function openDeleteModal(conversation: ConversationSummary) {
    setOpenConversationMenuId(null);
    setDeleteTarget(conversation);
  }

  async function handleRenameConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = renameDraft.trim();
    if (!renameTarget || !title || busy) return;

    setBusy("renaming");
    try {
      const response = await fetch(`/api/conversations/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = (await response.json()) as { conversation?: ConversationSummary; error?: string };
      const renamedConversation = data.conversation;
      if (!response.ok || !renamedConversation) throw new Error(data.error || "Não foi possível renomear a conversa.");

      setConversations((current) => current.map((conversation) => conversation.id === renamedConversation.id ? renamedConversation : conversation));
      setRenameTarget(null);
      setRenameDraft("");
      setNotice("Conversa renomeada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível renomear a conversa.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteConversation() {
    if (!deleteTarget || busy) return;
    const deletedId = deleteTarget.id;
    setBusy("deleting");

    try {
      const response = await fetch(`/api/conversations/${deletedId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir a conversa.");

      setConversations((current) => current.filter((conversation) => conversation.id !== deletedId));
      setDeleteTarget(null);
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
        setMessages([]);
        setConversationOpen(false);
        setSidebarOpen(true);
        router.push("/chat");
      }
      setNotice("Conversa excluída.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível excluir a conversa.");
    } finally {
      setBusy(null);
    }
  }

  function handleNewConversation() {
    if (busy) return;
    setOpenConversationMenuId(null);
    setConversationFocusLatestSentiment(false);
    setActiveConversationId(null);
    setMessages([]);
    window.history.replaceState(null, "", "/chat");
    setSidebarOpen(false);
    setConversationOpen(true);
    setNotice("Nova conversa pronta. Escreva no seu ritmo.");
  }

  function handleOpenConversation() {
    setSidebarOpen(false);
    setConversationOpen(true);
    setConversationFocusLatestSentiment(true);
    setNotice("Vamos conversar a partir do seu último registro de sentimento.");
  }

  function handleDraftKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function openSentimentModal() {
    if (busy) return;
    setSentimentReviewOpen(false);
    setSentimentReviewHandled(true);
    setSentimentDraft("");
    setSentimentModalOpen(true);
  }

  async function handleRepeatSentiment() {
    if (!currentSentiment || busy) return;
    setBusy("validating");
    setSentimentReviewOpen(false);
    setNotice("Registrando seu sentimento novamente…");

    try {
      const response = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sameAsCurrent: true }),
      });
      const data = (await response.json()) as { sentiment?: SentimentLabel; sentimentAt?: string; error?: string };
      if (!response.ok || !data.sentiment) throw new Error(data.error || "Não foi possível registrar o sentimento novamente.");

      setCurrentSentiment(data.sentiment);
      setCurrentSentimentAt(data.sentimentAt || new Date().toISOString());
      setSentimentStatus("today");
      setNotice("Seu sentimento foi registrado novamente hoje. O registro anterior continua salvo.");
    } catch (error) {
      setSentimentReviewOpen(true);
      setNotice(error instanceof Error ? error.message : "Não foi possível registrar o sentimento novamente.");
    } finally {
      setBusy(null);
    }
  }

  function handleRegisterDifferentSentiment() {
    if (busy) return;
    setSentimentReviewOpen(false);
    setSentimentReviewHandled(true);
    setSentimentDraft("");
    setSentimentModalOpen(true);
  }

  return (
    <main id="main-content" className="h-screen min-h-screen overflow-x-hidden bg-[#f9f6f3] text-navy">
      <div className="flex h-screen min-h-screen">
        {sidebarOpen ? <button type="button" aria-label="Fechar painel lateral" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-navy/20 lg:hidden" /> : null}

        <aside aria-label="Navegação do chat" className={`fixed inset-y-0 left-0 z-40 flex w-[min(88vw,320px)] flex-col border-r border-navy/8 bg-white shadow-xl transition-[transform,width] duration-300 ease-out motion-reduce:transition-none lg:static lg:h-screen lg:shadow-none lg:translate-x-0 ${sidebarOpen ? "translate-x-0 lg:w-[300px]" : "-translate-x-full lg:translate-x-0 lg:w-[76px]"}`}>
          {sidebarOpen ? (
            <>
              <div className="border-b border-navy/8 px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <Logo />
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Fechar painel lateral" title="Fechar painel lateral" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                      <PanelIcon />
                    </button>
                    <Link href="/" aria-label="Sair do chat e voltar para a página inicial" title="Sair do chat" className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50">
                      <ExitIcon />
                    </Link>
                  </div>
                </div>

                <div className="mt-8 flex items-start gap-3">
                  <Avatar user={user} size="large" />
                  <div className="min-w-0 pt-1">
                    <p className="truncate text-sm font-black text-navy">{displayName}</p>
                    <p className="mt-0.5 text-xs text-navy/50">seu espaço pessoal</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-purple/10 bg-purple/[0.045]">
                  <button type="button" aria-expanded={sentimentPanelOpen} aria-controls="sidebar-sentiment-panel" onClick={() => setSentimentPanelOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-purple/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple/50 motion-reduce:transition-none">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.68rem] font-black uppercase tracking-[0.14em] text-navy/40">{sentimentDateLabel}</span>
                      {currentSentiment && !sentimentPanelOpen ? <SentimentBadge sentiment={currentSentiment} className="mt-2 px-2 py-0.5 text-[0.6rem] tracking-[-0.01em]" /> : null}
                    </span>
                    <span className="shrink-0 self-center"><ChevronIcon open={sentimentPanelOpen} /></span>
                  </button>
                  {sentimentPanelOpen ? (
                    <div id="sidebar-sentiment-panel" className="border-t border-purple/10 px-4 pb-4 pt-3">
                      {currentSentiment && currentSentimentAt ? (
                        <div>
                          <SentimentBadge sentiment={currentSentiment} />
                          <p className="mt-2 text-xs leading-5 text-navy/50">Registrado em {formatSentimentDate(currentSentimentAt)}</p>
                        </div>
                      ) : (
                        <p className="text-sm leading-5 text-navy/55">Ainda não registrado</p>
                      )}
                      <button type="button" onClick={openSentimentModal} disabled={Boolean(busy)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-purple/15 bg-white px-3 py-2 text-xs font-black text-purple shadow-[0_6px_18px_rgba(109,40,217,0.08)] transition-colors hover:border-purple/30 hover:bg-purple/[0.04] hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">
                        {currentSentiment ? <EditIcon /> : null}
                        {currentSentiment ? "Editar sentimento" : "Registrar agora"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <div className="flex w-full items-center gap-1 rounded-xl px-3 py-2">
                  <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((current) => !current)} className="flex min-w-0 flex-1 items-center justify-between rounded-lg py-1 text-left transition-colors hover:bg-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                    <span className="flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-navy/40">
                      <span>Histórico</span>
                      <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[0.65rem] tabular-nums">{filteredConversations.length}</span>
                    </span>
                    <ChevronIcon open={historyOpen} />
                  </button>
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-navy/50 transition-colors hover:bg-warm hover:text-purple focus-within:bg-warm focus-within:text-purple focus-within:ring-2 focus-within:ring-purple/50 motion-reduce:transition-none" title="Escolher data do histórico">
                    <CalendarIcon />
                    <input
                      id="history-date"
                      name="history-date"
                      type="date"
                      aria-label={historyDate ? `Escolher data do histórico — ${formatHistoryDate(historyDate)}` : "Escolher data do histórico"}
                      value={historyDate}
                      onChange={(event) => setHistoryDate(event.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </span>
                </div>

                {historyOpen ? (
                  <div className="mt-2">
                    <label htmlFor="conversation-search" className="sr-only">Buscar conversas</label>
                    <div className="relative">
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40">
                        <path d="m14.5 14.5 3 3m-1.5-7a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                      </svg>
                      <input id="conversation-search" name="conversation-search" type="search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar conversas…" className="w-full rounded-xl border border-navy/10 bg-warm/70 py-3 pl-10 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20 motion-reduce:transition-none" />
                    </div>

                    <div className="mt-3">
                      {filteredConversations.length ? (
                        <div className="space-y-1">
                          {filteredConversations.map((conversation, index) => (
                            <div key={conversation.id} ref={openConversationMenuId === conversation.id ? conversationMenuRef : undefined} className="relative flex items-stretch">
                              <button type="button" onClick={() => void handleSelectConversation(conversation.id)} className={`min-w-0 flex-1 rounded-l-xl px-3 py-3 pr-2 text-left transition-colors hover:bg-warm focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple/50 motion-reduce:transition-none ${activeConversationId === conversation.id ? "bg-warm" : ""}`}>
                                <p className="truncate text-sm font-bold text-navy">{conversation.title}</p>
                                <p className="mt-1 text-xs text-navy/40">{formatConversationDate(conversation.updatedAt)}</p>
                              </button>
                              <button type="button" aria-label={`Ações para ${conversation.title}`} aria-expanded={openConversationMenuId === conversation.id} aria-haspopup="menu" title={`Ações para ${conversation.title}`} onClick={() => setOpenConversationMenuId((current) => current === conversation.id ? null : conversation.id)} className={`grid w-11 shrink-0 place-items-center rounded-r-xl text-navy/45 transition-colors hover:bg-warm hover:text-purple focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple/50 motion-reduce:transition-none ${activeConversationId === conversation.id ? "bg-warm" : ""}`}>
                                <MoreIcon />
                              </button>
                              {openConversationMenuId === conversation.id ? (
                                <div role="menu" aria-label={`Ações para ${conversation.title}`} className={`absolute right-2 z-30 max-h-[calc(100vh-2rem)] w-52 overflow-y-auto rounded-xl border border-navy/10 bg-white p-1 shadow-[0_14px_32px_rgba(26,31,61,0.15)] ${index === 0 ? "top-full mt-1" : "bottom-full mb-1"}`}>
                                  <button type="button" role="menuitem" onClick={() => void handleShareConversation(conversation)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-navy/70 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                                    <ShareIcon />
                                    Compartilhar conversa
                                  </button>
                                  <button type="button" role="menuitem" onClick={() => openRenameModal(conversation)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-navy/70 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                                    <EditIcon />
                                    Renomear
                                  </button>
                                  <button type="button" role="menuitem" onClick={() => openDeleteModal(conversation)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 motion-reduce:transition-none">
                                    <TrashIcon />
                                    Excluir
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-3 py-5 text-sm leading-6 text-navy/45">
                          {historyDate ? `Nenhuma conversa em ${formatHistoryDate(historyDate)}.` : "Carregando o histórico…"}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-navy/8 p-4">
                <button type="button" onClick={handleNewConversation} disabled={Boolean(busy)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">
                  <span aria-hidden="true" className="text-lg leading-none">+</span>
                  Nova conversa
                </button>
                <Link href="/dashboard" className="mt-3 block text-center text-xs font-bold text-navy/50 transition-colors hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">Voltar ao dashboard</Link>
              </div>
            </>
          ) : (
            <div className="hidden h-full flex-col items-center px-2 py-5 lg:flex">
              <LogoMark />
              <div className="mt-8 flex flex-col items-center gap-2">
                <CollapsedIconButton label="Abrir painel lateral" onClick={() => setSidebarOpen(true)}>
                  <PanelIcon />
                </CollapsedIconButton>
                <CollapsedIconButton label="Abrir histórico" onClick={() => { setHistoryOpen(true); setSidebarOpen(true); }}>
                  <HistoryIcon />
                </CollapsedIconButton>
                <CollapsedIconButton label="Nova conversa" onClick={handleNewConversation} disabled={Boolean(busy)}>
                  <PlusIcon />
                </CollapsedIconButton>
              </div>
              <div className="mt-auto flex flex-col items-center gap-2">
                <Link href="/dashboard" aria-label="Voltar ao dashboard" title="Voltar ao dashboard" className="grid h-11 w-11 place-items-center rounded-2xl text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                  <DashboardIcon />
                </Link>
                <Link href="/" aria-label="Sair do chat e voltar para a página inicial" title="Sair do chat" className="grid h-11 w-11 place-items-center rounded-2xl text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                  <ExitIcon />
                </Link>
              </div>
            </div>
          )}
        </aside>

        <section className="flex h-screen min-h-0 min-w-0 flex-1 flex-col">
          {!sidebarOpen ? (
            <header className="flex items-center gap-3 border-b border-navy/8 bg-white/55 px-5 py-4 lg:hidden">
              <button type="button" aria-label="Abrir painel lateral" title="Abrir painel lateral" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-navy/55 transition-colors hover:bg-warm hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                <PanelIcon />
              </button>
              <Logo />
            </header>
          ) : null}

          <div className={`px-5 py-8 sm:px-8 lg:px-12 lg:py-12 ${conversationOpen ? "min-h-0 flex-1 overflow-hidden" : "flex-1 overflow-y-auto"}`}>
            {conversationOpen ? (
              <div className="mx-auto flex h-full min-h-0 w-full flex-col">
                {messages.length === 0 ? (
                  <div className="border-b border-navy/8 pb-5">
                    <div className="min-w-0">
                      <p className="eyebrow text-[0.68rem]">seu próximo passo</p>
                      <h1 className="mt-2 truncate text-2xl font-black tracking-[-0.04em] text-navy sm:text-3xl">Seu espaço de conversa</h1>
                    </div>
                  </div>
                ) : null}

                <div className={`flex min-h-0 flex-1 flex-col ${messages.length ? "pt-2" : "pt-6"}`}>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2">
                    {messages.length ? (
                      <div className="flex flex-col gap-5">
                        {messages.map((message) => (
                          <article key={message.id} className={`group flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            {message.role === "assistant" ? <EscutiaAvatar /> : null}
                            {editingMessageId === message.id && message.role === "user" ? (
                              <form onSubmit={(event) => void handleEditMessage(event)} className="w-full max-w-[min(42rem,88%)] rounded-2xl rounded-br-md bg-navy p-2 shadow-sm">
                                <label htmlFor={`edit-message-${message.id}`} className="sr-only">Editar mensagem</label>
                                <textarea id={`edit-message-${message.id}`} name={`edit-message-${message.id}`} value={editingDraft} onChange={(event) => setEditingDraft(event.target.value)} maxLength={2000} rows={4} className="w-full resize-none rounded-xl border border-white/15 bg-white px-3 py-2.5 text-[0.95rem] leading-7 text-navy outline-none focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/30" />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button type="button" onClick={cancelEditingMessage} disabled={Boolean(busy)} className="rounded-lg px-3 py-2 text-xs font-bold text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">Cancelar</button>
                                  <button type="submit" disabled={!editingDraft.trim() || Boolean(busy)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-navy transition-colors hover:bg-purple hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">Salvar & reenviar</button>
                                </div>
                              </form>
                            ) : (
                              <div className="max-w-[min(42rem,88%)]">
                                <div className={`rounded-2xl px-4 py-3 text-[0.95rem] leading-7 shadow-sm ${message.role === "user" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-navy/8 bg-white text-navy/80"}`}>
                                  <MarkdownMessage content={message.content} tone={message.role === "assistant" ? "assistant" : "user"} />
                                  {message.role === "assistant" && message.sentiment ? <p className="mt-3"><SentimentBadge sentiment={message.sentiment} /></p> : null}
                                </div>
                                <div className={`mt-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-reduce:transition-none ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                  <button type="button" aria-label={copiedMessageId === message.id ? "Mensagem copiada" : "Copiar mensagem"} title={copiedMessageId === message.id ? "Mensagem copiada" : "Copiar mensagem"} onClick={() => void handleCopyMessage(message)} className="rounded-md p-1.5 text-navy/45 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 motion-reduce:transition-none">
                                    {copiedMessageId === message.id ? <CheckIcon /> : <CopyIcon />}
                                  </button>
                                  {message.role === "user" ? (
                                    <button type="button" aria-label="Editar mensagem" title="Editar mensagem" onClick={() => startEditingMessage(message)} disabled={Boolean(busy)} className="rounded-md p-1.5 text-navy/45 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">
                                      <EditIcon />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )}
                            {message.role === "user" ? <Avatar user={user} /> : null}
                          </article>
                        ))}
                        {busy === "sending" ? (
                          <div className="flex gap-3" role="status" aria-live="polite">
                            <EscutiaAvatar />
                            <div className="flex min-h-12 items-center gap-1 rounded-2xl rounded-bl-md border border-navy/8 bg-white px-4 shadow-sm">
                              <span className="sr-only">A EscutIA está digitando…</span>
                              <span aria-hidden="true" className="h-2 w-2 animate-bounce rounded-full bg-purple [animation-delay:-0.3s] motion-reduce:animate-none" />
                              <span aria-hidden="true" className="h-2 w-2 animate-bounce rounded-full bg-purple [animation-delay:-0.15s] motion-reduce:animate-none" />
                              <span aria-hidden="true" className="h-2 w-2 animate-bounce rounded-full bg-purple motion-reduce:animate-none" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[9rem] items-center justify-center rounded-2xl border border-dashed border-navy/12 bg-white/60 px-4 py-5 text-center">
                        <div>
                          <p className="text-xs font-bold text-navy/65 sm:text-sm">Quando quiser, este espaço estará aqui para você.</p>
                          <p className="mt-1 text-xs leading-5 text-navy/45">O registro do sentimento foi o primeiro passo. Escreva abaixo para começar.</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} aria-hidden="true" className="h-px" />
                  </div>

                  <div className="mt-4 shrink-0 rounded-[1.5rem] border border-navy/8 bg-white/80 p-4 shadow-[0_14px_40px_rgba(26,31,61,0.06)] sm:p-5">
                    <form onSubmit={(event) => void handleSend(event)}>
                      <label htmlFor="chat-message" className="sr-only">Escreva uma mensagem</label>
                      <textarea id="chat-message" name="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleDraftKeyDown} maxLength={2000} rows={3} placeholder="Escreva uma mensagem…" className="w-full resize-none rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm leading-6 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" />
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-navy/45" aria-live="polite">{busy === "sending" ? "Enviando sua mensagem…" : "Pressione Enter para enviar · Shift+Enter para quebrar linha."}</p>
                        <button type="submit" aria-label={busy === "sending" ? "Enviando mensagem" : "Enviar mensagem"} title={busy === "sending" ? "Enviando mensagem" : "Enviar mensagem"} disabled={!draft.trim() || Boolean(busy)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none">
                          <SendIcon />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-4xl">
                <section aria-labelledby={currentSentiment && currentSentimentAt ? "next-step-heading" : "sentiment-heading"} className="relative overflow-hidden rounded-[2rem] border border-navy/8 bg-white px-6 py-7 shadow-[0_20px_60px_rgba(26,31,61,0.07)] sm:px-10 sm:py-10">
                  <div aria-hidden="true" className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-purple/10 blur-2xl" />
                  <div className="relative">
                    {currentSentiment && currentSentimentAt ? (
                      <>
                        <p className="eyebrow">seu próximo passo</p>
                        <h1 id="next-step-heading" className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.05em] text-balance sm:text-5xl">Seu próximo passo</h1>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Seu sentimento já foi registrado. Quando estiver pronto, podemos conversar a partir do que você percebeu hoje.</p>

                        <div className="mt-8 flex flex-col gap-5 border-t border-navy/8 pt-6 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-sm font-black text-navy">{sentimentDateLabel}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <SentimentBadge sentiment={currentSentiment} />
                              <p className="text-xs text-navy/45">Registrado em {formatSentimentDate(currentSentimentAt)}</p>
                            </div>
                          </div>
                          <button type="button" onClick={handleOpenConversation} disabled={Boolean(busy)} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50">
                            Vamos conversar sobre isso?
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="eyebrow">seu espaço pessoal</p>
                        <h1 id="sentiment-heading" className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.05em] text-balance sm:text-5xl">Como você está se sentindo hoje?</h1>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-navy/55 sm:text-base">Antes de conversar, registre o que está presente em você agora. Esse é um ponto de partida para se observar com mais calma.</p>

                        <div className="mt-8 flex flex-col gap-5 border-t border-navy/8 pt-6 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-sm font-black text-navy">Ainda não registramos seu sentimento</p>
                            <p className="mt-1 text-sm text-navy/50">Leva só alguns instantes e pode ser atualizado a qualquer momento.</p>
                          </div>
                          <button type="button" onClick={openSentimentModal} disabled={Boolean(busy)} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-50">
                            Registrar sentimento
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
                <p className="mt-4 px-1 text-xs leading-5 text-navy/45" aria-live="polite">{notice}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {renameTarget ? (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto overscroll-contain bg-navy/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="rename-conversation-title" className="w-full max-w-md rounded-[2rem] border border-white/70 bg-[#fffdfb] p-6 shadow-[0_28px_90px_rgba(26,31,61,0.22)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="eyebrow">organizar conversa</p>
                <h2 id="rename-conversation-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy">Renomear conversa</h2>
              </div>
              <button type="button" aria-label="Fechar renomear conversa" title="Fechar" onClick={() => { if (!busy) { setRenameTarget(null); setRenameDraft(""); } }} disabled={busy === "renaming"} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy/45 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-40">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"><path d="m7 7 10 10M17 7 7 17" /></svg>
              </button>
            </div>

            <form onSubmit={(event) => void handleRenameConversation(event)} className="mt-7">
              <label htmlFor="conversation-title" className="mb-2 block text-sm font-black text-navy">Nome da conversa</label>
              <input id="conversation-title" name="conversation-title" type="text" autoComplete="off" value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} maxLength={80} required className="w-full rounded-2xl border border-navy/12 bg-white px-4 py-3 text-sm leading-6 text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-purple focus-visible:ring-2 focus-visible:ring-purple/20" />
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setRenameTarget(null); setRenameDraft(""); }} disabled={busy === "renaming"} className="inline-flex items-center justify-center rounded-xl border border-navy/10 px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">Cancelar</button>
                <button type="submit" disabled={!renameDraft.trim() || busy === "renaming"} className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">{busy === "renaming" ? "Salvando…" : "Salvar nome"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto overscroll-contain bg-navy/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-conversation-title" aria-describedby="delete-conversation-description" className="w-full max-w-md rounded-[2rem] border border-white/70 bg-[#fffdfb] p-6 shadow-[0_28px_90px_rgba(26,31,61,0.22)] sm:p-8">
            <p className="eyebrow text-rose-600/70">atenção</p>
            <h2 id="delete-conversation-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy">Excluir conversa?</h2>
            <p id="delete-conversation-description" className="mt-4 break-words text-sm leading-7 text-navy/55">Deseja realmente excluir “{deleteTarget.title}”? Essa ação não poderá ser desfeita.</p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={busy === "deleting"} className="inline-flex items-center justify-center rounded-xl border border-navy/10 px-5 py-3 text-sm font-bold text-navy/65 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">Cancelar</button>
              <button type="button" onClick={() => void handleDeleteConversation()} disabled={busy === "deleting"} className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-45">{busy === "deleting" ? "Excluindo…" : "Excluir"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {sentimentReviewOpen && currentSentiment && currentSentimentAt ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-navy/35 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="sentiment-review-title" aria-describedby="sentiment-review-description" className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-[#fffdfb] p-6 shadow-[0_28px_90px_rgba(26,31,61,0.22)] sm:p-9">
            <p className="eyebrow">um novo dia, um novo registro</p>
            <h2 id="sentiment-review-title" className="mt-3 text-2xl font-black tracking-[-0.04em] text-navy sm:text-3xl">Você continua se sentindo assim hoje?</h2>
            <p id="sentiment-review-description" className="mt-4 text-sm leading-7 text-navy/55">
              Seu último registro foi feito em {formatSentimentDate(currentSentimentAt)}. Ele continua salvo; queremos apenas saber como você está hoje.
            </p>

            <div className="mt-6 rounded-2xl border border-purple/10 bg-purple/[0.045] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-navy/40">Último registro</p>
              <SentimentBadge sentiment={currentSentiment} className="mt-3" />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleRegisterDifferentSentiment} disabled={Boolean(busy)} className="inline-flex items-center justify-center rounded-xl border border-navy/10 bg-white px-5 py-3 text-sm font-bold text-navy/70 transition-colors hover:bg-warm hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">
                Não, quero registrar outro
              </button>
              <button type="button" onClick={() => void handleRepeatSentiment()} disabled={Boolean(busy)} className="inline-flex items-center justify-center rounded-xl bg-purple px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple/50 disabled:cursor-not-allowed disabled:opacity-45">
                {busy === "validating" ? "Registrando…" : "Sim, continuo assim"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
