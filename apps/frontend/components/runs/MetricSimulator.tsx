
"use client";

import { useState } from "react";
import { api } from "../../lib/axios";

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

export default function MetricSimulator({ projectId, runId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [batchNumber, setBatchNumber] = useState(1);

  // Keep one client ID and sequence for this simulator.
  const clientId = "frontend-simulator";

  const sendBatch = async (
    batchId: string,
    events: MetricInput[]
  ) => {
    const response = await api.post(`/runs/${runId}/metrics`, {
      batchId,
      clientId,
      events,
    });

    return response.data;
  };

  // Send two new metrics
  const handleSend = async () => {
    try {
      setLoading(true);
      setMessage("");

      const batchId = crypto.randomUUID();
      const baseSequence = batchNumber * 2;

      const events: MetricInput[] = [
        {
          eventId: crypto.randomUUID(),
          sequence: baseSequence + 1,
          name: "accuracy",
          value: Number((0.90 + Math.random() * 0.1).toFixed(4)),
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

      const result = await sendBatch(batchId, events);

      setMessage(
        `Success! ${result.data.acceptedCount} metrics accepted.`
      );

      setBatchNumber((previous) => previous + 1);
    } catch (error: any) {
      console.error("Send metrics error:", error.response?.data || error);

      setMessage(
        error.response?.data?.message || "Failed to send metrics."
      );
    } finally {
      setLoading(false);
    }
  };

  // Send exactly the same batch twice
  const handleDuplicate = async () => {
    try {
      setLoading(true);
      setMessage("");

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

      // Create payload once and reuse it unchanged.
      const payload = {
        batchId,
        clientId,
        events,
      };

      const first = await api.post(
        `/runs/${runId}/metrics`,
        payload
      );

      const second = await api.post(
        `/runs/${runId}/metrics`,
        payload
      );

      setMessage(
        second.data.data.duplicate
          ? "Success! Duplicate batch detected correctly."
          : `First: ${first.data.data.acceptedCount}, Second: ${second.data.data.acceptedCount}`
      );
    } catch (error: any) {
      console.error("Duplicate test error:", error.response?.data || error);

      setMessage(
        error.response?.data?.message || "Duplicate test failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Metric Simulator
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Send test metrics directly from your browser.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Metrics"}
        </button>

        <button
          onClick={handleDuplicate}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          Test Duplicate Batch
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {message}
        </p>
      )}

      <p className="text-xs text-gray-400">
        Simulator Client: {clientId}
      </p>
    </section>
  );
}
