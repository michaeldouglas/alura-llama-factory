import { END, START, StateGraph } from "@langchain/langgraph";

import { getCheckpointer } from "@/agent/memory/checkpointer";
import { analyzeSentimentNode } from "@/agent/graph/nodes/analisar-sentimento";
import { respondNode } from "@/agent/graph/nodes/responder";
import { EscutiaState } from "@/agent/graph/state";

const globalForGraph = globalThis as unknown as {
  escutiaGraph: ReturnType<typeof createEscutiaGraph> | undefined;
  escutiaPrivateGraph: ReturnType<typeof createEscutiaGraph> | undefined;
};

function createEscutiaGraph(withCheckpointer = true) {
  const builder = new StateGraph(EscutiaState)
    .addNode("analyze_sentiment", analyzeSentimentNode)
    .addNode("respond", respondNode)
    .addEdge(START, "analyze_sentiment")
    .addEdge("analyze_sentiment", "respond")
    .addEdge("respond", END);

  return withCheckpointer ? builder.compile({ checkpointer: getCheckpointer() }) : builder.compile();
}

export function getEscutiaGraph(options: { persistent?: boolean } = {}) {
  if (options.persistent === false) {
    if (!globalForGraph.escutiaPrivateGraph) globalForGraph.escutiaPrivateGraph = createEscutiaGraph(false);
    return globalForGraph.escutiaPrivateGraph;
  }

  if (!globalForGraph.escutiaGraph) globalForGraph.escutiaGraph = createEscutiaGraph();
  return globalForGraph.escutiaGraph;
}
