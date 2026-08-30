import { StateSchema } from "@langchain/langgraph";
import { z } from "zod";

const SentimentSchema = z.enum(["negativo", "neutro", "positivo"]);

export const EscutiaState = new StateSchema({
  conversationId: z.string(),
  userId: z.string(),
  userMessageId: z.string().default(""),
  userMessage: z.string(),
  mode: z.enum(["ouvir", "organizar", "possibilidades", "bom"]).default("ouvir"),
  skipSentiment: z.boolean().default(false),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string(),
  })).default(() => []),
  currentSentiment: SentimentSchema.nullable().default(null),
  detectedSentiment: SentimentSchema.nullable().default(null),
  sentimentChanged: z.boolean().default(false),
  approvedSentiment: SentimentSchema.nullable().default(null),
  assistantResponse: z.string().default(""),
});

export type EscutiaStateType = typeof EscutiaState.State;
