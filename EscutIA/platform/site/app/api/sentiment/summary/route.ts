import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getSentimentDashboardSummary } from "@/lib/sentiment-dashboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const summary = await getSentimentDashboardSummary(session.user.id, {
    from: params.get("from"),
    to: params.get("to"),
    sentiments: params.get("sentiments"),
  });

  return NextResponse.json(summary);
}
