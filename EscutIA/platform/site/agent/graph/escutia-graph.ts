import { END, START, StateGraph } from "@langchain/langgraph";

import { getCheckpointer } from "@/agent/memory/checkpointer";
import { analyzeSentimentNode } from "@/agent/graph/nodes/analisar-sentimento";
import { respondNode } from "@/agent/graph/nodes/responder";
import { EscutiaState } from "@/agent/graph/state";

const globalForGraph = globalThis as unknown as {
  escutiaGraph: ReturnType<typeof createEscutiaGraph> | undefined;
};

function createEscutiaGraph() {
  return new StateGraph(EscutiaState)
    .addNode("analyze_sentiment", analyzeSentimentNode)
    .addNode("respond", respondNode)
    .addEdge(START, "analyze_sentiment")
    .addEdge("analyze_sentiment", "respond")
    .addEdge("respond", END)
    .compile({ checkpointer: getCheckpointer() });
}

export function getEscutiaGraph() {
  if (!globalForGraph.escutiaGraph) {
    globalForGraph.escutiaGraph = createEscutiaGraph();
  }

  return globalForGraph.escutiaGraph;
}
