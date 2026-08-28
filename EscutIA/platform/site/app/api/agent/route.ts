import { Command } from "@langchain/langgraph";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getConversationMemory } from "@/agent/memory/conversation-memory";
import { getEscutiaGraph } from "@/graph/escutia-graph";
import type { EscutiaStateType } from "@/graph/state";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SentimentLabel } from "@/lib/sentiment";

export const runtime = "nodejs";
export const maxDuration = 300;

type AgentRequest = {
  conversationId?: unknown;
  message?: unknown;
  confirmation?: unknown;
};

type AgentEvent =
  | { type: "token"; content: string }
  | {
      type: "sentiment_confirmation";
      question: string;
      previousSentiment: SentimentLabel | null;
      detectedSentiment: SentimentLabel | null;
    }
  | {
      type: "done";
      message: { id: string; role: "assistant"; content: string; sentiment: null };
      sentiment: SentimentLabel | null;
      sentimentAt: string | null;
    }
  | { type: "error"; message: string };

const SENTIMENTS = new Set<SentimentLabel>(["negativo", "neutro", "positivo"]);

function asSentiment(value: unknown): SentimentLabel | null {
  return typeof value === "string" && SENTIMENTS.has(value as SentimentLabel) ? value as SentimentLabel : null;
}

function ndjson(event: AgentEvent) {
  return `${JSON.stringify(event)}\n`;
}

function getInterruptValue(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const interrupt = (value as { __interrupt__?: unknown }).__interrupt__;
  if (!Array.isArray(interrupt) || !interrupt.length) return null;
  const first = interrupt[0];
  if (first && typeof first === "object" && "value" in first) return (first as { value: unknown }).value;
  return first;
}

function getGraphEvent(value: unknown) {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string") return null;
  return { mode: value[0], chunk: value[1] };
}

function findInterrupt(value: unknown): unknown {
  const direct = getInterruptValue(value);
  if (direct) return direct;
  if (!value || typeof value !== "object") return null;
  for (const nested of Object.values(value)) {
    const found = getInterruptValue(nested);
    if (found) return found;
  }
  return null;
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
  const isResume = typeof body?.confirmation === "boolean";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!conversationId) {
    return NextResponse.json({ error: "Conversa não informada." }, { status: 400 });
  }
  if (!isResume && (!message || message.length > 2000)) {
    return NextResponse.json({ error: "A mensagem deve ter entre 1 e 2000 caracteres." }, { status: 400 });
  }
  if (isResume && body?.message !== undefined) {
    return NextResponse.json({ error: "Pedido de confirmação inválido." }, { status: 400 });
  }

  try {
    const conversation = await verifyConversation(conversationId, session.user.id);
    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentSentiment: true, currentSentimentAt: true },
    });

    let userMessageId = "";
    if (!isResume) {
      const created = await prisma.$transaction(async (transaction) => {
        const savedMessage = await transaction.message.create({
          data: { conversationId, role: "user", content: message },
          select: { id: true },
        });
        await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        return savedMessage;
      });
      userMessageId = created.id;
    }

    const memory = isResume ? null : await getConversationMemory(conversationId, session.user.id);
    const currentSentiment = asSentiment(profile?.currentSentiment);
    const graph = getEscutiaGraph();
    const config = { configurable: { thread_id: conversationId } };
    const input = isResume
      ? new Command<{ confirmed: boolean }, Record<string, unknown>, "__start__" | "analyze_sentiment" | "confirm_sentiment_change" | "respond">({ resume: { confirmed: body?.confirmation === true } })
      : {
          conversationId,
          userId: session.user.id,
          userMessageId,
          userMessage: message,
          messages: memory?.messages.map((item) => ({
            role: item.role === "assistant" ? "assistant" as const : "user" as const,
            content: item.content,
          })) ?? [],
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
        let interrupted = false;

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

            if (mode === "updates" || !mode) {
              const interrupt = findInterrupt(chunk);
              if (interrupt && typeof interrupt === "object") {
                const value = interrupt as {
                  question?: unknown;
                  previousSentiment?: unknown;
                  detectedSentiment?: unknown;
                };
                send({
                  type: "sentiment_confirmation",
                  question: typeof value.question === "string" ? value.question : "Percebi uma mudança no seu sentimento. É isso mesmo?",
                  previousSentiment: asSentiment(value.previousSentiment),
                  detectedSentiment: asSentiment(value.detectedSentiment),
                });
                interrupted = true;
              }
            }
          }

          if (interrupted) return;

          const snapshot = await graph.getState(config);
          const values = snapshot.values as EscutiaStateType;
          const finalSentiment = values.approvedSentiment || values.currentSentiment || values.detectedSentiment;
          const sentimentChanged = finalSentiment !== currentSentiment;
          const sentimentAt = sentimentChanged ? new Date() : profile?.currentSentimentAt ?? null;
          const persistedUserMessageId = values.userMessageId || userMessageId;

          if (values.assistantResponse) {
            const assistant = await prisma.$transaction(async (transaction) => {
              const created = await transaction.message.create({
                data: { conversationId, role: "assistant", content: values.assistantResponse },
                select: { id: true, content: true },
              });
              if (persistedUserMessageId && finalSentiment) {
                await transaction.message.update({ where: { id: persistedUserMessageId }, data: { sentiment: finalSentiment } });
              }
              if (sentimentChanged && finalSentiment) {
                await transaction.user.update({
                  where: { id: session.user.id },
                  data: { currentSentiment: finalSentiment, currentSentimentAt: sentimentAt },
                });
              }
              await transaction.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
              return created;
            });

            send({
              type: "done",
              message: { id: assistant.id, role: "assistant", content: assistant.content, sentiment: null },
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
    return NextResponse.json({ error: "Não foi possível iniciar a conversa agora." }, { status: 503 });
  }
}
