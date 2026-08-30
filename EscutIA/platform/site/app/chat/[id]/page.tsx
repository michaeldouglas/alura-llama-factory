import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { authOptions } from "@/lib/auth";
import { normalizeConversationMode } from "@/lib/conversation";
import { getChatWorkspaceData } from "../chat-data";

export const dynamic = "force-dynamic";

type ChatConversationPageProps = {
  params: { id: string };
};

export default async function ChatConversationPage({ params }: ChatConversationPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const { profile, conversations, conversation } = await getChatWorkspaceData(session.user.id, params.id);

  if (!conversation) {
    notFound();
  }

  return (
    <ChatWorkspace
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }}
      currentSentiment={profile?.currentSentiment as "negativo" | "neutro" | "positivo" | null}
      currentSentimentAt={profile?.currentSentimentAt?.toISOString() ?? null}
      initialConversations={conversations.map((item) => ({ ...item, mode: normalizeConversationMode(item.mode), updatedAt: item.updatedAt.toISOString() }))}
      initialConversationId={conversation.id}
      initialConversationMode={normalizeConversationMode(conversation.mode)}
      initialPrivateMode={conversation.isPrivate}
      initialMessages={conversation.messages.map((message) => ({
        id: message.id,
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
        sentiment: message.sentiment === "negativo" || message.sentiment === "neutro" || message.sentiment === "positivo" ? message.sentiment : null,
      }))}
    />
  );
}
