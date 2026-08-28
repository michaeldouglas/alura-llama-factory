import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { analyzeSentimentTool } from "@/agent/tools/sentiment-tool";
import { ESCUTIA_SYSTEM_PROMPT } from "@/prompts/escutia-prompt";
import { NEUTRO_SUBAGENT_PROMPT } from "@/prompts/subagents/neutro-prompt";

export function createNeutroAgent(model: ChatOllama) {
  return createAgent({
    model,
    tools: [analyzeSentimentTool],
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${NEUTRO_SUBAGENT_PROMPT}`,
  });
}
