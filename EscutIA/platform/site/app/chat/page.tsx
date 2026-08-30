import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { authOptions } from "@/lib/auth";
import { normalizeConversationMode } from "@/lib/conversation";
import { getChatWorkspaceData } from "./chat-data";

export const dynamic = "force-dynamic";

export default async function ChatPage({ searchParams }: { searchParams: { recordId?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const { profile, conversations } = await getChatWorkspaceData(session.user.id);

  return (
    <ChatWorkspace
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }}
      currentSentiment={profile?.currentSentiment as "negativo" | "neutro" | "positivo" | null}
      currentSentimentAt={profile?.currentSentimentAt?.toISOString() ?? null}
      initialConversations={conversations.map((conversation) => ({ ...conversation, mode: normalizeConversationMode(conversation.mode), updatedAt: conversation.updatedAt.toISOString() }))}
      initialFocusRecordId={searchParams.recordId ?? null}
    />
  );
}
