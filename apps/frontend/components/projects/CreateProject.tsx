
"use client";

import { useState } from "react";
import { api } from "../../lib/axios";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CreateProjectProps {
  onSuccess: () => void;
}

export default function CreateProject({ onSuccess }: CreateProjectProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

      await api.post("/projects", {
        name: trimmedName,
        description: description.trim(),
      });

      setName("");
      setDescription("");
      setSuccess(true);

      onSuccess();
    } catch (error) {
      console.error("Create project error:", error);
      setError("Unable to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Create project
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a project to organize your experiments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Project name */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-slate-700"
            >
              Project name <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {name.length}/80
            </span>
          </div>

          <input
            id="project-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
              setSuccess(false);
            }}
            placeholder="e.g. AI Image Classifier"
            maxLength={80}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
          />
        </div>

        {/* Description */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="project-description"
              className="text-sm font-medium text-slate-700"
            >
              Description <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <span className="text-xs text-slate-400">
              {description.length}/300
            </span>
          </div>

          <textarea
            id="project-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError("");
              setSuccess(false);
            }}
            placeholder="What are you experimenting with?"
            rows={3}
            maxLength={300}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
          />
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 text-sm text-emerald-600"
          >
            <CheckCircle2 size={15} />
            Project created successfully!
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end border-t border-slate-100 pt-3">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Creating..." : "Create project"}
          </button>
        </div>
      </form>
    </section>
  );
}
