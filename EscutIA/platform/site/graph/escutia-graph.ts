import { END, START, StateGraph } from "@langchain/langgraph";

import { getCheckpointer } from "@/agent/memory/checkpointer";
import { analyzeSentimentNode } from "@/graph/nodes/analisar-sentimento";
import { confirmSentimentChangeNode } from "@/graph/nodes/confirmar-mudanca";
import { respondNode } from "@/graph/nodes/responder";
import { EscutiaState } from "@/graph/state";

const globalForGraph = globalThis as unknown as {
  escutiaGraph: ReturnType<typeof createEscutiaGraph> | undefined;
};

function routeAfterSentiment(state: typeof EscutiaState.State) {
  return state.sentimentChanged ? "confirm_sentiment_change" : "respond";
}

function createEscutiaGraph() {
  return new StateGraph(EscutiaState)
    .addNode("analyze_sentiment", analyzeSentimentNode)
    .addNode("confirm_sentiment_change", confirmSentimentChangeNode)
    .addNode("respond", respondNode)
    .addEdge(START, "analyze_sentiment")
    .addConditionalEdges("analyze_sentiment", routeAfterSentiment, {
      confirm_sentiment_change: "confirm_sentiment_change",
      respond: "respond",
    })
    .addEdge("confirm_sentiment_change", "respond")
    .addEdge("respond", END)
    .compile({ checkpointer: getCheckpointer() });
}

export function getEscutiaGraph() {
  if (!globalForGraph.escutiaGraph) {
    globalForGraph.escutiaGraph = createEscutiaGraph();
  }

  return globalForGraph.escutiaGraph;
}
