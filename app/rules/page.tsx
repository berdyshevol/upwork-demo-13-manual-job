import { getRules } from "@/lib/store";
import { RulesEditor } from "@/components/rules-editor";

export const dynamic = "force-dynamic";

export default function RulesPage() {
  const rules = getRules();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Guidance rules</h1>
        <p className="mt-1 text-sm text-slate-600">
          Edit the policy snippet, tone, or example reply for each intent. Changes are picked up by the AI
          draft on the next Run AI.
        </p>
      </header>
      <RulesEditor rules={rules} />
    </div>
  );
}
