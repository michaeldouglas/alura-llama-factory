import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getConversationMemory } from "@/agent/memory/conversation-memory";
import { getEscutiaGraph } from "@/agent/graph/escutia-graph";
import type { EscutiaStateType } from "@/agent/graph/state";
import { authOptions } from "@/lib/auth";
import { CONVERSATION_MODE_COPY, getConversationModeInstruction, isConversationMode, normalizeConversationMode, type ConversationMode } from "@/lib/conversation";
import { prisma } from "@/lib/prisma";
import type { SentimentLabel } from "@/lib/sentiment";
import { commitAiResponse, releaseAiResponse, reserveAiResponse } from "@/lib/billing/usage";

export const runtime = "nodejs";
export const maxDuration = 300;

type AgentRequest = {
  conversationId?: unknown;
  message?: unknown;
  focusLatestSentiment?: unknown;
  focusRecordId?: unknown;
  replaceMessageId?: unknown;
  privateMode?: unknown;
  mode?: unknown;
  resumeConversationId?: unknown;
  contextMessages?: unknown;
  requestId?: unknown;
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
    select: { id: true, mode: true, isPrivate: true },
  });
  return conversation;
}

function isPrivateConversationId(value: string) {
  return /^private-[A-Za-z0-9-]{10,100}$/.test(value);
}

function getContextMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(-30).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const trimmed = content.trim();
    return trimmed && trimmed.length <= 4000 ? [{ role, content: trimmed }] : [];
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as AgentRequest | null;
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : "";
  const requestedPrivateMode = body?.privateMode === true;
  const requestedMode = body?.mode;
  const focusLatestSentiment = body?.focusLatestSentiment === true;
  const focusRecordId = typeof body?.focusRecordId === "string" ? body.focusRecordId : "";
  const resumeConversationId = typeof body?.resumeConversationId === "string" ? body.resumeConversationId : "";
  const replaceMessageId = typeof body?.replaceMessageId === "string" ? body.replaceMessageId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const requestId = typeof body?.requestId === "string" && body.requestId.length <= 120 ? body.requestId : crypto.randomUUID();

  if (!conversationId || (requestedPrivateMode ? !isPrivateConversationId(conversationId) : false)) {
    return NextResponse.json({ error: "Conversa não informada." }, { status: 400 });
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "A mensagem deve ter entre 1 e 2000 caracteres." }, { status: 400 });
  }
  if (requestedPrivateMode && requestedMode !== undefined && !isConversationMode(requestedMode)) {
    return NextResponse.json({ error: "Modo de conversa inválido." }, { status: 400 });
  }
  if (replaceMessageId && requestedPrivateMode && !isPrivateConversationId(conversationId)) {
    return NextResponse.json({ error: "Conversa privada inválida." }, { status: 400 });
  }

  let usageReserved = false;
  const operationKey = `${session.user.id}:${requestId}`;
  try {
    const conversation = requestedPrivateMode ? null : await verifyConversation(conversationId, session.user.id);
    if (!requestedPrivateMode && !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const usage = await reserveAiResponse(session.user.id, operationKey);
    if (!usage.ok) return NextResponse.json({ code: "LIMIT_REACHED", error: "Você atingiu o limite de respostas disponível no seu ciclo." }, { status: 402 });
    if (usage.duplicate) return NextResponse.json({ error: "Esta resposta já está sendo processada ou foi concluída." }, { status: 409 });
    usageReserved = true;

    const [profile, latestSentimentRecord, resumeConversation] = await Promise.all([
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
      resumeConversationId
        ? prisma.conversation.findFirst({
            where: { id: resumeConversationId, userId: session.user.id },
            select: { id: true, title: true, messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 30, select: { role: true, content: true } } },
          })
        : Promise.resolve(null),
    ]);

    const created = requestedPrivateMode ? { id: `private-user-${crypto.randomUUID()}` } : await prisma.$transaction(async (transaction) => {
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

    const memory = requestedPrivateMode ? { messages: getContextMessages(body?.contextMessages) } : await getConversationMemory(conversationId, session.user.id);
    const resumedMessages = resumeConversation?.messages.map((item) => ({
      role: item.role === "assistant" ? "assistant" as const : "user" as const,
      content: item.content,
    })) ?? [];
    const currentSentiment = requestedPrivateMode ? null : asSentiment(profile?.currentSentiment);
    const mode: ConversationMode = requestedPrivateMode ? normalizeConversationMode(requestedMode) : normalizeConversationMode(conversation?.mode);
    const firstName = getFirstName(session.user.name, session.user.email);
    const isFirstInteraction = !replaceMessageId && memory.messages.length === (requestedPrivateMode ? 0 : 1);
    const graph = getEscutiaGraph({ persistent: !requestedPrivateMode });
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
    const modeContext = [{
      role: "system" as const,
      content: `Modo de acolhimento escolhido pela pessoa: ${CONVERSATION_MODE_COPY[mode]?.label ?? mode}.\n${getConversationModeInstruction(mode)}\nNão apresente este modo como rótulo clínico e não diga que uma conversa causou melhora ou piora.`,
    }];
    const resumeContext = resumedMessages.length
      ? [{
          role: "system" as const,
          content: "A pessoa escolheu retomar opcionalmente um assunto de uma conversa anterior. Use o contexto abaixo somente como ponto de partida e confirme com ela se ainda faz sentido falar sobre isso.",
        }, ...resumedMessages]
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
        ...modeContext,
        ...latestSentimentContext,
        ...resumeContext,
        ...memory.messages.map((item) => ({
          role: item.role === "assistant" ? "assistant" as const : "user" as const,
          content: item.content,
        })),
      ],
      currentSentiment,
      mode,
      skipSentiment: requestedPrivateMode,
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
        let streamedAssistantResponse = "";
        const streamedValues = { ...input } as EscutiaStateType;

        const send = (event: AgentEvent) => controller.enqueue(encoder.encode(ndjson(event)));

        try {
          for await (const item of stream) {
            const graphEvent = getGraphEvent(item);
            const mode = graphEvent?.mode;
            const chunk = graphEvent?.chunk ?? item;

            if (mode === "custom" && chunk && typeof chunk === "object" && "type" in chunk && (chunk as { type?: unknown }).type === "token") {
              const content = (chunk as { content?: unknown }).content;
              if (typeof content === "string" && content) {
                streamedAssistantResponse += content;
                send({ type: "token", content });
              }
            }
            if (mode === "custom" && chunk && typeof chunk === "object" && "type" in chunk && (chunk as { type?: unknown }).type === "complete") {
              const content = (chunk as { content?: unknown }).content;
              if (typeof content === "string") streamedAssistantResponse = content;
            }
            if (mode === "updates" && chunk && typeof chunk === "object") {
              for (const update of Object.values(chunk as Record<string, unknown>)) {
                if (update && typeof update === "object") Object.assign(streamedValues, update);
              }
            }

          }

          const values = requestedPrivateMode
            ? { ...streamedValues, assistantResponse: streamedAssistantResponse || streamedValues.assistantResponse }
            : (await graph.getState(config)).values as EscutiaStateType;
          const finalSentiment = values.approvedSentiment || values.currentSentiment || values.detectedSentiment;
          const messageSentiment = values.detectedSentiment;
          const sentimentChanged = Boolean(messageSentiment && messageSentiment !== currentSentiment);
          const sentimentAt = sentimentChanged ? new Date() : profile?.currentSentimentAt ?? null;
          const persistedUserMessageId = values.userMessageId || userMessageId;

          if (values.assistantResponse && requestedPrivateMode) {
            await commitAiResponse(operationKey);
            usageReserved = false;
            send({
              type: "done",
              message: { id: `private-assistant-${crypto.randomUUID()}`, role: "assistant", content: values.assistantResponse, sentiment: null },
              userMessage: { id: persistedUserMessageId },
              sentiment: null,
              sentimentAt: null,
            });
          } else if (values.assistantResponse) {
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

            await commitAiResponse(operationKey);
            usageReserved = false;
            send({
              type: "done",
              message: { id: assistant.id, role: "assistant", content: assistant.content, sentiment: assistant.sentiment as SentimentLabel | null },
              userMessage: { id: persistedUserMessageId },
              sentiment: finalSentiment,
              sentimentAt: sentimentAt?.toISOString() ?? null,
            });
          } else {
            throw new Error("NO_ASSISTANT_RESPONSE");
          }
        } catch (error) {
          if (usageReserved) {
            await releaseAiResponse(operationKey).catch(() => undefined);
            usageReserved = false;
          }
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
    if (usageReserved) await releaseAiResponse(operationKey).catch(() => undefined);
    console.error("Não foi possível iniciar o agente EscutIA:", error);
    if (error instanceof Error && error.message === "MESSAGE_NOT_FOUND") {
      return NextResponse.json({ error: "Mensagem não encontrada para edição." }, { status: 404 });
    }
    return NextResponse.json({ error: "Não foi possível iniciar a conversa agora." }, { status: 503 });
  }
}
