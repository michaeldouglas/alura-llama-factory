import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { ESCUTIA_SYSTEM_PROMPT } from "@/agent/prompts/escutia-prompt";
import { POSITIVO_SUBAGENT_PROMPT } from "@/agent/prompts/subagents/positivo-prompt";

export function createPositivoAgent(model: ChatOllama) {
  return createAgent({
    model,
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${POSITIVO_SUBAGENT_PROMPT}`,
  });
}
