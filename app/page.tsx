import { getTickets, getRules } from "@/lib/store";
import { TicketsTable } from "@/components/tickets-table";

export const dynamic = "force-dynamic";

export default function TicketsPage() {
  const tickets = getTickets();
  const rules = getRules();
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Support tickets</h1>
          <p className="mt-1 text-sm text-slate-600">
            Run the AI agent on a single ticket or on the whole batch. Drafts are produced via the provider
            you configured in <a className="text-slate-900 underline" href="/settings">Settings</a> — or fall
            back to deterministic mock output when no key is set.
          </p>
        </div>
      </header>
      <TicketsTable tickets={tickets} rules={rules} />
    </div>
  );
}
