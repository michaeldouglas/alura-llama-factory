import type { Runtime } from "@langchain/langgraph";

import type { EscutiaStateType } from "@/graph/state";

export async function confirmSentimentChangeNode(state: EscutiaStateType, runtime: Runtime) {
  const answer = runtime.interrupt({
    type: "sentiment-change",
    previousSentiment: state.currentSentiment,
    detectedSentiment: state.detectedSentiment,
    question: "Percebi que talvez você esteja se sentindo diferente agora. É isso mesmo?",
  }) as { confirmed?: unknown } | boolean;
  const confirmed = typeof answer === "boolean" ? answer : answer?.confirmed === true;

  return {
    approvedSentiment: confirmed ? state.detectedSentiment : state.currentSentiment,
    currentSentiment: confirmed ? state.detectedSentiment : state.currentSentiment,
    sentimentChanged: false,
  };
}
