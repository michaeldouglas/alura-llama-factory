import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import ChatWorkspace from "@/components/ChatWorkspace";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <ChatWorkspace
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null }}
      initialConversations={conversations.map((conversation) => ({ ...conversation, updatedAt: conversation.updatedAt.toISOString() }))}
    />
  );
}
