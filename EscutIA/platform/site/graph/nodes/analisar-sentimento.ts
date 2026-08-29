import { analyzeSentiment } from "@/agent/tools/sentiment-tool";
import type { EscutiaStateType } from "@/graph/state";

export async function analyzeSentimentNode(state: EscutiaStateType) {
  const result = await analyzeSentiment(state.userMessage);
  const sentimentChanged = Boolean(state.currentSentiment && state.currentSentiment !== result.sentiment);

  return {
    detectedSentiment: result.sentiment,
    sentimentChanged,
    approvedSentiment: result.sentiment,
  };
}
