import { analyzeSentiment } from "@/agent/tools/sentiment-tool";
import type { EscutiaStateType } from "@/agent/graph/state";

const LOW_SIGNAL_MESSAGES = new Set([
  "oi", "ola", "olá", "e ai", "e aí", "eai", "ei",
  "bom dia", "boa tarde", "boa noite", "oi tudo bem", "ola tudo bem", "olá tudo bem",
  "tudo bem", "tudo certo", "como vai", "obrigado", "obrigada", "valeu",
  "ok", "okay", "certo", "entendi", "sim", "nao", "não", "hmm", "hum",
]);

function normalizeMessage(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[!?.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function shouldAnalyzeSentiment(message: string) {
  return !LOW_SIGNAL_MESSAGES.has(normalizeMessage(message));
}

export async function analyzeSentimentNode(state: EscutiaStateType) {
  if (!shouldAnalyzeSentiment(state.userMessage)) {
    return {
      detectedSentiment: null,
      sentimentChanged: false,
      approvedSentiment: state.currentSentiment,
    };
  }

  const result = await analyzeSentiment(state.userMessage);
  const sentimentChanged = Boolean(state.currentSentiment && state.currentSentiment !== result.sentiment);

  return {
    detectedSentiment: result.sentiment,
    sentimentChanged,
    approvedSentiment: result.sentiment,
  };
}
