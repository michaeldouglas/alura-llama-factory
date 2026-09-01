export const CONVERSATION_MODES = ["ouvir", "organizar", "possibilidades", "bom"] as const;

export type ConversationMode = (typeof CONVERSATION_MODES)[number];

export const CONVERSATION_MODE_COPY: Record<ConversationMode, {
  label: string;
  description: string;
}> = {
  ouvir: {
    label: "Só quero ser ouvido",
    description: "Mais espaço para você falar, sem pressa de encontrar respostas.",
  },
  organizar: {
    label: "Ajude-me a organizar meus pensamentos",
    description: "Vamos separar o que aconteceu, o que você pensa e o que precisa.",
  },
  possibilidades: {
    label: "Quero pensar em possibilidades",
    description: "Podemos olhar para caminhos e próximos passos com calma.",
  },
  bom: {
    label: "Quero conversar sobre algo bom",
    description: "Um espaço para compartilhar, reconhecer e aproveitar algo positivo.",
  },
};

export function isConversationMode(value: unknown): value is ConversationMode {
  return typeof value === "string" && CONVERSATION_MODES.includes(value as ConversationMode);
}

export function normalizeConversationMode(value: unknown): ConversationMode {
  return isConversationMode(value) ? value : "ouvir";
}

export function getConversationModeInstruction(mode: ConversationMode) {
  switch (mode) {
    case "ouvir":
      return "A pessoa escolheu apenas ser ouvida. Dê espaço, reflita com cuidado o que ela trouxe e faça no máximo uma pergunta aberta por vez. Não acelere para conselhos ou soluções.";
    case "organizar":
      return "A pessoa quer organizar os pensamentos. Ajude a distinguir fatos, percepções, sentimentos, necessidades e dúvidas sem transformar isso em avaliação clínica. Avance uma pergunta ou síntese por vez.";
    case "possibilidades":
      return "A pessoa quer pensar em possibilidades. Explore alternativas, limites e pequenos próximos passos como convite, sem prescrever uma decisão nem tratar uma opção como a única correta.";
    case "bom":
      return "A pessoa quer conversar sobre algo bom. Demonstre curiosidade genuína, ajude a reconhecer o que foi significativo e não force otimismo nem use a conversa para minimizar dificuldades.";
  }
}

export const CHECK_IN_OPTIONS = [
  { value: "negativo", label: "Ruim" },
  { value: "neutro", label: "Neutro" },
  { value: "positivo", label: "Bem" },
] as const;

export type ConversationSentiment = (typeof CHECK_IN_OPTIONS)[number]["value"];

export function isConversationSentiment(value: unknown): value is ConversationSentiment {
  return typeof value === "string" && CHECK_IN_OPTIONS.some((option) => option.value === value);
}

export const JOURNAL_TYPES = ["frase", "reflexao", "conquista", "preocupacao", "proximo-passo"] as const;

export type JournalType = (typeof JOURNAL_TYPES)[number];

export const JOURNAL_TYPE_COPY: Record<JournalType, string> = {
  frase: "Frase importante",
  reflexao: "Reflexão",
  conquista: "Conquista",
  preocupacao: "Preocupação",
  "proximo-passo": "Próximo passo",
};

export function isJournalType(value: unknown): value is JournalType {
  return typeof value === "string" && JOURNAL_TYPES.includes(value as JournalType);
}

export const RESOURCE_KINDS = ["atividade", "pessoa", "lugar", "frase", "lembranca"] as const;

export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const RESOURCE_KIND_COPY: Record<ResourceKind, string> = {
  atividade: "Atividade",
  pessoa: "Pessoa de confiança",
  lugar: "Lugar seguro",
  frase: "Frase",
  lembranca: "Lembrança positiva",
};

export function isResourceKind(value: unknown): value is ResourceKind {
  return typeof value === "string" && RESOURCE_KINDS.includes(value as ResourceKind);
}
