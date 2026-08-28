import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
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

  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  if (!title) {
    return NextResponse.json({ error: "O título não pode ficar vazio." }, { status: 400 });
  }

  const ownedConversation = await prisma.conversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });
  if (!ownedConversation) {
    return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
  }

  const conversation = await prisma.conversation.update({
    where: { id: ownedConversation.id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ conversation });
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
