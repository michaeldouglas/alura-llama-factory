import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { isConversationSentiment, isJournalType } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      mode: true,
      isPrivate: true,
      checkInSentiment: true,
      checkInAt: true,
      checkOutSentiment: true,
      checkOutAt: true,
      journalType: true,
      journalText: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, sentiment: true, createdAt: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    checkOutSentiment?: unknown;
    journalType?: unknown;
    journalText?: unknown;
  } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  const hasTitle = Object.prototype.hasOwnProperty.call(body ?? {}, "title");
  const hasCheckOut = Object.prototype.hasOwnProperty.call(body ?? {}, "checkOutSentiment");
  const hasJournalType = Object.prototype.hasOwnProperty.call(body ?? {}, "journalType");
  const hasJournalText = Object.prototype.hasOwnProperty.call(body ?? {}, "journalText");
  if (!hasTitle && !hasCheckOut && !hasJournalType && !hasJournalText) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }
  if (hasTitle && !title) {
    return NextResponse.json({ error: "O título não pode ficar vazio." }, { status: 400 });
  }

  const checkOutSentiment = body?.checkOutSentiment === null || body?.checkOutSentiment === "" || body?.checkOutSentiment === undefined
    ? null
    : body.checkOutSentiment;
  const journalType = body?.journalType === null || body?.journalType === "" || body?.journalType === undefined
    ? null
    : body.journalType;
  const journalText = body?.journalText === null || body?.journalText === undefined
    ? null
    : typeof body.journalText === "string" ? body.journalText.trim() : "__invalid__";

  if (hasCheckOut && checkOutSentiment !== null && !isConversationSentiment(checkOutSentiment)) {
    return NextResponse.json({ error: "Check-out inválido." }, { status: 400 });
  }
  const normalizedCheckOutSentiment = checkOutSentiment === null || checkOutSentiment === undefined
    ? null
    : isConversationSentiment(checkOutSentiment) ? checkOutSentiment : null;
  if (hasJournalType && journalType !== null && !isJournalType(journalType)) {
    return NextResponse.json({ error: "Tipo de anotação inválido." }, { status: 400 });
  }
  if (hasJournalText && (journalText === "__invalid__" || (typeof journalText === "string" && journalText.length > 2000))) {
    return NextResponse.json({ error: "A anotação deve ter no máximo 2000 caracteres." }, { status: 400 });
  }

  const ownedConversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });
  if (!ownedConversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  try {
    const conversation = await prisma.$transaction(async (transaction) => {
      const current = await transaction.conversation.findUnique({
        where: { id: ownedConversation.id },
        select: { checkOutSentiment: true },
      });
      const data: {
        title?: string;
        checkOutSentiment?: string | null;
        checkOutAt?: Date | null;
        journalType?: string | null;
        journalText?: string | null;
      } = {};
      if (hasTitle) data.title = title;
      if (hasCheckOut) {
        data.checkOutSentiment = normalizedCheckOutSentiment;
        data.checkOutAt = normalizedCheckOutSentiment ? new Date() : null;
      }
      if (hasJournalType) data.journalType = journalType as string | null;
      if (hasJournalText) data.journalText = (journalText as string | null) || null;

      const updated = await transaction.conversation.update({
        where: { id: ownedConversation.id },
        data,
        select: { id: true, title: true, mode: true, isPrivate: true, checkOutSentiment: true, checkOutAt: true, journalType: true, journalText: true, updatedAt: true },
      });

      if (hasCheckOut && normalizedCheckOutSentiment && !current?.checkOutSentiment) {
        const record = await transaction.sentimentRecord.create({
          data: { userId: session.user.id, conversationId: ownedConversation.id, sentiment: normalizedCheckOutSentiment, note: (journalText as string | null) || "Check-out de encerramento da conversa" },
          select: { createdAt: true },
        });
        await transaction.user.update({
          where: { id: session.user.id },
          data: { currentSentiment: normalizedCheckOutSentiment, currentSentimentAt: record.createdAt },
        });
      }

      return updated;
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Não foi possível atualizar a conversa:", error);
    return NextResponse.json({ error: "Não foi possível salvar o encerramento agora." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const ownedConversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });
  if (!ownedConversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  await prisma.conversation.delete({ where: { id: ownedConversation.id } });
  return NextResponse.json({ ok: true });
}
