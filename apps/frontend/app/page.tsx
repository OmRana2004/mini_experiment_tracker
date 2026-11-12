
"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/axios";

import ApiKeySetup from "../components/api-keys/ApiKeySetup";
import CreateProject from "../components/projects/CreateProject";
import ProjectsList from "../components/projects/ProjectsList";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");
      setProjects(response.data.data);
    } catch (error) {
      console.error("Fetch projects error:", error);
      setError("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const key = localStorage.getItem("apiKey");

    if (key) {
      setApiKey(key);
      setSaved(true);
      fetchProjects();
    }
  }, []);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) return;

    localStorage.setItem("apiKey", trimmedKey);

    setApiKey(trimmedKey);
    setSaved(true);

    fetchProjects();
  };

  const handleRemove = () => {
    localStorage.removeItem("apiKey");

    setApiKey("");
    setSaved(false);
    setProjects([]);
    setError("");
  };

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">
        Experiment Tracker
      </h1>

      <ApiKeySetup
        apiKey={apiKey}
        saved={saved}
        onChange={(value) => {
          setApiKey(value);
          setSaved(false);
        }}
        onSave={handleSave}
        onRemove={handleRemove}
      />

      <CreateProject onSuccess={fetchProjects} />

      <ProjectsList
        projects={projects}
        loading={loading}
        error={error}
        onRefresh={fetchProjects}
      />
    </main>
  );
}
