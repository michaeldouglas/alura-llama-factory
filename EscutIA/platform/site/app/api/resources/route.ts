import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { RESOURCE_KINDS, isResourceKind } from "@/lib/conversation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const resources = await prisma.personalResource.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { id: true, kind: true, content: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Não foi possível carregar os recursos pessoais:", error);
    return NextResponse.json({ error: "Não foi possível carregar seus recursos agora." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { kind?: unknown; content?: unknown } | null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!isResourceKind(body?.kind) || !RESOURCE_KINDS.includes(body.kind)) {
    return NextResponse.json({ error: "Escolha um tipo de recurso válido." }, { status: 400 });
  }
  if (!content || content.length > 500) {
    return NextResponse.json({ error: "O recurso deve ter entre 1 e 500 caracteres." }, { status: 400 });
  }

  try {
    const resource = await prisma.personalResource.create({
      data: { userId: session.user.id, kind: body.kind, content },
      select: { id: true, kind: true, content: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("Não foi possível salvar o recurso pessoal:", error);
    return NextResponse.json({ error: "Não foi possível guardar esse recurso agora." }, { status: 503 });
  }
}
