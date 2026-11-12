
"use client";

import { useEffect, useRef, useState } from "react";

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
  projectId: string;
  runId: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ConnectionStatus = "connecting" | "live" | "reconnecting";

export default function MetricsList({
  projectId,
  runId,
}: MetricsListProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");

  const lastSequenceRef = useRef("0");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);

        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });

    const start = async () => {
      try {
        setLoading(true);
        setError("");

        const apiKey = localStorage.getItem(`apiKey:${projectId}`);

        if (!apiKey) {
          throw new Error("Please save an API key for this project.");
        }

        // 1. Fetch existing metrics
        const response = await fetch(
          `${API_URL}/runs/${runId}/metrics`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch metrics. Check your API key.");
        }

        const data: Metric[] = (await response.json()).data;

        setMetrics(data);

        const lastMetric = data.reduce<Metric | null>(
          (latest, metric) =>
            !latest ||
            BigInt(metric.runSequence) > BigInt(latest.runSequence)
              ? metric
              : latest,
          null
        );

        lastSequenceRef.current = lastMetric?.runSequence || "0";

        setLoading(false);

        // 2. Connect to SSE and recover missed events
        let retryDelay = 1000;

        while (!signal.aborted) {
          try {
            setConnectionStatus(
              lastSequenceRef.current === "0" ? "connecting" : "reconnecting"
            );

            const streamResponse = await fetch(
              `${API_URL}/projects/${projectId}/runs/${runId}/events`,
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Last-Event-ID": lastSequenceRef.current,
                },
                signal,
              }
            );

            if (!streamResponse.ok || !streamResponse.body) {
              throw new Error(
                `SSE connection failed: ${streamResponse.status}`
              );
            }

            setConnectionStatus("live");
            retryDelay = 1000;

            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";

            while (!signal.aborted) {
              const { done, value } = await reader.read();

              if (done) break;

              buffer += decoder.decode(value, { stream: true });

              const blocks = buffer.split(/\r?\n\r?\n/);
              buffer = blocks.pop() || "";

              for (const block of blocks) {
                if (!block.trim()) continue;

                let eventId = "";
                let eventType = "";
                let eventData = "";

                for (const line of block.split(/\r?\n/)) {
                  if (line.startsWith("id:")) {
                    eventId = line.slice(3).trim();
                  } else if (line.startsWith("event:")) {
                    eventType = line.slice(6).trim();
                  } else if (line.startsWith("data:")) {
                    eventData += line.slice(5).trim();
                  }
                }

                if (eventType !== "metric" || !eventData) continue;

                const payload = JSON.parse(eventData);

                const rawMetric = (payload.metric || payload) as Metric;

const metric: Metric = {
  ...rawMetric,
  id: rawMetric.id || rawMetric.eventId,
};

                // Use SSE ID as the authoritative sequence if needed.
                const sequence = eventId || metric.runSequence;

                if (!sequence || !/^\d+$/.test(sequence)) continue;

                metric.runSequence = sequence;

                // Ignore duplicate or older events.
                if (
                  BigInt(sequence) <= BigInt(lastSequenceRef.current)
                ) {
                  continue;
                }

                lastSequenceRef.current = sequence;

                setMetrics((previous) => {
                  if (
  previous.some(
    (item) =>
      item.id === metric.id ||
      item.eventId === metric.eventId
  )
) {
  return previous;
}

                  return [...previous, metric].sort((a, b) =>
                    BigInt(a.runSequence) < BigInt(b.runSequence)
                      ? -1
                      : BigInt(a.runSequence) > BigInt(b.runSequence)
                        ? 1
                        : 0
                  );
                });
              }
            }

            if (!signal.aborted) {
              await reader.cancel().catch(() => {});
              throw new Error("SSE connection closed");
            }
          } catch (err) {
            if (signal.aborted) break;

            console.error("SSE connection error:", err);
            setConnectionStatus("reconnecting");

            await sleep(retryDelay);

            retryDelay = Math.min(retryDelay * 2, 10000);
          }
        }
      } catch (err) {
        if (!signal.aborted) {
          console.error("Metrics error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load metrics"
          );
          setLoading(false);
        }
      }
    };

    start();

    return () => {
      controller.abort();
    };
  }, [projectId, runId]);

  
return (
  <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">
        Metrics ({metrics.length})
      </h2>

      <span className="text-xs font-medium text-gray-500">
        {connectionStatus === "live"
          ? "Live connected"
          : connectionStatus === "reconnecting"
            ? "Reconnecting..."
            : "Connecting..."}
      </span>
    </div>

    {loading && (
      <p className="text-sm text-gray-500">Loading metrics...</p>
    )}

    {error && (
      <p className="text-sm text-red-600">{error}</p>
    )}

    {!loading && !error && metrics.length === 0 && (
      <p className="text-sm text-gray-500">
        No metrics found. Waiting for new events...
      </p>
    )}

    {metrics.length > 0 && (
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
                key={metric.id || metric.eventId}
                className="border-b last:border-0"
              >
                <td className="p-3">{metric.runSequence}</td>
                <td className="p-3 text-gray-500">
                  {metric.eventId}
                </td>
                <td className="p-3 font-medium">{metric.name}</td>
                <td className="p-3">{metric.value}</td>
                <td className="p-3">{metric.step ?? "-"}</td>
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
