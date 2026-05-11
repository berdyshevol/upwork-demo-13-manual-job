"use client";

import { useState, useTransition } from "react";
import type { Ticket, Rule } from "@/lib/types";
import { getByok, runAi } from "@/lib/llm";
import { saveAiResult, toggleEscalate } from "@/app/actions";

type Props = { ticket: Ticket; rules: Rule[] };

export function TicketDetail({ ticket: initial, rules }: Props) {
  const [t, setT] = useState<Ticket>(initial);
  const [running, setRunning] = useState(false);
  const [, startTransition] = useTransition();
  const rule = rules.find((r) => r.intent === t.intent);

  async function run() {
    setRunning(true);
    const byok = getByok();
    const result = await runAi(
      { id: t.id, customer: t.customer, subject: t.subject, body: t.body },
      rules,
      byok,
    );
    setT((cur) => ({
      ...cur,
      intent: result.intent,
      aiDraft: result.draft,
      confidence: result.confidence,
      escalated: result.escalated,
      status: result.escalated ? "escalated" : "drafted",
    }));
    setRunning(false);
    startTransition(() => {
      void saveAiResult({
        ticketId: t.id,
        intent: result.intent,
        confidence: result.confidence,
        draft: result.draft,
        ruleId: result.ruleId,
        provider: result.provider,
        model: result.model,
        escalated: result.escalated,
      });
    });
  }

  function toggle() {
    const next = !t.escalated;
    setT((cur) => ({ ...cur, escalated: next, status: next ? "escalated" : "drafted" }));
    startTransition(() => {
      void toggleEscalate(t.id, next);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="lg:col-span-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase text-slate-500">Original ticket</h2>
        <div className="mt-2 space-y-1">
          <div className="text-sm text-slate-500">From {t.customer}</div>
          <h3 className="text-lg font-semibold text-slate-900">{t.subject}</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{t.body}</p>
        </div>
      </section>

      <section className="lg:col-span-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase text-slate-500">Matched rule</h2>
        {rule ? (
          <div className="mt-2 space-y-2 text-sm">
            <div><span className="badge">{rule.intent}</span></div>
            <div><span className="text-slate-500">Policy:</span> {rule.policy}</div>
            <div><span className="text-slate-500">Tone:</span> {rule.tone}</div>
            <div><span className="text-slate-500">Example:</span> {rule.exampleReply}</div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No rule matched yet — run AI to classify.</p>
        )}
      </section>

      <section className="lg:col-span-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase text-slate-500">AI draft</h2>
        <div className="mt-2 flex items-center gap-2">
          <button data-testid="run-ai-detail-button" className="btn-primary" onClick={run} disabled={running}>
            {running ? "Running…" : "Run AI"}
          </button>
          {t.confidence !== undefined && (
            <span data-testid="confidence-readout" className="text-xs text-slate-500">
              Confidence: {(t.confidence * 100).toFixed(0)}%
            </span>
          )}
          {t.escalated && (
            <span data-testid="needs-human-flag" className="badge-danger">needs human</span>
          )}
        </div>
        <pre data-testid="draft-pre" className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-3 text-sm text-slate-800">
{t.aiDraft ?? "— no draft yet —"}
        </pre>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={t.escalated} onChange={toggle} />
          Manually flag this ticket as “needs human”
        </label>
      </section>
    </div>
  );
}
