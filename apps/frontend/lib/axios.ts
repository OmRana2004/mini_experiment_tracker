
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const url = config.url || "";

  // Find project ID from URLs like:
  // /projects/:projectId
  // /projects/:projectId/runs
  const projectMatch = url.match(
    /\/projects\/([^/?#]+)/
  );

  // Explicit project ID takes priority.
  const explicitProjectId = config.headers["X-Project-Id"] as
    | string
    | undefined;

  const projectId = explicitProjectId || projectMatch?.[1];

  const apiKey = projectId
    ? localStorage.getItem(`apiKey:${projectId}`)
    : localStorage.getItem("apiKey");

  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  } else {
    delete config.headers.Authorization;
  }

  // Remove internal header before sending request.
  if (explicitProjectId) {
    delete config.headers["X-Project-Id"];
  }

  return config;
});
