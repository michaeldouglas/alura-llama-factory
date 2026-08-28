import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { classifySentiment, type SentimentLabel } from "@/lib/sentiment";

export type SentimentAnalysis = {
  sentiment: SentimentLabel;
  model: string;
};

export const analyzeSentimentTool = tool(
  async ({ text }): Promise<string> => {
    const result = await classifySentiment(text);
    return JSON.stringify(result);
  },
  {
    name: "analisar_sentimento",
    description: "Classifica o sentimento predominante de uma mensagem como negativo, neutro ou positivo.",
    schema: z.object({
      text: z.string().min(1).max(2000).describe("Texto da pessoa que deve ser analisado."),
    }),
  },
);

export async function analyzeSentiment(text: string) {
  const result = await analyzeSentimentTool.invoke({ text });
  const parsed = JSON.parse(typeof result === "string" ? result : String(result)) as Partial<SentimentAnalysis>;

  if (parsed.sentiment !== "negativo" && parsed.sentiment !== "neutro" && parsed.sentiment !== "positivo") {
    throw new Error("A ferramenta de sentimento retornou um valor inválido.");
  }

  return {
    sentiment: parsed.sentiment,
    model: typeof parsed.model === "string" ? parsed.model : "unknown",
  } satisfies SentimentAnalysis;
}
