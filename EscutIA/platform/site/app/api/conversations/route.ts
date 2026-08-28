import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
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
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { title?: unknown } | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
  const conversation = await prisma.conversation.create({
    data: { userId: session.user.id, title: title || "Nova conversa" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
