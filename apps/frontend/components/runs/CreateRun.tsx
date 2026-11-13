
"use client";

import { useState } from "react";
import { api } from "../../lib/axios";
import { Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CreateRunProps {
  projectId: string;
  onSuccess: () => void;
}

export default function CreateRun({
  projectId,
  onSuccess,
}: CreateRunProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName || loading) return;

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      await api.post(`/projects/${projectId}/runs`, {
        name: trimmedName,
      });

      setName("");
      setSuccess(true);
      onSuccess();
    } catch (error) {
      console.error("Create run error:", error);

      setError(
        "Failed to create run. Please check your API key and project access."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">
          Create Run
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a new experiment run for this project.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="run-name"
              className="text-sm font-medium text-slate-700"
            >
              Run Name <span className="text-red-500">*</span>
            </label>

            <span className="text-xs text-slate-400">
              {name.length}/100
            </span>
          </div>

          <input
            id="run-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
              setSuccess(false);
            }}
            placeholder="e.g. Baseline Model"
            maxLength={100}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus size={16} />
              Create Run
            </>
          )}
        </button>
      </form>

      {/* Messages */}
      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 text-sm text-red-600"
        >
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-emerald-600"
        >
          <CheckCircle2 size={15} />
          Run created successfully.
        </div>
      )}
    </section>
  );
}
