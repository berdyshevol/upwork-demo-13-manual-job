"use client";

import { useState, useTransition } from "react";
import type { Rule } from "@/lib/types";
import { saveRule } from "@/app/actions";

type Props = { rules: Rule[] };

export function RulesEditor({ rules: initial }: Props) {
  const [rules, setRules] = useState<Rule[]>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [policy, setPolicy] = useState("");
  const [tone, setTone] = useState("");
  const [exampleReply, setExampleReply] = useState("");
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [, startTransition] = useTransition();

  function startEdit(r: Rule) {
    setEditingId(r.id);
    setPolicy(r.policy);
    setTone(r.tone);
    setExampleReply(r.exampleReply);
    setSaveStatus("");
  }

  function save() {
    if (editingId == null) return;
    const id = editingId;
    setRules((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, policy, tone, exampleReply, updatedAt: Date.now() } : r,
      ),
    );
    setSaveStatus("Saved.");
    startTransition(() => {
      void saveRule({ id, policy, tone, exampleReply });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table data-testid="rules-list" className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">Intent</th>
              <th className="px-3 py-2">Policy</th>
              <th className="px-3 py-2">Tone</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} data-testid="rule-row" className="border-t border-slate-100 align-top">
                <td className="px-3 py-2"><span className="badge">{r.intent}</span></td>
                <td className="px-3 py-2 max-w-[24rem]">
                  <div className="line-clamp-3 text-slate-700">{r.policy}</div>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.tone}</td>
                <td className="px-3 py-2">
                  <button
                    data-testid="edit-rule-button"
                    className="btn"
                    onClick={() => startEdit(r)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          {editingId == null ? "Pick a rule to edit" : `Editing rule #${editingId}`}
        </h2>
        {editingId != null && (
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Policy</span>
              <textarea
                data-testid="policy-input"
                className="input mt-1 h-24"
                value={policy}
                onChange={(e) => setPolicy(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Tone</span>
              <input
                data-testid="tone-input"
                className="input mt-1"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Example reply</span>
              <textarea
                data-testid="example-input"
                className="input mt-1 h-24"
                value={exampleReply}
                onChange={(e) => setExampleReply(e.target.value)}
              />
            </label>
            <div className="flex items-center gap-2">
              <button data-testid="save-rule-button" className="btn-primary" onClick={save}>
                Save
              </button>
              <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
              <span data-testid="rule-save-status" className="text-xs text-emerald-700">{saveStatus}</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
