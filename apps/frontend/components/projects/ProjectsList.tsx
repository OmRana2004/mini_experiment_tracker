
"use client";

import Link from "next/link";

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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && projects.length === 0 && !error && (
        <p className="text-sm text-gray-500">No projects found.</p>
      )}

      {projects.map((project) => (
        <div key={project.id} className="rounded-md border p-4">
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:underline"
          >
            {project.name}
          </Link>

          <p className="mt-1 text-sm text-gray-500">
            {project.description || "No description"}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            ID: {project.id}
          </p>
        </div>
      ))}
    </section>
  );
}
