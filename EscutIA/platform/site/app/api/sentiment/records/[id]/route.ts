import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

function getId(params: { id: string }) {
  return validId(params.id) ? params.id : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Registro inválido." }, { status: 400 });

  const body = (await request.json().catch(() => null)) as { note?: unknown } | null;
  if (typeof body?.note !== "string" || body.note.trim().length > 2000) {
    return NextResponse.json({ error: "O relato deve ter no máximo 2000 caracteres." }, { status: 400 });
  }

  try {
    const owned = await prisma.sentimentRecord.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    const record = await prisma.sentimentRecord.update({
      where: { id: owned.id },
      data: { note: body.note.trim() || null },
      select: { id: true, sentiment: true, note: true, createdAt: true },
    });
    return NextResponse.json({ record: { ...record, createdAt: record.createdAt.toISOString() } });
  } catch (error) {
    console.error("Não foi possível editar registro de sentimento:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o relato agora." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Registro inválido." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const owned = await transaction.sentimentRecord.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
      if (!owned) return null;
      await transaction.sentimentRecord.delete({ where: { id: owned.id } });
      const latest = await transaction.sentimentRecord.findFirst({
        where: { userId: session.user.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { sentiment: true, createdAt: true },
      });
      await transaction.user.update({
        where: { id: session.user.id },
        data: { currentSentiment: latest?.sentiment ?? null, currentSentimentAt: latest?.createdAt ?? null },
      });
      return { deleted: owned.id };
    });
    if (!result) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Não foi possível excluir registro de sentimento:", error);
    return NextResponse.json({ error: "Não foi possível excluir o registro agora." }, { status: 503 });
  }
}
