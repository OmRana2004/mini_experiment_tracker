
"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface ApiKeySetupProps {
  apiKey: string;
  saved: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

export default function ApiKeySetup({
  apiKey,
  saved,
  onChange,
  onSave,
  onRemove,
}: ApiKeySetupProps) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound size={17} className="text-violet-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              API Key
            </h3>
            <p className="text-xs text-slate-500">
              Authenticate your workspace
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            saved
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {saved ? "Saved" : "Not configured"}
        </span>
      </div>

      {/* API Key Input */}
      <div>
        <label
          htmlFor="api-key"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Your API Key
        </label>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10">
          <input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => {
              onChange(e.target.value);
              setCopied(false);
            }}
            placeholder="Enter your project API key"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          <div className="flex items-center gap-1 px-2">
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              disabled={!apiKey}
              aria-label={showKey ? "Hide API key" : "Show API key"}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!apiKey}
              aria-label="Copy API key"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            >
              {copied ? (
                <Check size={16} className="text-emerald-600" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-xs text-slate-400">
          Stored locally in this browser.
          {copied && (
            <span className="ml-2 text-emerald-600">Copied!</span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!apiKey.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldCheck size={15} />
          Save API Key
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={!apiKey && !saved}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={15} />
          Remove
        </button>
      </div>

      {/* Saved Message */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
          <Check size={15} className="shrink-0" />
          API key saved successfully in this browser.
        </div>
      )}
    </section>
  );
}
