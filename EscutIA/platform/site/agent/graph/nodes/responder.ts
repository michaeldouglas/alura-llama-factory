import type { Runtime } from "@langchain/langgraph";

import { getEscutiaAgent } from "@/agent/escutia-agent";
import type { EscutiaStateType } from "@/agent/graph/state";

function getTextContent(content: unknown) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((block) => {
      if (typeof block === "string") return block;
      if (block && typeof block === "object" && "text" in block && typeof block.text === "string") return block.text;
      return "";
    })
    .join("");
}

export async function respondNode(state: EscutiaStateType, runtime: Runtime) {
  const agent = getEscutiaAgent(state.approvedSentiment || state.currentSentiment, state.mode);
  const events = agent.streamEvents(
    { messages: state.messages },
    { version: "v2", signal: runtime.signal },
  );
  let assistantResponse = "";

  for await (const event of events) {
    if (event.event !== "on_chat_model_stream") continue;
    const content = getTextContent(event.data?.chunk?.content);
    if (!content) continue;
    assistantResponse += content;
    runtime.writer({ type: "token", content });
  }

  runtime.writer({ type: "complete", content: assistantResponse });

  return { assistantResponse };
}
