export type PlanKey = "free" | "essential" | "premium" | "human_care";
export type BillingLookupKey =
  | "escutia_free_monthly"
  | "escutia_essential_monthly"
  | "escutia_premium_monthly"
  | "escutia_human_care_monthly"
  | "escutia_ai_responses_100_onetime";

export type CatalogItem = {
  lookupKey: BillingLookupKey;
  name: string;
  description: string;
  amount: number;
  currency: "brl";
  billingType: "recurring" | "one_time";
  interval?: "month";
  planKey?: PlanKey;
  monthlyAiResponses?: number;
  includesHumanSession: boolean;
  humanSessionsPerMonth: number;
  eligiblePlans?: PlanKey[];
};

export const FREE_LOOKUP_KEY: BillingLookupKey = "escutia_free_monthly";
export const ADDON_LOOKUP_KEY: BillingLookupKey = "escutia_ai_responses_100_onetime";

export const BILLING_CATALOG: Record<BillingLookupKey, CatalogItem> = {
  escutia_free_monthly: {
    lookupKey: "escutia_free_monthly",
    name: "EscutIA Grátis",
    description: "Uma forma gratuita de conhecer a EscutIA, registrar como você está se sentindo e organizar seus pensamentos.",
    amount: 0,
    currency: "brl",
    billingType: "recurring",
    interval: "month",
    planKey: "free",
    monthlyAiResponses: 20,
    includesHumanSession: false,
    humanSessionsPerMonth: 0,
  },
  escutia_essential_monthly: {
    lookupKey: "escutia_essential_monthly",
    name: "EscutIA Essencial",
    description: "Mais espaço para conversar, acompanhar seus registros e compreender os padrões observados no período.",
    amount: 2490,
    currency: "brl",
    billingType: "recurring",
    interval: "month",
    planKey: "essential",
    monthlyAiResponses: 150,
    includesHumanSession: false,
    humanSessionsPerMonth: 0,
  },
  escutia_premium_monthly: {
    lookupKey: "escutia_premium_monthly",
    name: "EscutIA Premium",
    description: "A experiência digital mais completa da EscutIA, com histórico, relatórios pessoais e recursos avançados de acompanhamento.",
    amount: 4990,
    currency: "brl",
    billingType: "recurring",
    interval: "month",
    planKey: "premium",
    monthlyAiResponses: 500,
    includesHumanSession: false,
    humanSessionsPerMonth: 0,
  },
  escutia_human_care_monthly: {
    lookupKey: "escutia_human_care_monthly",
    name: "EscutIA Cuidado Humano",
    description: "Todos os recursos digitais da EscutIA e acesso mensal a uma sessão online realizada por psicólogo humano habilitado, mediante agendamento e disponibilidade.",
    amount: 27990,
    currency: "brl",
    billingType: "recurring",
    interval: "month",
    planKey: "human_care",
    monthlyAiResponses: 500,
    includesHumanSession: true,
    humanSessionsPerMonth: 1,
  },
  escutia_ai_responses_100_onetime: {
    lookupKey: "escutia_ai_responses_100_onetime",
    name: "Pacote EscutIA — 100 respostas adicionais",
    description: "Adicione 100 respostas da IA ao limite disponível no ciclo atual da sua assinatura.",
    amount: 990,
    currency: "brl",
    billingType: "one_time",
    includesHumanSession: false,
    humanSessionsPerMonth: 0,
    eligiblePlans: ["essential", "premium", "human_care"],
  },
};

export const PAID_PLAN_LOOKUP_KEYS = [
  "escutia_essential_monthly",
  "escutia_premium_monthly",
  "escutia_human_care_monthly",
] as const;

export function getCatalogItem(lookupKey: string) {
  return BILLING_CATALOG[lookupKey as BillingLookupKey];
}

export function isHumanCareEnabled() {
  return process.env.ESCUTIA_HUMAN_CARE_ENABLED === "true";
}

export function isPaidPlan(planKey: string): planKey is Exclude<PlanKey, "free"> {
  return planKey === "essential" || planKey === "premium" || planKey === "human_care";
}

export function getPlanByLookupKey(lookupKey: string): CatalogItem | undefined {
  const item = getCatalogItem(lookupKey);
  return item?.planKey ? item : undefined;
}
