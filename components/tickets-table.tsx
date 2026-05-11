"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Ticket, Rule } from "@/lib/types";
import { getByok, runAi } from "@/lib/llm";
import { saveAiResult } from "@/app/actions";

type Props = { tickets: Ticket[]; rules: Rule[] };

type Row = Ticket & { _running?: boolean };

export function TicketsTable({ tickets, rules }: Props) {
  const [rows, setRows] = useState<Row[]>(tickets);
  const [hasKey, setHasKey] = useState<boolean>(true); // SSR-default: don't flicker hint
  const [, startTransition] = useTransition();

  useEffect(() => {
    const b = getByok();
    setHasKey(b !== null);
  }, []);

  async function runOne(id: number) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, _running: true } : r)));
    const ticket = rows.find((r) => r.id === id);
    if (!ticket) return;
    const byok = getByok();
    const result = await runAi(
      { id: ticket.id, customer: ticket.customer, subject: ticket.subject, body: ticket.body },
      rules,
      byok,
    );
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              _running: false,
              intent: result.intent,
              aiDraft: result.draft,
              confidence: result.confidence,
              escalated: result.escalated,
              status: result.escalated ? "escalated" : "drafted",
            }
          : r,
      ),
    );
    startTransition(() => {
      void saveAiResult({
        ticketId: id,
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

  async function runAll() {
    for (const r of rows) {
      // eslint-disable-next-line no-await-in-loop
      await runOne(r.id);
    }
  }

  return (
    <div className="space-y-4">
      {!hasKey && (
        <div
          data-testid="byok-hint"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
        >
          Choose a provider and paste your API key in <Link href="/settings" className="underline font-medium">Settings</Link> to enable live AI. Without a key, Run AI returns a deterministic mock draft.
        </div>
      )}
      <div className="flex items-center gap-2">
        <button data-testid="run-all-button" className="btn-primary" onClick={runAll}>
          Run AI on all tickets
        </button>
        <span className="text-xs text-slate-500">{rows.length} tickets in the queue</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table data-testid="tickets-list" className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Intent</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">AI draft</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} data-testid="ticket-row" className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 text-slate-500">
                  <Link href={`/tickets/${t.id}`} className="hover:underline">{t.id}</Link>
                </td>
                <td className="px-3 py-2">{t.customer}</td>
                <td className="px-3 py-2 max-w-[16rem] truncate">
                  <Link href={`/tickets/${t.id}`} className="hover:underline">{t.subject}</Link>
                </td>
                <td className="px-3 py-2">
                  <span data-testid="ticket-intent" className="badge">{t.intent ?? ""}</span>
                </td>
                <td className="px-3 py-2">
                  <span data-testid="ticket-confidence" className="font-mono text-xs">
                    {t.confidence !== undefined ? (t.confidence * 100).toFixed(0) + "%" : ""}
                  </span>
                </td>
                <td className="px-3 py-2 max-w-[24rem]">
                  <div data-testid="ticket-draft" className="line-clamp-3 whitespace-pre-line text-slate-700">
                    {t.aiDraft ?? ""}
                  </div>
                  {t.escalated && (
                    <span className="badge-danger mt-1 inline-block">needs human</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    data-testid="run-ai-button"
                    className="btn"
                    onClick={() => runOne(t.id)}
                    disabled={t._running}
                  >
                    {t._running ? "Running…" : "Run AI"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
