import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { isConversationMode, isConversationSentiment, type ConversationMode, type ConversationSentiment } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const search = new URL(request.url).searchParams.get("search")?.trim();
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: session.user.id,
      ...(search ? { title: { contains: search } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, mode: true, isPrivate: true, updatedAt: true },
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    mode?: unknown;
    privateMode?: unknown;
    checkInSentiment?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  const mode = body?.mode === undefined ? "ouvir" : body.mode;
  const checkInSentiment = body?.checkInSentiment === undefined || body.checkInSentiment === null || body.checkInSentiment === ""
    ? null
    : body.checkInSentiment;

  if (!isConversationMode(mode)) {
    return NextResponse.json({ error: "Modo de conversa inválido." }, { status: 400 });
  }
  if (body?.privateMode === true) {
    return NextResponse.json({ error: "Conversas privadas não são persistidas." }, { status: 400 });
  }
  if (checkInSentiment !== null && !isConversationSentiment(checkInSentiment)) {
    return NextResponse.json({ error: "Check-in inválido." }, { status: 400 });
  }

  try {
    const conversation = await prisma.$transaction(async (transaction) => {
      const checkInAt = checkInSentiment ? new Date() : null;
      const created = await transaction.conversation.create({
        data: {
          userId: session.user.id,
          title: title || "Nova conversa",
          mode: mode as ConversationMode,
          checkInSentiment: checkInSentiment as ConversationSentiment | null,
          checkInAt,
        },
        select: { id: true, title: true, mode: true, isPrivate: true, updatedAt: true },
      });

      if (checkInSentiment) {
        const record = await transaction.sentimentRecord.create({
          data: { userId: session.user.id, conversationId: created.id, sentiment: checkInSentiment, note: "Check-in de início da conversa" },
          select: { createdAt: true },
        });
        await transaction.user.update({
          where: { id: session.user.id },
          data: { currentSentiment: checkInSentiment, currentSentimentAt: record.createdAt },
        });
      }

      return created;
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Não foi possível criar a conversa:", error);
    return NextResponse.json({ error: "Não foi possível iniciar a conversa agora." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
  if (body?.confirm !== "EXCLUIR_CONVERSAS") {
    return NextResponse.json({ error: "Confirmação inválida." }, { status: 400 });
  }

  try {
    const result = await prisma.conversation.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error) {
    console.error("Não foi possível excluir conversas:", error);
    return NextResponse.json({ error: "Não foi possível excluir as conversas agora." }, { status: 503 });
  }
}
