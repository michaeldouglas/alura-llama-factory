import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getConversationMemory } from "@/agent/memory/conversation-memory";
import { getEscutiaGraph } from "@/agent/graph/escutia-graph";
import type { EscutiaStateType } from "@/agent/graph/state";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SentimentLabel } from "@/lib/sentiment";

export const runtime = "nodejs";
export const maxDuration = 300;

type AgentRequest = {
  conversationId?: unknown;
  message?: unknown;
  focusLatestSentiment?: unknown;
  focusRecordId?: unknown;
  replaceMessageId?: unknown;
};

type AgentEvent =
  | { type: "token"; content: string }
  | {
      type: "done";
      message: { id: string; role: "assistant"; content: string; sentiment: SentimentLabel | null };
      userMessage: { id: string };
      sentiment: SentimentLabel | null;
      sentimentAt: string | null;
    }
  | { type: "error"; message: string };

const SENTIMENTS = new Set<SentimentLabel>(["negativo", "neutro", "positivo"]);

function asSentiment(value: unknown): SentimentLabel | null {
  return typeof value === "string" && SENTIMENTS.has(value as SentimentLabel) ? value as SentimentLabel : null;
}

function getFirstName(name: string | null | undefined, email: string | null | undefined) {
  const displayName = name?.trim() || email?.split("@")[0]?.trim() || "";
  const firstName = displayName.split(/\s+/)[0] || "";
  const safeName = firstName.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9'’-]/g, "").slice(0, 40);

  return safeName || null;
}

function ndjson(event: AgentEvent) {
  return `${JSON.stringify(event)}\n`;
}

function getGraphEvent(value: unknown) {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string") return null;
  return { mode: value[0], chunk: value[1] };
}

async function verifyConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  return conversation;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AgentRequest | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
  const focusLatestSentiment = body?.focusLatestSentiment === true;
  const focusRecordId = typeof body?.focusRecordId === "string" ? body.focusRecordId : "";
  const replaceMessageId = typeof body?.replaceMessageId === "string" ? body.replaceMessageId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!conversationId) {
    return NextResponse.json({ error: "Conversa não informada." }, { status: 400 });
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "A mensagem deve ter entre 1 e 2000 caracteres." }, { status: 400 });
  }

  try {
    const conversation = await verifyConversation(conversationId, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const [profile, latestSentimentRecord] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currentSentiment: true, currentSentimentAt: true },
      }),
      focusRecordId
        ? prisma.sentimentRecord.findFirst({
            where: { id: focusRecordId, userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: { sentiment: true, note: true, createdAt: true },
          })
        : focusLatestSentiment
        ? prisma.sentimentRecord.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: { sentiment: true, note: true, createdAt: true },
          })
        : Promise.resolve(null),
    ]);

    const created = await prisma.$transaction(async (transaction) => {
      if (replaceMessageId) {
        const target = await transaction.message.findFirst({
          where: { id: replaceMessageId, conversationId, role: "user" },
          select: { id: true },
        });
        if (!target) throw new Error("MESSAGE_NOT_FOUND");

        const orderedMessages = await transaction.message.findMany({
          where: { conversationId },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true },
        });
        const targetIndex = orderedMessages.findIndex((item) => item.id === target.id);
        const laterMessageIds = orderedMessages.slice(targetIndex + 1).map((item) => item.id);
        if (laterMessageIds.length) {
          await transaction.message.deleteMany({ where: { id: { in: laterMessageIds } } });
        }
        await transaction.message.update({ where: { id: target.id }, data: { content: message, sentiment: null } });
        await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return target;
      }

      const savedMessage = await transaction.message.create({
        data: { conversationId, role: "user", content: message },
        select: { id: true },
      });
      await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return savedMessage;
    });
    const userMessageId = created.id;

    const memory = await getConversationMemory(conversationId, session.user.id);
    const currentSentiment = asSentiment(profile?.currentSentiment);
    const firstName = getFirstName(session.user.name, session.user.email);
    const isFirstInteraction = !replaceMessageId && memory.messages.length === 1;
    const graph = getEscutiaGraph();
    const config = { configurable: { thread_id: conversationId } };
    const identityContext = firstName
      ? [{
          role: "system" as const,
          content: [
            `O primeiro nome da pessoa nesta conversa é ${firstName}.`,
            isFirstInteraction
              ? `Esta é a primeira interação desta conversa: inclua na primeira resposta uma saudação como "Oi, ${firstName}! Eu sou a EscutIA" e use o nome somente uma vez.`
              : "Esta conversa já possui histórico: não repita a apresentação nem faça uma nova saudação com o nome.",
          ].join("\n"),
        }]
      : [];
    const latestSentimentContext = latestSentimentRecord
      ? [{
          role: "system" as const,
          content: [
            "A pessoa escolheu conversar sobre o último registro de sentimento dela.",
            "Use este contexto para acolher e conduzir a conversa naturalmente, sem mencionar que recebeu um contexto oculto nem transformar o rótulo em diagnóstico.",
            `Sentimento registrado: ${latestSentimentRecord.sentiment}.`,
            `Data do registro: ${latestSentimentRecord.createdAt.toISOString()}.`,
            latestSentimentRecord.note ? `Relato da pessoa: ${latestSentimentRecord.note}` : "A pessoa não deixou um relato textual neste registro.",
          ].join("\n"),
        }]
      : currentSentiment
        ? [{
            role: "system" as const,
            content: [
              "A pessoa escolheu conversar sobre o último sentimento salvo no perfil.",
              "Use este contexto para acolher e conduzir a conversa naturalmente, sem mencionar que recebeu um contexto oculto nem transformar o rótulo em diagnóstico.",
              `Sentimento registrado: ${currentSentiment}.`,
              profile?.currentSentimentAt ? `Data do registro: ${profile.currentSentimentAt.toISOString()}.` : "A data do registro não está disponível.",
            ].join("\n"),
          }]
        : [];
    const input = {
      conversationId,
      userId: session.user.id,
      userMessageId,
      userMessage: message,
      messages: [
        ...identityContext,
        ...latestSentimentContext,
        ...memory.messages.map((item) => ({
          role: item.role === "assistant" ? "assistant" as const : "user" as const,
          content: item.content,
        })),
      ],
      currentSentiment,
      detectedSentiment: null,
      sentimentChanged: false,
      approvedSentiment: currentSentiment,
      assistantResponse: "",
    };

    const stream = await graph.stream(input, {
      ...config,
      streamMode: ["custom", "updates"],
    });

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (event: AgentEvent) => controller.enqueue(encoder.encode(ndjson(event)));

        try {
          for await (const item of stream) {
            const graphEvent = getGraphEvent(item);
            const mode = graphEvent?.mode;
            const chunk = graphEvent?.chunk ?? item;

            if (mode === "custom" && chunk && typeof chunk === "object" && "type" in chunk && (chunk as { type?: unknown }).type === "token") {
              const content = (chunk as { content?: unknown }).content;
              if (typeof content === "string" && content) send({ type: "token", content });
            }

          }

          const snapshot = await graph.getState(config);
          const values = snapshot.values as EscutiaStateType;
          const finalSentiment = values.approvedSentiment || values.currentSentiment || values.detectedSentiment;
          const messageSentiment = values.detectedSentiment;
          const sentimentChanged = Boolean(messageSentiment && messageSentiment !== currentSentiment);
          const sentimentAt = sentimentChanged ? new Date() : profile?.currentSentimentAt ?? null;
          const persistedUserMessageId = values.userMessageId || userMessageId;

          if (values.assistantResponse) {
            const assistant = await prisma.$transaction(async (transaction) => {
              const created = await transaction.message.create({
                data: { conversationId, role: "assistant", content: values.assistantResponse, sentiment: messageSentiment },
                select: { id: true, content: true, sentiment: true },
              });
              if (sentimentChanged && messageSentiment) {
                await transaction.sentimentRecord.create({
                  data: { userId: session.user.id, sentiment: messageSentiment, note: message },
                });
                await transaction.user.update({
                  where: { id: session.user.id },
                  data: { currentSentiment: messageSentiment, currentSentimentAt: sentimentAt },
                });
              }
              await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
              return created;
            });

            send({
              type: "done",
              message: { id: assistant.id, role: "assistant", content: assistant.content, sentiment: assistant.sentiment as SentimentLabel | null },
              userMessage: { id: persistedUserMessageId },
              sentiment: finalSentiment,
              sentimentAt: sentimentAt?.toISOString() ?? null,
            });
          }
        } catch (error) {
          console.error("Erro no agente EscutIA:", error);
          send({ type: "error", message: "Não foi possível responder agora. Tente novamente em instantes." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Não foi possível iniciar o agente EscutIA:", error);
    if (error instanceof Error && error.message === "MESSAGE_NOT_FOUND") {
      return NextResponse.json({ error: "Mensagem não encontrada para edição." }, { status: 404 });
    }
    return NextResponse.json({ error: "Não foi possível iniciar a conversa agora." }, { status: 503 });
  }
}
