import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { analyzeSentimentTool } from "@/agent/tools/sentiment-tool";
import { ESCUTIA_SYSTEM_PROMPT } from "@/prompts/escutia-prompt";
import { POSITIVO_SUBAGENT_PROMPT } from "@/prompts/subagents/positivo-prompt";

export function createPositivoAgent(model: ChatOllama) {
  return createAgent({
    model,
    tools: [analyzeSentimentTool],
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${POSITIVO_SUBAGENT_PROMPT}`,
  });
}
