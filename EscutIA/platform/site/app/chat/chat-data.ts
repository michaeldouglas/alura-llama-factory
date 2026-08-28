import { prisma } from "@/lib/prisma";

export async function getChatWorkspaceData(userId: string, conversationId?: string) {
  const conversationPromise = conversationId
    ? prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, content: true, sentiment: true, createdAt: true },
          },
        },
      })
    : Promise.resolve(null);

  const [profile, conversations, conversation] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentSentiment: true, currentSentimentAt: true },
    }),
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, updatedAt: true },
    }),
    conversationPromise,
  ]);

  return { profile, conversations, conversation };
}
