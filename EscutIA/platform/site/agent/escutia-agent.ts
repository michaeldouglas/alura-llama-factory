import { ChatOllama } from "@langchain/ollama";

import { createNegativoAgent } from "@/agent/subagents/negativo-agent";
import { createNeutroAgent } from "@/agent/subagents/neutro-agent";
import { createPositivoAgent } from "@/agent/subagents/positivo-agent";
import type { SentimentLabel } from "@/lib/sentiment";

const MODEL_NAME = process.env.OLLAMA_MODEL || "gpt-oss:20b-cloud";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const globalForAgent = globalThis as unknown as {
  escutiaModel: ChatOllama | undefined;
  escutiaAgents: Map<SentimentLabel, ReturnType<typeof createPositivoAgent>> | undefined;
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

export function getEscutiaAgent(sentiment: SentimentLabel | null) {
  const selectedSentiment = sentiment || "neutro";
  const agents = globalForAgent.escutiaAgents || new Map<SentimentLabel, ReturnType<typeof createPositivoAgent>>();

  if (!agents.has(selectedSentiment)) {
    const model = getEscutiaModel();
    const agent = selectedSentiment === "positivo"
      ? createPositivoAgent(model)
      : selectedSentiment === "negativo"
        ? createNegativoAgent(model)
        : createNeutroAgent(model);
    agents.set(selectedSentiment, agent);
  }

  globalForAgent.escutiaAgents = agents;
  return agents.get(selectedSentiment)!;
}
