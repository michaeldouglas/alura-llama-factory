import { prisma } from "@/lib/prisma";

export async function getConversationMemory(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: {
      id: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, sentiment: true },
      },
    },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  return conversation;
}
