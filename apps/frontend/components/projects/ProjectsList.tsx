
"use client";

import Link from "next/link";
import {
  FolderKanban,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectsListProps {
  projects: Project[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export default function ProjectsList({
  projects,
  loading,
  error,
  onRefresh,
}: ProjectsListProps) {
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Your Projects
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your ML experiments.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Project count */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <span className="text-sm text-slate-500">
          Total projects
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {projects.length}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Initial loading */}
      {loading && projects.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
          <FolderKanban
            size={24}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-3 text-sm font-semibold text-slate-800">
            No projects yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create your first project to start tracking experiments.
          </p>
        </div>
      )}

      {/* Projects list */}
      {projects.length > 0 && (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex min-w-0 items-center gap-3 px-3 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FolderKanban size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-slate-800 group-hover:text-violet-600">
                  {project.name}
                </h3>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {project.description || "No description"}
                </p>
              </div>

              <ArrowUpRight
                size={16}
                className="shrink-0 text-slate-400 transition-colors group-hover:text-violet-600"
              />
            </Link>
          ))}
        </div>
      )}

      {/* Background refresh */}
      {loading && projects.length > 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <RefreshCw size={12} className="animate-spin" />
          Updating projects...
        </p>
      )}
    </section>
  );
}
