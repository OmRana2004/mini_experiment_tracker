
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/axios";

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

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/projects/${projectId}/runs`);
      setRuns(response.data.data);
    }  catch (error) {
  console.error("Fetch runs error:", error);

  setError(
    "Failed to fetch runs. Please check your API key and make sure it belongs to this project."
  );
} finally {
  setLoading(false);
}
  };

  useEffect(() => {
    fetchRuns();
  }, [projectId]);

  if (loading) return <p>Loading runs...</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Runs</h2>

        <button
          onClick={fetchRuns}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && runs.length === 0 && (
        <p className="text-sm text-gray-500">No runs found.</p>
      )}

      {runs.map((run) => (
        <div key={run.id} className="rounded-md border p-4">
          <Link
            href={`/projects/${projectId}/runs/${run.id}`}
            className="font-medium hover:underline"
          >
            {run.name}
          </Link>

          <p className="mt-1 text-sm text-gray-500">
            Status: {run.status}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Created: {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </section>
  );
}
