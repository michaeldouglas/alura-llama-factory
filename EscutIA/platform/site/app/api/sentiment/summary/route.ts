import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getSentimentDashboardSummary, isValidDateInput, isValidSentimentFilter } from "@/lib/sentiment-dashboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  if (!isValidDateInput(params.get("from")) || !isValidDateInput(params.get("to")) || !isValidSentimentFilter(params.get("sentiments"))) {
    return NextResponse.json({ error: "Filtros de data ou sentimento inválidos." }, { status: 400 });
  }
  try {
    const summary = await getSentimentDashboardSummary(session.user.id, {
      from: params.get("from"),
      to: params.get("to"),
      sentiments: params.get("sentiments"),
    });
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Não foi possível carregar o resumo de sentimentos:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o resumo agora." }, { status: 503 });
  }
}
