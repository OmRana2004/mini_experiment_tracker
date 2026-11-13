
"use client";

import { useState } from "react";
import { api } from "../../lib/axios";
import {
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Props {
  projectId: string;
  runId: string;
}

interface MetricInput {
  eventId: string;
  sequence: number;
  name: string;
  value: number;
  step: number;
  occurredAt: string;
}

type MessageType = "success" | "error" | null;

export default function MetricSimulator({ projectId, runId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [batchNumber, setBatchNumber] = useState(1);
  const [lastEvents, setLastEvents] = useState<MetricInput[]>([]);

  const clientId = "frontend-simulator";

  const projectRequestConfig = {
    headers: {
      "X-Project-Id": projectId,
    },
  };

  const showMessage = (text: string, type: MessageType) => {
    setMessage(text);
    setMessageType(type);
  };

  const sendBatch = async (batchId: string, events: MetricInput[]) => {
    const response = await api.post(
      `/runs/${runId}/metrics`,
      { batchId, clientId, events },
      projectRequestConfig
    );

    return response.data;
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null && "response" in error) {
      const response = error.response as {
        data?: { message?: string };
      };

      return response.data?.message || fallback;
    }

    return fallback;
  };

  // Send new metrics
  const handleSend = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType(null);

      const batchId = crypto.randomUUID();
      const baseSequence = (batchNumber - 1) * 2;

      const events: MetricInput[] = [
        {
          eventId: crypto.randomUUID(),
          sequence: baseSequence + 1,
          name: "accuracy",
          value: Number((0.9 + Math.random() * 0.1).toFixed(4)),
          step: baseSequence + 1,
          occurredAt: new Date().toISOString(),
        },
        {
          eventId: crypto.randomUUID(),
          sequence: baseSequence + 2,
          name: "loss",
          value: Number((Math.random() * 0.2).toFixed(4)),
          step: baseSequence + 2,
          occurredAt: new Date().toISOString(),
        },
      ];

      setLastEvents(events);

      const result = await sendBatch(batchId, events);

      showMessage(
        `Success! ${result.data.acceptedCount} metrics accepted.`,
        "success"
      );

      setBatchNumber((previous) => previous + 1);
    } catch (error: unknown) {
      console.error("Send metrics error:", error);
      showMessage(getErrorMessage(error, "Failed to send metrics."), "error");
    } finally {
      setLoading(false);
    }
  };

  // Send exactly the same batch twice
  const handleDuplicate = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType(null);

      const batchId = crypto.randomUUID();

      const events: MetricInput[] = [
        {
          eventId: crypto.randomUUID(),
          sequence: 1000000,
          name: "duplicate-test",
          value: 0.99,
          step: 1,
          occurredAt: new Date().toISOString(),
        },
      ];

      setLastEvents(events);

      const payload = { batchId, clientId, events };

      const first = await api.post(
        `/runs/${runId}/metrics`,
        payload,
        projectRequestConfig
      );

      const second = await api.post(
        `/runs/${runId}/metrics`,
        payload,
        projectRequestConfig
      );

      showMessage(
        second.data.data.duplicate
          ? "Duplicate batch detected correctly. Idempotency is working!"
          : `First: ${first.data.data.acceptedCount}, Second: ${second.data.data.acceptedCount}`,
        second.data.data.duplicate ? "success" : "error"
      );
    } catch (error: unknown) {
      console.error("Duplicate test error:", error);
      showMessage(getErrorMessage(error, "Duplicate test failed."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Metric Simulator
          </h2>
          <p className="text-xs text-slate-500">
            Generate test events for this run
          </p>
        </div>

        <span className="text-xs text-slate-500">
          Batch #{batchNumber}
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* Actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Send Metrics
              </h3>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Send a new batch with accuracy and loss values.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Accuracy: <span className="font-medium text-slate-700">0.90–1.00</span>
              <span className="mx-2">·</span>
              Loss: <span className="font-medium text-slate-700">0.00–0.20</span>
            </p>

            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Send Metrics
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Copy size={16} className="text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Duplicate Batch Test
              </h3>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Send the exact same payload twice to test idempotency.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Request 1</span>
              <span className="mx-2">→</span>
              <span className="font-medium text-slate-700">Same Request 2</span>
            </p>

            <button
              type="button"
              onClick={handleDuplicate}
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Copy size={15} />
              )}
              Test Duplicate
            </button>
          </div>
        </div>

        {/* Result */}
        {message && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Last Events */}
        {lastEvents.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="border-b border-slate-200 px-3 py-2">
              <h3 className="text-sm font-medium text-slate-800">
                Last Generated Events
              </h3>
            </div>

            {lastEvents.map((event) => (
              <div
                key={event.eventId}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {event.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Sequence: {event.sequence} · Step: {event.step}
                  </p>
                </div>

                <span className="font-mono text-sm text-slate-700">
                  {event.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400">
          Client: {clientId}
        </p>
      </div>
    </section>
  );
}
