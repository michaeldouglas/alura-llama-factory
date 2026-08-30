import { ChatOllama } from "@langchain/ollama";

import { createNegativoAgent } from "@/agent/subagents/negativo-agent";
import { createNeutroAgent } from "@/agent/subagents/neutro-agent";
import { createPositivoAgent } from "@/agent/subagents/positivo-agent";
import type { SentimentLabel } from "@/lib/sentiment";
import type { ConversationMode } from "@/lib/conversation";

const MODEL_NAME = process.env.OLLAMA_MODEL || "gpt-oss:20b-cloud";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const globalForAgent = globalThis as unknown as {
  escutiaModel: ChatOllama | undefined;
  escutiaAgents: Map<string, ReturnType<typeof createPositivoAgent>> | undefined;
};

export function getEscutiaModel() {
  if (!globalForAgent.escutiaModel) {
    globalForAgent.escutiaModel = new ChatOllama({
      model: MODEL_NAME,
      baseUrl: OLLAMA_BASE_URL,
      temperature: 0,
    });
  }

  return globalForAgent.escutiaModel;
}

export function getEscutiaAgent(sentiment: SentimentLabel | null, mode: ConversationMode = "ouvir") {
  const selectedSentiment = sentiment || "neutro";
  const agents = globalForAgent.escutiaAgents || new Map<string, ReturnType<typeof createPositivoAgent>>();
  const cacheKey = `${selectedSentiment}:${mode}`;

  if (!agents.has(cacheKey)) {
    const model = getEscutiaModel();
    const sentimentAgent = selectedSentiment === "positivo"
      ? createPositivoAgent(model, mode)
      : selectedSentiment === "negativo"
        ? createNegativoAgent(model, mode)
        : createNeutroAgent(model, mode);
    agents.set(cacheKey, sentimentAgent);
  }

  globalForAgent.escutiaAgents = agents;
  return agents.get(cacheKey)!;
}
