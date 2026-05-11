import type { Ticket, Rule, Run } from "./types";

type Store = {
  tickets: Ticket[];
  rules: Rule[];
  runs: Run[];
  nextRunId: number;
};

const SEED_TICKETS: Ticket[] = [
  {
    id: 1,
    customer: "Maya Patel",
    subject: "Where is my order #A1042?",
    body: "Hi, I placed an order three days ago and I haven't seen any shipping update. Order number A1042. Can you tell me where it is?",
    status: "open",
    escalated: false,
  },
  {
    id: 2,
    customer: "Ben Carter",
    subject: "Refund for damaged blender",
    body: "The blender arrived with a cracked jar. I'd like a refund please, not a replacement. Order B2200.",
    status: "open",
    escalated: false,
  },
  {
    id: 3,
    customer: "Sara Lin",
    subject: "Cancel my order before it ships",
    body: "Hi, I just placed order C9920 about 20 minutes ago. Please cancel it — I picked the wrong size.",
    status: "open",
    escalated: false,
  },
  {
    id: 4,
    customer: "Diego Ruiz",
    subject: "When will shipping be free again?",
    body: "Last month you had a free shipping promo. Is it coming back? Order D7711 had to pay $9.99 freight.",
    status: "open",
    escalated: false,
  },
  {
    id: 5,
    customer: "Emily Zhao",
    subject: "Refund still not received",
    body: "I returned the package two weeks ago and haven't seen the refund hit my card yet. Order E1188.",
    status: "open",
    escalated: false,
  },
  {
    id: 6,
    customer: "Aaron Webb",
    subject: "Order status — tracking shows nothing",
    body: "Order F4520 shows 'label created' for 5 days. Has it actually shipped?",
    status: "open",
    escalated: false,
  },
  {
    id: 7,
    customer: "Priya Nair",
    subject: "Need to cancel order — bought duplicate",
    body: "I accidentally placed order G3301 twice. Please cancel the second one.",
    status: "open",
    escalated: false,
  },
  {
    id: 8,
    customer: "Tomás Bauer",
    subject: "Shipping address change request",
    body: "Order H8800 — can you ship to my office instead? New address: 200 Market St, SF.",
    status: "open",
    escalated: false,
  },
  {
    id: 9,
    customer: "Hana Kim",
    subject: "Refund for wrong color",
    body: "Order I5566 came in red, I ordered the navy one. Want a refund.",
    status: "open",
    escalated: false,
  },
  {
    id: 10,
    customer: "Unknown Caller",
    subject: "??? confusing legal-ish question about your TOS clause 14",
    body: "I'm a lawyer and I want to know how clause 14 of your TOS interacts with arbitration carve-outs under California Civ Code 1750 et seq. Please advise immediately.",
    status: "open",
    escalated: false,
  },
];

const SEED_RULES: Rule[] = [
  {
    id: 1,
    intent: "order_status",
    policy: "Check the order in our system, share the carrier + tracking URL, and set expectations on delivery window.",
    tone: "warm, concise, proactive",
    exampleReply:
      "Hi {name}, thanks for reaching out — your order {order} shipped via {carrier}. Tracking: {url}. ETA: {eta}.",
    updatedAt: Date.now(),
  },
  {
    id: 2,
    intent: "refund",
    policy: "STANDARD_REFUND_30D — Issue refunds for damaged/wrong items within 30 days of delivery; refund to original payment method.",
    tone: "apologetic, decisive",
    exampleReply:
      "Hi {name}, I'm sorry your order {order} arrived in poor shape. I've issued a full refund to your original payment method — funds should return in 3–5 business days.",
    updatedAt: Date.now(),
  },
  {
    id: 3,
    intent: "cancellation",
    policy: "Cancel only if order has not yet entered fulfillment (within 1 hour of placement).",
    tone: "helpful, fast",
    exampleReply:
      "Hi {name}, good news — order {order} hasn't shipped yet, so I've cancelled it. You'll see the authorization drop off your card within 48 hours.",
    updatedAt: Date.now(),
  },
  {
    id: 4,
    intent: "shipping",
    policy: "Quote current shipping rates and live promos; do not promise unannounced future discounts.",
    tone: "friendly, factual",
    exampleReply:
      "Hi {name}, our standard shipping is $9.99 and free over $75. We rotate promos seasonally — keep an eye on your inbox for the next one.",
    updatedAt: Date.now(),
  },
];

const g = globalThis as unknown as { __helpdesk_store?: Store };

if (!g.__helpdesk_store) {
  g.__helpdesk_store = {
    tickets: SEED_TICKETS.map((t) => ({ ...t })),
    rules: SEED_RULES.map((r) => ({ ...r })),
    runs: [],
    nextRunId: 1,
  };
}

const store = g.__helpdesk_store!;

export function getTickets(): Ticket[] {
  return store.tickets.map((t) => ({ ...t }));
}

export function getTicket(id: number): Ticket | undefined {
  const t = store.tickets.find((t) => t.id === id);
  return t ? { ...t } : undefined;
}

export function updateTicket(id: number, patch: Partial<Ticket>): void {
  const idx = store.tickets.findIndex((t) => t.id === id);
  if (idx === -1) return;
  store.tickets[idx] = { ...store.tickets[idx], ...patch };
}

export function getRules(): Rule[] {
  return store.rules.map((r) => ({ ...r }));
}

export function getRule(id: number): Rule | undefined {
  const r = store.rules.find((r) => r.id === id);
  return r ? { ...r } : undefined;
}

export function getRuleByIntent(intent: string): Rule | undefined {
  const r = store.rules.find((r) => r.intent === intent);
  return r ? { ...r } : undefined;
}

export function updateRule(id: number, patch: Partial<Rule>): void {
  const idx = store.rules.findIndex((r) => r.id === id);
  if (idx === -1) return;
  store.rules[idx] = { ...store.rules[idx], ...patch, updatedAt: Date.now() };
}

export function addRun(r: Omit<Run, "id" | "createdAt">): Run {
  const run: Run = { ...r, id: store.nextRunId++, createdAt: Date.now() };
  store.runs.push(run);
  return run;
}

export function getRuns(): Run[] {
  return [...store.runs];
}

export function getMetrics(): { auto: number; escalated: number; avgConfidence: number; total: number } {
  const tickets = store.tickets;
  const drafted = tickets.filter((t) => t.aiDraft);
  const escalated = drafted.filter((t) => t.escalated).length;
  const auto = drafted.length - escalated;
  const conf = drafted.length
    ? drafted.reduce((s, t) => s + (t.confidence ?? 0), 0) / drafted.length
    : 0;
  return { auto, escalated, avgConfidence: conf, total: tickets.length };
}
