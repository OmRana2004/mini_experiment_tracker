
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/axios";

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

  const fetchProject = async () => {
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
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return <main className="p-6">Loading project...</main>;
  }

  if (error || !project) {
    return (
      <main className="space-y-4 p-6">
        <p className="text-red-600">
          {error || "Project not found"}
        </p>

        <Link href="/" className="underline">
          Back to Projects
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to Projects
      </Link>

      <section className="space-y-3 rounded-md border p-5">
        <h1 className="text-2xl font-semibold">{project.name}</h1>

        <p className="text-gray-600">
          {project.description || "No description"}
        </p>

        <div className="space-y-1 text-sm text-gray-500">
          <p>Project ID: {project.id}</p>
          <p>
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </section>
    </main>
  );
}
