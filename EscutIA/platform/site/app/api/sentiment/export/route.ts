import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvCell(value: string | null) {
  return `"${(value || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const format = new URL(request.url).searchParams.get("format") || "json";
  if (format !== "json" && format !== "csv") return NextResponse.json({ error: "Formato de exportação inválido." }, { status: 400 });

  try {
    const records = await prisma.sentimentRecord.findMany({
      where: { userId: session.user.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, sentiment: true, note: true, createdAt: true },
    });
    const data = records.map((record) => ({ id: record.id, sentiment: record.sentiment, note: record.note, createdAt: record.createdAt.toISOString() }));
    if (format === "json") {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=escutia-registros.json" },
      });
    }

    const csv = ["id,sentimento,relato,data", ...data.map((record) => [csvCell(record.id), csvCell(record.sentiment), csvCell(record.note), csvCell(record.createdAt)].join(","))].join("\r\n");
    return new NextResponse(`\uFEFF${csv}`, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=escutia-registros.csv" },
    });
  } catch (error) {
    console.error("Não foi possível exportar registros de sentimento:", error);
    return NextResponse.json({ error: "Não foi possível exportar os registros agora." }, { status: 503 });
  }
}
