
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/axios";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Clock,
  Activity,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

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
  const [fetching, setFetching] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const activeKeys = keys.filter((key) => !key.revokedAt).length;
  const revokedKeys = keys.length - activeKeys;

  const fetchKeys = useCallback(async () => {
    try {
      setError("");

      const response = await api.get(
        `/projects/${projectId}/api-keys`
      );

      setKeys(response.data.data);
    } catch (err) {
      console.error("Fetch API keys error:", err);
      setError("Unable to load API keys. Please try again.");
    } finally {
      setFetching(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || loading) return;

    try {
      setLoading(true);
      setError("");
      setGeneratedKey("");

      const response = await api.post(
        `/projects/${projectId}/api-keys`,
        { name: name.trim() }
      );

      setGeneratedKey(response.data.data.key);
      setName("");

      await fetchKeys();
    } catch (err) {
      console.error("Create API key error:", err);
      setError("Failed to create API key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy API key. Please copy it manually.");
    }
  };

  const revokeKey = async (keyId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key? Applications using this key will no longer be able to authenticate."
    );

    if (!confirmed) return;

    try {
      setRevokingId(keyId);
      setError("");

      await api.patch(
        `/projects/${projectId}/api-keys/${keyId}/revoke`
      );

      await fetchKeys();
    } catch (err) {
      console.error("Revoke API key error:", err);
      setError("Failed to revoke API key. Please try again.");
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            API Keys
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage project credentials and access.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchKeys}
          disabled={fetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={fetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-slate-200 py-3">
        <div className="flex items-center gap-2 text-sm">
          <KeyRound size={15} className="text-slate-400" />
          <span className="text-slate-500">Total</span>
          <span className="font-semibold text-slate-900">
            {keys.length}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span className="text-slate-500">Active</span>
          <span className="font-semibold text-emerald-700">
            {activeKeys}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <ShieldAlert size={15} className="text-red-500" />
          <span className="text-slate-500">Revoked</span>
          <span className="font-semibold text-red-600">
            {revokedKeys}
          </span>
        </div>
      </div>

      {/* Create API Key */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Generate API Key
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Create a credential for your application.
          </p>
        </div>

        <form
          onSubmit={createKey}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            id="key-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Production Key"
            maxLength={100}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
          />

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {loading ? "Creating..." : "Create key"}
          </button>
        </form>
      </div>

      {/* Generated Key */}
      {generatedKey && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Check size={16} />
            API key generated successfully
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="min-w-0 flex-1 break-all rounded-md border border-emerald-200 bg-white p-2.5 font-mono text-xs text-slate-700">
              {generatedKey}
            </div>

            <button
              type="button"
              onClick={copyKey}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Save this key securely. The full key won't be available again.
          </div>

          <button
            type="button"
            onClick={() => {
              setGeneratedKey("");
              setCopied(false);
            }}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
        >
          <AlertTriangle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Existing Keys */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Existing Keys
          </h3>
          <span className="text-xs text-slate-500">
            {keys.length} {keys.length === 1 ? "key" : "keys"}
          </span>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
            <KeyRound size={22} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No API keys yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Create your first key to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {keys.map((key) => {
              const isRevoked = Boolean(key.revokedAt);

              return (
                <div
                  key={key.id}
                  className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
                >
                  {/* Key details */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isRevoked
                          ? "bg-red-50 text-red-500"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      <KeyRound size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="wrap-break-word text-sm font-medium text-slate-800">
                          {key.name}
                        </h4>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isRevoked
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isRevoked ? "Revoked" : "Active"}
                        </span>
                      </div>

                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {key.keyPrefix}...
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          Created {formatDate(key.createdAt)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Activity size={12} />
                          Last used {formatDate(key.lastUsedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  {isRevoked ? (
                    <span className="text-xs text-slate-400 sm:shrink-0">
                      Access disabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeKey(key.id)}
                      disabled={revokingId !== null}
                      className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 sm:self-center"
                    >
                      {revokingId === key.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      {revokingId === key.id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
