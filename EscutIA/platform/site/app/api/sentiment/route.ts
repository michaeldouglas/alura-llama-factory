import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { classifySentiment, type SentimentLabel } from "@/lib/sentiment";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SENTIMENT_RESPONSES: Record<SentimentLabel, string> = {
  negativo: "Percebi que há algo pesado nesse momento. Obrigado por dividir isso comigo.",
  neutro: "Obrigado por compartilhar. Estou aqui para ouvir você com calma.",
  positivo: "Que bom perceber essa energia. Obrigado por compartilhar como você está.",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Faça login para validar seu sentimento." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Escreva uma mensagem de até 2000 caracteres." }, { status: 400 });
  }

  const startedAt = Date.now();
  let result: Awaited<ReturnType<typeof classifySentiment>>;
  try {
    result = await classifySentiment(text);
  } catch (error) {
    console.error("Sentiment inference failed:", error);
    if (error instanceof Error && error.message === "HF_TOKEN_MISSING") {
      return NextResponse.json({ error: "A validação ainda precisa da configuração do Hugging Face no servidor." }, { status: 503 });
    }
    return NextResponse.json({ error: "Não foi possível validar o sentimento agora. Tente novamente em instantes." }, { status: 503 });
  }

  const sentimentAt = new Date();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentSentiment: result.sentiment, currentSentimentAt: sentimentAt },
  });

  return NextResponse.json({
    sentiment: result.sentiment,
    response: SENTIMENT_RESPONSES[result.sentiment],
    model: result.model,
    sentimentAt: sentimentAt.toISOString(),
    elapsedMs: Date.now() - startedAt,
  });
}
