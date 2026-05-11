// Lightweight keyword-based intent classifier used by the mock provider and
// as a default when no LLM is configured. Returns intent + confidence in 0..1.

const RULES: Array<{ intent: string; keywords: RegExp; confidence: number }> = [
  { intent: "refund", keywords: /\b(refund|money\s*back|return|chargeback)\b/i, confidence: 0.93 },
  { intent: "cancellation", keywords: /\b(cancel|cancellation|cancelled|canceling)\b/i, confidence: 0.91 },
  { intent: "order_status", keywords: /\b(order\s*status|where\s*is|track|tracking|shipped|delivery|delivered|carrier|label\s*created)\b/i, confidence: 0.9 },
  { intent: "shipping", keywords: /\b(shipping|freight|free\s*ship|delivery\s*cost|address\s*change)\b/i, confidence: 0.86 },
];

export function classify(text: string): { intent: string; confidence: number } {
  for (const r of RULES) {
    if (r.keywords.test(text)) return { intent: r.intent, confidence: r.confidence };
  }
  return { intent: "unknown", confidence: 0.31 };
}

export const CONFIDENCE_THRESHOLD = 0.6;
