import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "A mensagem deve ter entre 1 e 2000 caracteres." }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.message.create({
      data: { conversationId: conversation.id, role: "user", content },
      select: { id: true, role: true, content: true, sentiment: true, createdAt: true },
    });
    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  return NextResponse.json({ message });
}
