export type TicketStatus = "open" | "drafted" | "escalated";

export type Ticket = {
  id: number;
  customer: string;
  subject: string;
  body: string;
  intent?: string;
  status: TicketStatus;
  aiDraft?: string;
  confidence?: number;
  escalated: boolean;
};

export type Rule = {
  id: number;
  intent: string;
  policy: string;
  tone: string;
  exampleReply: string;
  updatedAt: number;
};

export type Run = {
  id: number;
  ticketId: number;
  ruleId?: number;
  provider: string;
  model: string;
  confidence: number;
  createdAt: number;
};

export type Provider = "anthropic" | "openai" | "google" | "mock";

export type Byok = {
  provider: Provider;
  apiKey: string;
  model: string;
};
