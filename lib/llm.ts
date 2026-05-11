"use client";

import type { Byok, Provider } from "./types";
import { classify, CONFIDENCE_THRESHOLD } from "./intent";

export const MODELS_BY_PROVIDER: Record<Exclude<Provider, "mock">, string[]> = {
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
  openai: ["gpt-4o-mini", "gpt-4o", "o1-mini"],
  google: ["gemini-2.0-flash", "gemini-2.5-pro"],
};

export const PROVIDER_LABEL: Record<Exclude<Provider, "mock">, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

export function getByok(): Byok | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("byok");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Byok;
  } catch {
    return null;
  }
}

export function setByok(b: Byok): void {
  window.localStorage.setItem("byok", JSON.stringify(b));
}

export function clearByok(): void {
  window.localStorage.removeItem("byok");
}

export type AiResult = {
  intent: string;
  confidence: number;
  draft: string;
  ruleId?: number;
  provider: string;
  model: string;
  escalated: boolean;
};

export type RuleLite = {
  id: number;
  intent: string;
  policy: string;
  tone: string;
  exampleReply: string;
};

export type TicketLite = {
  id: number;
  customer: string;
  subject: string;
  body: string;
};

function buildMockDraft(ticket: TicketLite, rule: RuleLite | undefined, intent: string): string {
  if (!rule) {
    return `Hi ${ticket.customer}, thanks for writing in about "${ticket.subject}". This one looks unusual — I'm routing it to a human teammate who can give it the attention it deserves.`;
  }
  return [
    `Hi ${ticket.customer}, thanks for reaching out about "${ticket.subject}".`,
    `Following our ${intent} policy: ${rule.policy}`,
    `Tone: ${rule.tone}.`,
    `Example reply (template): ${rule.exampleReply}`,
  ].join("\n\n");
}

export async function runAi(
  ticket: TicketLite,
  rules: RuleLite[],
  byok: Byok | null,
): Promise<AiResult> {
  const provider = byok?.provider ?? "mock";
  const model = byok?.model ?? "mock";

  // mock provider OR no key → deterministic local result
  if (!byok || provider === "mock") {
    const { intent, confidence } = classify(`${ticket.subject} ${ticket.body}`);
    const rule = rules.find((r) => r.intent === intent);
    const draft = buildMockDraft(ticket, rule, intent);
    return {
      intent,
      confidence,
      draft,
      ruleId: rule?.id,
      provider,
      model,
      escalated: confidence < CONFIDENCE_THRESHOLD,
    };
  }

  // Real provider — Vercel AI SDK, browser-direct.
  const { intent, confidence } = classify(`${ticket.subject} ${ticket.body}`);
  const rule = rules.find((r) => r.intent === intent);

  const sys = [
    "You are an ecommerce support agent.",
    "Draft a single short reply to the customer.",
    "Apply the policy and tone exactly. Reference the policy text in the reply when relevant.",
    "Keep it under 120 words. Address the customer by first name. No headers, no bullets, no signature.",
  ].join(" ");

  const userMsg = [
    `Customer name: ${ticket.customer}`,
    `Subject: ${ticket.subject}`,
    `Message: ${ticket.body}`,
    `Detected intent: ${intent}`,
    rule
      ? [
          `Matched policy: ${rule.policy}`,
          `Tone: ${rule.tone}`,
          `Template example: ${rule.exampleReply}`,
        ].join("\n")
      : "No matching policy — flag for human.",
  ].join("\n\n");

  let modelInstance: unknown;
  try {
    if (provider === "anthropic") {
      const { createAnthropic } = await import("@ai-sdk/anthropic");
      const p = createAnthropic({ apiKey: byok.apiKey, headers: { "anthropic-dangerous-direct-browser-access": "true" } });
      modelInstance = p(model);
    } else if (provider === "openai") {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const p = createOpenAI({ apiKey: byok.apiKey });
      modelInstance = p(model);
    } else if (provider === "google") {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      const p = createGoogleGenerativeAI({ apiKey: byok.apiKey });
      modelInstance = p(model);
    } else {
      throw new Error(`unknown provider ${provider}`);
    }

    const { generateText } = await import("ai");
    const { text } = await generateText({
      // @ts-expect-error — provider-specific model returned at runtime
      model: modelInstance,
      system: sys,
      prompt: userMsg,
      maxTokens: 400,
    });

    return {
      intent,
      confidence,
      draft: text.trim(),
      ruleId: rule?.id,
      provider,
      model,
      escalated: confidence < CONFIDENCE_THRESHOLD,
    };
  } catch (err) {
    // Fall back to a mock draft so the UI never deadlocks during the demo
    const draft = buildMockDraft(ticket, rule, intent) + `\n\n[Note: live ${provider} call failed: ${(err as Error).message}]`;
    return {
      intent,
      confidence,
      draft,
      ruleId: rule?.id,
      provider,
      model,
      escalated: true,
    };
  }
}
