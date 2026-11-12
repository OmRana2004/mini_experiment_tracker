
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/axios";

interface Metric {
  id: string;
  eventId: string;
  name: string;
  value: number;
  step: number | null;
  clientSequence: string;
  runSequence: string;
  occurredAt: string;
}

interface MetricsListProps {
  runId: string;
}

export default function MetricsList({ runId }: MetricsListProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/runs/${runId}/metrics`);
      const data: Metric[] = response.data.data;

      console.log("API total events:", data.length);

      setMetrics(data);
    } catch (error) {
      console.error("Fetch metrics error:", error);
      setError("Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Metrics ({metrics.length})
        </h2>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Loading metrics...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && metrics.length === 0 && (
        <p className="text-sm text-gray-500">
          No metrics found.
        </p>
      )}

      {!error && metrics.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3">Sequence</th>
                <th className="p-3">Event ID</th>
                <th className="p-3">Metric</th>
                <th className="p-3">Value</th>
                <th className="p-3">Step</th>
                <th className="p-3">Occurred At</th>
              </tr>
            </thead>

            <tbody>
              {metrics.map((metric) => (
                <tr
                  key={metric.id}
                  className="border-b last:border-0"
                >
                  <td className="p-3">{metric.runSequence}</td>

                  <td className="p-3 text-gray-500">
                    {metric.eventId}
                  </td>

                  <td className="p-3 font-medium">
                    {metric.name}
                  </td>

                  <td className="p-3">{metric.value}</td>

                  <td className="p-3">
                    {metric.step ?? "-"}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {new Date(metric.occurredAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
