
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../lib/axios";

import MetricsList from "../../../../../components/runs/MetricsList";
import MetricSimulator from "../../../../../components/runs/MetricSimulator";

import {
  ArrowLeft,
  Activity,
  RefreshCw,
  Clock,
  CalendarDays,
  FlaskConical,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface Run {
  id: string;
  name: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export default function RunDetailsPage() {
  const params = useParams();

  const projectId = params.projectId as string;
  const runId = params.runId as string;

  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchRun = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get(
        `/projects/${projectId}/runs/${runId}`
      );

      setRun(response.data.data);
    } catch (error) {
      console.error("Fetch run error:", error);
      setError("Failed to fetch run details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, runId]);

  useEffect(() => {
    if (projectId && runId) {
      fetchRun(true);
    }
  }, [projectId, runId, fetchRun]);

  const copyRunId = async () => {
    try {
      await navigator.clipboard.writeText(runId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusStyle = {
    RUNNING: "bg-emerald-50 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
  };

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-sm text-slate-500">
          <RefreshCw size={16} className="animate-spin text-violet-600" />
          Loading run...
        </div>
      </main>
    );
  }

  // Error
  if (error || !run) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            {error || "Run not found"}
          </p>

          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <ArrowLeft size={15} />
            Back to Project
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">

        {/* Navigation */}
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-violet-600"
        >
          <ArrowLeft size={16} />
          Back to Project
        </Link>

        {/* Run Header */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FlaskConical size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-600">
                  Experiment Run
                </p>

                <h1 className="mt-1 wrap-break-word text-xl font-bold tracking-tight sm:text-2xl">
                  {run.name}
                </h1>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                statusStyle[run.status]
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {run.status}
            </span>
          </div>

          {/* Metadata */}
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={14} />
              <span>Created: {formatDate(run.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} />
              <span>Updated: {formatDate(run.updatedAt)}</span>
            </div>

            <button
              type="button"
              onClick={copyRunId}
              className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-violet-600"
              title={run.id}
            >
              {copied ? (
                <Check size={13} className="text-emerald-600" />
              ) : (
                <Copy size={13} />
              )}
              <span className="max-w-40 truncate">
                {copied ? "Copied!" : `ID: ${run.id}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchRun(false)}
              disabled={refreshing}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Run Metrics */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Activity size={16} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Metric Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Generate test metrics for this run.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <MetricSimulator
              projectId={projectId}
              runId={runId}
            />
          </div>
        </section>

        {/* Metrics History */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
          <MetricsList
            projectId={projectId}
            runId={runId}
          />
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Experiment Tracker · Run Details
          </p>
        </footer>

      </div>
    </main>
  );
}
