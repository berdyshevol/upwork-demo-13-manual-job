import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings — Bring Your Own Key</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your key never leaves your browser. We store it only in <code>localStorage.byok</code> and the
          AI call goes browser-direct to the provider you choose.
        </p>
      </header>
      <SettingsForm />
    </div>
  );
}
