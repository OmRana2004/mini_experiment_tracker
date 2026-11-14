
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
        const timer = setTimeout(() => {
          signal.removeEventListener("abort", handleAbort);
          resolve();
        }, ms);

        const handleAbort = () => {
          clearTimeout(timer);
          resolve();
        };

        signal.addEventListener("abort", handleAbort, {
          once: true,
        });
      });

    const start = async () => {
      try {
        setLoading(true);
        setError("");
        setConnectionStatus("connecting");
        setMetrics([]);
        lastSequenceRef.current = "0";

        if (!API_URL) {
          throw new Error("API URL is not configured.");
        }

        const apiKey = localStorage.getItem(`apiKey:${projectId}`);

        if (!apiKey) {
          throw new Error("Please save an API key for this project.");
        }

        // Fetch historical metrics
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

        const sortedMetrics = [...data].sort((a, b) => {
          const seqA = BigInt(a.runSequence);
          const seqB = BigInt(b.runSequence);

          return seqA < seqB ? -1 : seqA > seqB ? 1 : 0;
        });

        setMetrics(sortedMetrics);

        // Find latest sequence
        const lastMetric = sortedMetrics.reduce<Metric | null>(
          (latest, metric) =>
            !latest ||
            BigInt(metric.runSequence) > BigInt(latest.runSequence)
              ? metric
              : latest,
          null
        );

        lastSequenceRef.current = lastMetric?.runSequence || "0";
        setLoading(false);

        // Connect to SSE
        let retryDelay = 1000;

        while (!signal.aborted) {
          try {
            setConnectionStatus(
              lastSequenceRef.current === "0"
                ? "connecting"
                : "reconnecting"
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
                const eventData: string[] = [];

                for (const line of block.split(/\r?\n/)) {
                  if (line.startsWith("id:")) {
                    eventId = line.slice(3).trim();
                  } else if (line.startsWith("event:")) {
                    eventType = line.slice(6).trim();
                  } else if (line.startsWith("data:")) {
                    eventData.push(line.slice(5).trim());
                  }
                }

                if (eventType !== "metric" || eventData.length === 0) {
                  continue;
                }

                let payload;

                try {
                  payload = JSON.parse(eventData.join("\n"));
                } catch {
                  console.error("Invalid SSE metric payload:", eventData);
                  continue;
                }

                const rawMetric = (payload.metric || payload) as Metric;

                const metric: Metric = {
                  ...rawMetric,
                  id: rawMetric.id || rawMetric.eventId,
                };

                // SSE ID is the authoritative run sequence
                const sequence = eventId || metric.runSequence;

                if (!sequence || !/^\d+$/.test(sequence)) {
                  continue;
                }

                metric.runSequence = sequence;

                // Ignore older or duplicate sequences
                if (BigInt(sequence) <= BigInt(lastSequenceRef.current)) {
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

                  return [...previous, metric].sort((a, b) => {
                    const seqA = BigInt(a.runSequence);
                    const seqB = BigInt(b.runSequence);

                    return seqA < seqB ? -1 : seqA > seqB ? 1 : 0;
                  });
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

  // Overview calculations
  const metricTypes = [...new Set(metrics.map((metric) => metric.name))];

  const latestSequence = metrics.reduce(
    (latest, metric) =>
      BigInt(metric.runSequence) > BigInt(latest)
        ? metric.runSequence
        : latest,
    "0"
  );

  // Latest event for each metric type
  const latestMetrics = metricTypes
    .map((name) =>
      metrics
        .filter((metric) => metric.name === name)
        .reduce<Metric | null>(
          (latest, metric) =>
            !latest ||
            BigInt(metric.runSequence) > BigInt(latest.runSequence)
              ? metric
              : latest,
          null
        )
    )
    .filter((metric): metric is Metric => metric !== null);

  const formatDate = (date: string) => {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Invalid date";

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMetricStyle = (name: string) => {
    const normalized = name.toLowerCase();

    if (normalized.includes("accuracy")) {
      return "text-emerald-700";
    }

    if (normalized.includes("loss")) {
      return "text-rose-700";
    }

    return "text-slate-700";
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Live Metrics
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time experiment events
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium">
          {connectionStatus === "live" ? (
            <Wifi size={14} className="text-emerald-600" />
          ) : connectionStatus === "reconnecting" ? (
            <WifiOff size={14} className="text-amber-600" />
          ) : (
            <Loader2
              size={14}
              className="animate-spin text-slate-500"
            />
          )}

          <span
            className={
              connectionStatus === "live"
                ? "text-emerald-700"
                : connectionStatus === "reconnecting"
                  ? "text-amber-700"
                  : "text-slate-500"
            }
          >
            {connectionStatus === "live"
              ? "Live"
              : connectionStatus === "reconnecting"
                ? "Reconnecting"
                : "Connecting"}
          </span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          Fetching historical metrics...
        </div>
      )}

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

      {/* Overview */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white py-3">
        <div className="min-w-0 px-3">
          <p className="text-xs text-slate-500">Events</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {metrics.length}
          </p>
        </div>

        <div className="min-w-0 px-3">
          <p className="text-xs text-slate-500">Metric Types</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {metricTypes.length}
          </p>
        </div>

        <div className="min-w-0 px-3">
          <p className="truncate text-xs text-slate-500">
            Latest Sequence
          </p>
          <p className="mt-1 truncate font-mono text-lg font-semibold text-slate-900">
            {latestSequence}
          </p>
        </div>
      </div>

      {/* Latest Values */}
      {latestMetrics.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Latest Values
          </h3>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {latestMetrics.map((metric) => (
              <div
                key={metric.name}
                className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {metric.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Step {metric.step ?? "-"} · #{metric.runSequence}
                  </p>
                </div>

                <span
                  className={`shrink-0 font-mono text-sm font-semibold ${getMetricStyle(
                    metric.name
                  )}`}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event History */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Event History
          </h3>

          <span className="text-xs text-slate-500">
            {metrics.length} events
          </span>
        </div>

        {metrics.length === 0 && !loading && !error ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
            <Activity
              size={20}
              className="mx-auto text-slate-400"
            />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No metrics yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Send metrics using the simulator.
            </p>
          </div>
        ) : metrics.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* Table Header - Desktop */}
            <div className="hidden grid-cols-[1fr_1fr_0.8fr_0.6fr_1.3fr] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 sm:grid">
              <span>Sequence</span>
              <span>Metric</span>
              <span>Value</span>
              <span>Step</span>
              <span>Occurred At</span>
            </div>

            {/* Single responsive event list */}
            <div className="divide-y divide-slate-100">
              {metrics.map((metric) => (
                <div
                  key={metric.id || metric.eventId}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-3 py-3 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_1fr_0.8fr_0.6fr_1.3fr] sm:items-center sm:gap-3 sm:py-2.5"
                >
                  {/* Sequence */}
                  <span className="font-mono text-xs text-slate-500 sm:text-sm">
                    #{metric.runSequence}
                  </span>

                  {/* Metric */}
                  <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                    {metric.name}
                  </span>

                  {/* Value */}
                  <span
                    className={`row-start-1 col-start-2 text-right font-mono text-sm font-semibold sm:row-auto sm:col-auto sm:text-left ${getMetricStyle(
                      metric.name
                    )}`}
                  >
                    {metric.value}
                  </span>

                  {/* Step */}
                  <span className="text-xs text-slate-500 sm:text-sm">
                    <span className="sm:hidden">Step </span>
                    {metric.step ?? "-"}
                  </span>

                  {/* Date */}
                  <span className="col-span-2 text-xs text-slate-400 sm:col-span-1 sm:whitespace-nowrap sm:text-slate-500">
                    {formatDate(metric.occurredAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* SSE Status */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Activity size={13} />
        Automatically updating through SSE
      </div>
    </section>
  );
}
