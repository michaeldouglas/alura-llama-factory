import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isValidId(value: string) {
  return /^[A-Za-z0-9_-]{8,80}$/.test(value);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!isValidId(params.id)) return NextResponse.json({ error: "Recurso inválido." }, { status: 400 });

  try {
    const result = await prisma.personalResource.deleteMany({ where: { id: params.id, userId: session.user.id } });
    if (!result.count) return NextResponse.json({ error: "Recurso não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Não foi possível excluir o recurso pessoal:", error);
    return NextResponse.json({ error: "Não foi possível excluir esse recurso agora." }, { status: 503 });
  }
}
