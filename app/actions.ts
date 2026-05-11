"use server";

import { revalidatePath } from "next/cache";
import { updateTicket, updateRule, addRun, getRules } from "@/lib/store";

export async function saveAiResult(params: {
  ticketId: number;
  intent: string;
  confidence: number;
  draft: string;
  ruleId?: number;
  provider: string;
  model: string;
  escalated: boolean;
}) {
  updateTicket(params.ticketId, {
    intent: params.intent,
    aiDraft: params.draft,
    confidence: params.confidence,
    escalated: params.escalated,
    status: params.escalated ? "escalated" : "drafted",
  });
  addRun({
    ticketId: params.ticketId,
    ruleId: params.ruleId,
    provider: params.provider,
    model: params.model,
    confidence: params.confidence,
  });
  revalidatePath("/");
  revalidatePath(`/tickets/${params.ticketId}`);
  revalidatePath("/metrics");
}

export async function saveRule(params: {
  id: number;
  policy: string;
  tone: string;
  exampleReply: string;
}) {
  updateRule(params.id, {
    policy: params.policy,
    tone: params.tone,
    exampleReply: params.exampleReply,
  });
  revalidatePath("/rules");
}

export async function toggleEscalate(ticketId: number, escalated: boolean) {
  updateTicket(ticketId, { escalated, status: escalated ? "escalated" : "drafted" });
  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/");
  revalidatePath("/metrics");
}

export async function fetchRules() {
  return getRules();
}
