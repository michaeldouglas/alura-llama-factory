import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

import { ESCUTIA_SYSTEM_PROMPT } from "@/agent/prompts/escutia-prompt";
import { NEGATIVO_SUBAGENT_PROMPT } from "@/agent/prompts/subagents/negativo-prompt";
import { CONVERSATION_MODE_COPY, getConversationModeInstruction, type ConversationMode } from "@/lib/conversation";

export function createNegativoAgent(model: ChatOllama, mode: ConversationMode = "ouvir") {
  return createAgent({
    model,
    systemPrompt: `${ESCUTIA_SYSTEM_PROMPT}\n\n${NEGATIVO_SUBAGENT_PROMPT}\n\n${getModePrompt(mode)}`,
  });
}

function getModePrompt(mode: ConversationMode) {
  return `# Ritmo escolhido para esta conversa\n\nA pessoa escolheu “${CONVERSATION_MODE_COPY[mode].label}”. Adapte concretamente a condução da resposta a esse ritmo:\n${getConversationModeInstruction(mode)}\nNão anuncie o nome técnico do modo nem diga que está seguindo uma configuração.`;
}
