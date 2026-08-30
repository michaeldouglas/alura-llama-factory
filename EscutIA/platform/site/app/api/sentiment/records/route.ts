import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getSentimentRecords, isValidDateInput, isValidSentimentFilter } from "@/lib/sentiment-dashboard";
import { prisma } from "@/lib/prisma";
import { SENTIMENT_LABELS, type SentimentLabel } from "@/lib/sentiment";

export const runtime = "nodejs";

const SENTIMENTS = new Set<SentimentLabel>(SENTIMENT_LABELS);

function asSentiment(value: unknown): SentimentLabel | null {
  return typeof value === "string" && SENTIMENTS.has(value as SentimentLabel) ? value as SentimentLabel : null;
}

function parseNote(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  const note = value.trim();
  return note ? note.slice(0, 2000) : null;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const pageValue = Number(params.get("page") || "1");
  if (!Number.isInteger(pageValue) || pageValue <= 0 || pageValue > 10000 || !isValidDateInput(params.get("from")) || !isValidDateInput(params.get("to")) || !isValidSentimentFilter(params.get("sentiments"))) {
    return NextResponse.json({ error: "Paginação ou filtros inválidos." }, { status: 400 });
  }
  const page = pageValue;

  try {
    return NextResponse.json(await getSentimentRecords(session.user.id, {
      from: params.get("from"),
      to: params.get("to"),
      sentiments: params.get("sentiments"),
      page,
    }));
  } catch (error) {
    console.error("Não foi possível listar registros de sentimento:", error);
    return NextResponse.json({ error: "Não foi possível carregar os registros agora." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { sentiment?: unknown; note?: unknown } | null;
  const sentiment = asSentiment(body?.sentiment);
  const note = parseNote(body?.note);
  if (!sentiment) return NextResponse.json({ error: "Escolha um sentimento válido." }, { status: 400 });
  if (note === undefined || (typeof body?.note === "string" && body.note.trim().length > 2000)) {
    return NextResponse.json({ error: "O relato deve ter no máximo 2000 caracteres." }, { status: 400 });
  }

  try {
    const createdAt = new Date();
    const record = await prisma.$transaction(async (transaction) => {
      const created = await transaction.sentimentRecord.create({
        data: { userId: session.user.id, sentiment, note },
        select: { id: true, sentiment: true, note: true, createdAt: true },
      });
      await transaction.user.update({
        where: { id: session.user.id },
        data: { currentSentiment: sentiment, currentSentimentAt: createdAt },
      });
      return created;
    });

    return NextResponse.json({ record: { ...record, createdAt: record.createdAt.toISOString() }, manual: true }, { status: 201 });
  } catch (error) {
    console.error("Não foi possível criar check-in manual:", error);
    return NextResponse.json({ error: "Não foi possível salvar seu registro agora." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { confirm?: unknown } | null;
  if (body?.confirm !== "EXCLUIR_REGISTROS") return NextResponse.json({ error: "Confirmação inválida." }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const deleted = await transaction.sentimentRecord.deleteMany({ where: { userId: session.user.id } });
      await transaction.user.update({ where: { id: session.user.id }, data: { currentSentiment: null, currentSentimentAt: null } });
      return deleted;
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (error) {
    console.error("Não foi possível excluir registros de sentimento:", error);
    return NextResponse.json({ error: "Não foi possível excluir os registros agora." }, { status: 503 });
  }
}
