import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { ESCUTIA_SYSTEM_PROMPT } from "@/agent/prompts/escutia-prompt";
import { NEGATIVO_SUBAGENT_PROMPT } from "@/agent/prompts/subagents/negativo-prompt";

export function createNegativoAgent(model: ChatOllama) {
  return createAgent({
    model,
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${NEGATIVO_SUBAGENT_PROMPT}`,
  });
}
