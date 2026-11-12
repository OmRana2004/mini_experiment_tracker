
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../lib/axios";
import MetricsList from "../../../../../components/runs/MetricsList";

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
  const [error, setError] = useState("");

  const fetchRun = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    if (projectId && runId) {
      fetchRun();
    }
  }, [projectId, runId]);

  if (loading) {
    return <main className="p-6">Loading run...</main>;
  }

  if (error || !run) {
    return (
      <main className="space-y-4 p-6">
        <p className="text-red-600">
          {error || "Run not found"}
        </p>

        <Link
          href={`/projects/${projectId}`}
          className="underline"
        >
          Back to Project
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href={`/projects/${projectId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to Project
      </Link>

      {/* Run Details */}
      <section className="space-y-4 rounded-md border p-5">
        <h1 className="text-2xl font-semibold">{run.name}</h1>

        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium">{run.status}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Run ID</p>
          <p className="break-all text-sm">{run.id}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Created At</p>
          <p>{new Date(run.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Last Updated</p>
          <p>{new Date(run.updatedAt).toLocaleString()}</p>
        </div>

        <button
          onClick={fetchRun}
          className="rounded-md border px-4 py-2"
        >
          Refresh
        </button>
      </section>

      {/* Metrics */}
      <MetricsList runId={runId} />
    </main>
  );
}
