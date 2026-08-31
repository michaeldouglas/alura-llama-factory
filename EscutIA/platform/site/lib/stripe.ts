type StripeRequestMethod = "GET" | "POST";

export type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  livemode: boolean;
  lookup_key: string | null;
  type: "recurring" | "one_time";
  unit_amount: number | null;
  recurring: { interval: string; interval_count: number } | null;
};

export type StripeCustomer = {
  id: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, string>;
};

export type StripeCheckoutSession = {
  id: string;
  url?: string | null;
  mode: "payment" | "subscription" | "setup";
  customer: string | StripeCustomer | null;
  subscription: string | StripeSubscription | null;
  payment_intent: string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  metadata?: Record<string, string>;
};

export type StripeSubscription = {
  id: string;
  customer: string | StripeCustomer;
  status: string;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  created?: number;
  billing_cycle_anchor?: number | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  ended_at: number | null;
  metadata?: Record<string, string>;
  items: {
    data: Array<{
      price: StripePrice;
      current_period_start?: number | null;
      current_period_end?: number | null;
    }>;
  };
};

export type StripeInvoice = {
  id: string;
  subscription: string | StripeSubscription | null;
  customer: string | StripeCustomer | null;
  status: string | null;
};

export type StripeCharge = {
  id: string;
  payment_intent: string | null;
  refunded: boolean;
};

type StripeList<T> = { data: T[]; has_more: boolean };

type StripeRequestOptions = {
  idempotencyKey?: string;
};

export type StripeEventPayload = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
};

export class StripeApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "StripeApiError";
    this.status = status;
    this.code = code;
  }
}

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || (!key.startsWith("sk_test_") && !key.startsWith("rk_test_"))) {
    throw new Error("STRIPE_TEST_MODE_REQUIRED");
  }
  return key;
}

async function stripeRequest<T>(method: StripeRequestMethod, path: string, parameters?: Record<string, string>, options?: StripeRequestOptions) {
  const encodedParameters = parameters ? new URLSearchParams(parameters) : undefined;
  const query = method === "GET" && encodedParameters ? `?${encodedParameters.toString()}` : "";
  const body = method === "POST" ? encodedParameters : undefined;
  const response = await fetch(`https://api.stripe.com/v1${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  if (!response.ok) {
    throw new StripeApiError(payload?.error?.message || "A Stripe recusou a solicitação.", response.status, payload?.error?.code);
  }
  return payload as T;
}

export async function findPriceByLookupKey(lookupKey: string) {
  const list = await stripeRequest<StripeList<StripePrice>>("GET", "/prices", {
    "lookup_keys[0]": lookupKey,
    active: "true",
    limit: "1",
  });
  const price = list.data[0];
  if (!price || !price.active || price.livemode || price.lookup_key !== lookupKey) {
    throw new Error(`STRIPE_PRICE_NOT_FOUND:${lookupKey}`);
  }
  return price;
}

export async function findPriceById(priceId: string) {
  const price = await stripeRequest<StripePrice>("GET", `/prices/${encodeURIComponent(priceId)}`);
  if (!price.active || price.livemode) throw new Error("STRIPE_TEST_PRICE_REQUIRED");
  return price;
}

export async function createStripeCustomer(input: { email?: string | null; name?: string | null; userId: string }) {
  return stripeRequest<StripeCustomer>("POST", "/customers", {
    ...(input.email ? { email: input.email } : {}),
    ...(input.name ? { name: input.name } : {}),
    "metadata[escutia_user_id]": input.userId,
  });
}

export async function createCheckoutSession(parameters: Record<string, string>, idempotencyKey?: string) {
  return stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", parameters, { idempotencyKey });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripeRequest<{ id: string; url: string }>("POST", "/billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl,
    ...(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION ? { configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION } : {}),
  });
}

export async function retrieveSubscription(subscriptionId: string) {
  return stripeRequest<StripeSubscription>("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function listCustomerSubscriptions(customerId: string) {
  return stripeRequest<StripeList<StripeSubscription>>("GET", "/subscriptions", {
    customer: customerId,
    status: "all",
    limit: "100",
  });
}

export async function verifyStripeWebhook(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET_MISSING");
  const parts = signature.split(",").reduce<Record<string, string[]>>((result, part) => {
    const [key, value] = part.split("=", 2);
    if (key && value) (result[key] ??= []).push(value);
    return result;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    throw new Error("STRIPE_WEBHOOK_SIGNATURE_INVALID");
  }
  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest();
  const valid = signatures.some((candidate) => {
    const received = Buffer.from(candidate, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!valid) throw new Error("STRIPE_WEBHOOK_SIGNATURE_INVALID");
  const event = JSON.parse(payload) as StripeEventPayload;
  if (event.livemode) throw new Error("STRIPE_LIVE_EVENT_REJECTED");
  return event;
}
import { createHmac, timingSafeEqual } from "node:crypto";
