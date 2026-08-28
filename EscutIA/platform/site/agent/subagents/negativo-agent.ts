import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { analyzeSentimentTool } from "@/agent/tools/sentiment-tool";
import { ESCUTIA_SYSTEM_PROMPT } from "@/prompts/escutia-prompt";
import { NEGATIVO_SUBAGENT_PROMPT } from "@/prompts/subagents/negativo-prompt";

export function createNegativoAgent(model: ChatOllama) {
  return createAgent({
    model,
    tools: [analyzeSentimentTool],
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${NEGATIVO_SUBAGENT_PROMPT}`,
  });
}
