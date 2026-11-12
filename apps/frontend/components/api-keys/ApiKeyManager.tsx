
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/axios";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface Props {
  projectId: string;
}

export default function ApiKeyManager({ projectId }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const response = await api.get(
        `/projects/${projectId}/api-keys`
      );
      setKeys(response.data.data);
    } catch (err) {
      console.error("Fetch API keys error:", err);
      setError("Failed to fetch API keys");
    }
  }, [projectId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.post(
        `/projects/${projectId}/api-keys`,
        { name }
      );

      setGeneratedKey(response.data.data.key);
      setName("");
      await fetchKeys();
    } catch (err) {
      console.error("Create API key error:", err);
      setError("Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!window.confirm("Are you sure you want to revoke this key?")) {
      return;
    }

    try {
      await api.patch(
        `/projects/${projectId}/api-keys/${keyId}/revoke`
      );
      await fetchKeys();
    } catch (err) {
      console.error("Revoke API key error:", err);
      setError("Failed to revoke API key");
    }
  };

  return (
    <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          API Key Management
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create and manage API keys for this project.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Development Key"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <button
          onClick={createKey}
          disabled={loading || !name.trim()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create API Key"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {generatedKey && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            API key created successfully!
          </p>

          <p className="break-all rounded-md bg-white p-3 font-mono text-xs text-gray-800">
            {generatedKey}
          </p>

          <button
            onClick={() => navigator.clipboard.writeText(generatedKey)}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm text-white"
          >
            Copy API Key
          </button>

          <p className="text-xs text-green-800">
            Save this key now. It won't be shown again.
          </p>

          <button
            onClick={() => setGeneratedKey("")}
            className="text-xs text-green-800 underline"
          >
            Close
          </button>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Existing API Keys ({keys.length})
        </h3>

        {keys.length === 0 ? (
          <p className="text-sm text-gray-500">
            No API keys created yet.
          </p>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {key.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {key.keyPrefix}...
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium ${
                    key.revokedAt
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {key.revokedAt ? "Revoked" : "Active"}
                </span>

                {!key.revokedAt && (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
