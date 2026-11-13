
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/axios";

import CreateRun from "../../../components/runs/CreateRun";
import RunsList from "../../../components/runs/RunsList";
import ApiKeyManager from "../../../components/api-keys/ApiKeyManager";
import ApiKeySetup from "../../../components/api-keys/ApiKeySetup";

import {
  ArrowLeft,
  FolderKanban,
  CalendarDays,
  KeyRound,
  FlaskConical,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data.data);
    } catch (error) {
      console.error("Fetch project error:", error);
      setError("Failed to fetch project details");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load project-specific API key
  useEffect(() => {
    const savedKey = localStorage.getItem(`apiKey:${projectId}`);

    setApiKey(savedKey || "");
    setSaved(!!savedKey);
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId, fetchProject]);

  const handleSaveApiKey = () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) return;

    localStorage.setItem(`apiKey:${projectId}`, trimmedKey);
    setApiKey(trimmedKey);
    setSaved(true);
  };

  const handleRemoveApiKey = () => {
    localStorage.removeItem(`apiKey:${projectId}`);
    setApiKey("");
    setSaved(false);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-sm text-slate-500">
          <RefreshCw size={16} className="animate-spin text-violet-600" />
          Loading project...
        </div>
      </main>
    );
  }

  // Error
  if (error || !project) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={17} />
            {error || "Project not found"}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <ArrowLeft size={15} />
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">

        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-violet-600"
        >
          <ArrowLeft size={16} />
          All Projects
        </Link>

        {/* Project Header */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FolderKanban size={19} />
              </div>

              <div className="min-w-0">
                <span className="text-xs font-medium text-violet-600">
                  PROJECT WORKSPACE
                </span>

                <h1 className="mt-1 wrap-break-word text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {project.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {project.description || "No description provided"}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <Activity size={13} />
              Active Project
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              Created {formatDate(project.createdAt)}
            </span>

            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FolderKanban size={13} />
              <span className="truncate">ID: {project.id}</span>
            </span>
          </div>
        </section>

        {/* API Key Management */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <KeyRound size={16} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                API Key Management
              </h2>
              <p className="text-xs text-slate-500">
                Generate and manage project credentials.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <ApiKeyManager projectId={projectId} />
          </div>
        </section>

        {/* Project API Key Setup */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <KeyRound size={16} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Workspace Authentication
              </h2>
              <p className="text-xs text-slate-500">
                Save the API key used by this browser.
              </p>
            </div>
          </div>

          <ApiKeySetup
            apiKey={apiKey}
            saved={saved}
            onChange={(value) => {
              setApiKey(value);
              setSaved(false);
            }}
            onSave={handleSaveApiKey}
            onRemove={handleRemoveApiKey}
          />
        </section>

        {/* Create Run */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FlaskConical size={16} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                New Experiment Run
              </h2>
              <p className="text-xs text-slate-500">
                Start tracking a new model experiment.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <CreateRun
              projectId={projectId}
              onSuccess={fetchProject}
            />
          </div>
        </section>

        {/* Runs */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
          <RunsList projectId={projectId} />
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Experiment Tracker · Project Workspace
          </p>
        </footer>

      </div>
    </main>
  );
}
