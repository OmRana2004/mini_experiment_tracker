
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/axios";

import CreateProject from "../components/projects/CreateProject";
import ProjectsList from "../components/projects/ProjectsList";

import {
  Activity,
  FolderKanban,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function Home() {
  const [saved, setSaved] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");
      setProjects(response.data.data);
    } catch (error) {
      console.error("Fetch projects error:", error);
      setError("Unable to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const key = localStorage.getItem("apiKey");

    if (key) {
      setSaved(true);
      fetchProjects();
    }
  }, [fetchProjects]);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Activity size={15} className="text-violet-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                ML Workspace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Experiment Tracker
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track and manage your machine learning experiments.
            </p>
          </div>

          {/* Workspace Status */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
              saved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {saved ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}

            {saved ? "Workspace Connected" : "API Setup Required"}
          </div>
        </header>

        {/* Overview */}
        <section className="mb-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <FolderKanban size={16} />
            </div>

            <div>
              <p className="text-xs text-slate-500">Total Projects</p>
              <p className="text-sm font-semibold text-slate-900">
                {projects.length}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div>
            <p className="text-xs text-slate-500">API Configuration</p>
            <p className={`mt-0.5 text-sm font-semibold ${
              saved ? "text-emerald-600" : "text-amber-600"
            }`}>
              {saved ? "Configured" : "Pending"}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div>
            <p className="text-xs text-slate-500">Workspace</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {saved ? "Ready" : "Waiting for setup"}
            </p>
          </div>
        </section>

        {/* Create Project */}
        <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Plus size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Create a Project
                </h2>
                <p className="text-xs text-slate-500">
                  Start a new ML experiment.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <CreateProject onSuccess={fetchProjects} />
          </div>
        </section>

        {/* Projects */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 sm:p-5">
          <ProjectsList
            projects={projects}
            loading={loading}
            error={error}
            onRefresh={fetchProjects}
          />
        </section>

        {/* Footer */}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-400">
            Experiment Tracker
          </p>

          <p className="text-xs text-slate-400">
            ML Experiment Workspace
          </p>
        </footer>

      </div>
    </main>
  );
}
