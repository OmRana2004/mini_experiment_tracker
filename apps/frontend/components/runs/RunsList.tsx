
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/axios";
import {
  RefreshCw,
  Clock,
  AlertCircle,
  Loader2,
  FlaskConical,
  ArrowUpRight,
} from "lucide-react";

interface Run {
  id: string;
  name: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface RunsListProps {
  projectId: string;
}

export default function RunsList({ projectId }: RunsListProps) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/projects/${projectId}/runs`);
      setRuns(response.data.data);
    } catch (error) {
      console.error("Fetch runs error:", error);

      setError(
        "Failed to fetch runs. Please check your API key and project access."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const completedRuns = runs.filter(
    (run) => run.status === "COMPLETED"
  ).length;

  const runningRuns = runs.filter(
    (run) => run.status === "RUNNING"
  ).length;

  const failedRuns = runs.filter(
    (run) => run.status === "FAILED"
  ).length;

  const getStatusStyle = (status: Run["status"]) => {
    switch (status) {
      case "RUNNING":
        return "bg-blue-50 text-blue-700";

      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700";

      case "FAILED":
        return "bg-red-50 text-red-700";
    }
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Experiment Runs
          </h2>
          <p className="text-sm text-slate-500">
            View and manage your experiment executions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRuns}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Compact Statistics */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
        <span className="text-slate-500">
          Total <strong className="ml-1 text-slate-900">{runs.length}</strong>
        </span>

        <span className="text-slate-500">
          Running <strong className="ml-1 text-blue-700">{runningRuns}</strong>
        </span>

        <span className="text-slate-500">
          Completed <strong className="ml-1 text-emerald-700">{completedRuns}</strong>
        </span>

        <span className="text-slate-500">
          Failed <strong className="ml-1 text-red-700">{failedRuns}</strong>
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Runs List */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            All Runs
          </h3>

          <span className="text-xs text-slate-400">
            {runs.length} runs
          </span>
        </div>

        {/* Loading */}
        {loading && runs.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading runs...
          </div>
        )}

        {/* Empty State */}
        {!loading && runs.length === 0 && !error && (
          <div className="px-4 py-10 text-center">
            <FlaskConical
              size={24}
              className="mx-auto text-slate-400"
            />

            <p className="mt-2 text-sm font-medium text-slate-800">
              No experiment runs yet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Create your first run to start tracking metrics.
            </p>
          </div>
        )}

        {/* Run Rows */}
        {runs.length > 0 && (
          <div className="divide-y divide-slate-100">
            {runs.map((run, index) => (
              <Link
                key={run.id}
                href={`/projects/${projectId}/runs/${run.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="hidden w-6 shrink-0 text-xs text-slate-400 sm:block">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {run.name}
                    </p>

                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {formatDate(run.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${getStatusStyle(
                      run.status
                    )}`}
                  >
                    {run.status.charAt(0) +
                      run.status.slice(1).toLowerCase()}
                  </span>

                  <ArrowUpRight
                    size={15}
                    className="text-slate-400"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Background Refresh */}
        {loading && runs.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2 text-center text-xs text-slate-400">
            Updating runs...
          </div>
        )}
      </div>
    </section>
  );
}
