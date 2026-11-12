
"use client";

import { useState } from "react";
import { api } from "../../lib/axios";

interface CreateRunProps {
  projectId: string;
  onSuccess: () => void;
}

export default function CreateRun({
  projectId,
  onSuccess,
}: CreateRunProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) return;

    try {
      setLoading(true);
      setError("");

      await api.post(`/projects/${projectId}/runs`, {
        name: name.trim(),
      });

      setName("");
      onSuccess();
    } catch (error) {
  console.error("Create run error:", error);

  setError(
    "Failed to create run. Please check your API key and make sure it belongs to this project."
  );
} finally {
  setLoading(false);
}
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Create Run</h2>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter run name"
          className="flex-1 rounded-md border px-3 py-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Run"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
