export const SENTIMENT_LABELS = ["negativo", "neutro", "positivo"] as const;

export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

const MODEL_ID = process.env.HF_MODEL_ID || "mdba/escutia-lora";
const HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models";

const SYSTEM_PROMPT =
  "Você é um roteador de sentimentos. Responda somente com JSON válido no " +
  'formato {"sentimento":"negativo|neutro|positivo"}.';
const INSTRUCTION =
  "Classifique o sentimento predominante do texto como negativo, neutro ou " +
  'positivo e responda somente com um JSON válido no formato {"sentimento":"<rotulo>"}.';

function extractSentiment(value: string): SentimentLabel | null {
  const jsonMatch = value.match(/\{[\s\S]*?\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { sentimento?: unknown };
      if (typeof parsed.sentimento === "string" && SENTIMENT_LABELS.includes(parsed.sentimento as SentimentLabel)) {
        return parsed.sentimento as SentimentLabel;
      }
    } catch {
      // A label isolada ainda pode ser recuperada abaixo.
    }
  }

  const labelMatch = value.toLowerCase().match(/\b(negativo|neutro|positivo)\b/);
  return labelMatch?.[1] as SentimentLabel | undefined ?? null;
}

function buildPrompt(text: string) {
  return `<|im_start|>system\n${SYSTEM_PROMPT}<|im_end|>\n<|im_start|>user\n${INSTRUCTION}\n\nTexto: ${text}<|im_end|>\n<|im_start|>assistant\n`;
}

export async function classifySentiment(text: string) {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error("HF_TOKEN_MISSING");
  }

  const response = await fetch(`${HF_INFERENCE_URL}/${MODEL_ID}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: buildPrompt(text),
      parameters: {
        max_new_tokens: 24,
        do_sample: false,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HF_INFERENCE_${response.status}`);
  }

  const payload = (await response.json()) as
    | { generated_text?: unknown }
    | Array<{ generated_text?: unknown }>;
  const generatedText = Array.isArray(payload) ? payload[0]?.generated_text : payload.generated_text;

  if (typeof generatedText !== "string") {
    throw new Error("HF_INVALID_RESPONSE");
  }

  const sentiment = extractSentiment(generatedText);
  if (!sentiment) {
    throw new Error("HF_INVALID_SENTIMENT");
  }

  return { sentiment, model: MODEL_ID };
}
