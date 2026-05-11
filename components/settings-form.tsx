"use client";

import { useEffect, useState } from "react";
import type { Provider } from "@/lib/types";
import { MODELS_BY_PROVIDER, PROVIDER_LABEL, getByok, setByok, clearByok } from "@/lib/llm";

type RealProvider = Exclude<Provider, "mock">;

export function SettingsForm() {
  const [provider, setProvider] = useState<RealProvider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>(MODELS_BY_PROVIDER["anthropic"][0]);
  const [status, setStatus] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const b = getByok();
    if (b && b.provider !== "mock") {
      setProvider(b.provider as RealProvider);
      setApiKey(b.apiKey);
      setModel(b.model);
    }
    setLoaded(true);
  }, []);

  function onProviderChange(next: RealProvider) {
    setProvider(next);
    const models = MODELS_BY_PROVIDER[next];
    if (!models.includes(model)) setModel(models[0]);
  }

  function save() {
    setByok({ provider, apiKey, model });
    setStatus("Saved. Your key stays in localStorage on this device only.");
  }

  function clear() {
    clearByok();
    setApiKey("");
    setStatus("Cleared. AI features are now in mock mode.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[28rem_1fr]">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Provider</span>
          <select
            data-testid="provider-select"
            className="select mt-1"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as RealProvider)}
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google</option>
          </select>
        </label>
        <label className="block">
          <span data-testid="apikey-label" className="text-xs font-medium text-slate-600">
            {PROVIDER_LABEL[provider]} API key
          </span>
          <input
            data-testid="apikey-input"
            className="input mt-1 font-mono"
            type="password"
            value={apiKey}
            placeholder={`Paste your ${PROVIDER_LABEL[provider]} API key`}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Model</span>
          <select
            data-testid="model-select"
            className="select mt-1"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS_BY_PROVIDER[provider].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button data-testid="save-button" className="btn-primary" onClick={save}>Save</button>
          <button data-testid="clear-button" className="btn" onClick={clear}>Clear</button>
          <span data-testid="save-status" className="text-xs text-emerald-700">{status}</span>
        </div>
        {!loaded && <p className="text-xs text-slate-400">Loading saved settings…</p>}
      </div>
      <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Your key is saved as one JSON blob: <code>localStorage.byok</code>.</li>
          <li>AI calls go directly from your browser to the provider — your key never hits this server.</li>
          <li>Without a key the demo runs in mock mode: deterministic drafts, no network calls.</li>
          <li>Click <span className="font-medium">Clear</span> to remove the key from this device.</li>
        </ul>
      </aside>
    </div>
  );
}
