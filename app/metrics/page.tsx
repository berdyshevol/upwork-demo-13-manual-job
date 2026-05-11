import { getMetrics } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function MetricsPage() {
  const m = getMetrics();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Metrics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Snapshot of the current batch. Auto-handled = drafted and not escalated.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Auto-handled</div>
          <div data-testid="metric-auto" className="mt-1 text-3xl font-semibold text-slate-900">
            {m.auto}
          </div>
          <div className="text-xs text-slate-500">of {m.total} total</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Escalated</div>
          <div data-testid="metric-escalated" className="mt-1 text-3xl font-semibold text-slate-900">
            {m.escalated}
          </div>
          <div className="text-xs text-slate-500">flagged “needs human”</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Avg confidence</div>
          <div data-testid="metric-confidence" className="mt-1 text-3xl font-semibold text-slate-900">
            {(m.avgConfidence * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">across drafted tickets</div>
        </div>
      </div>
    </div>
  );
}
