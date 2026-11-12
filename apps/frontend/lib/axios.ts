
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const url = config.url || "";

  // Check whether request belongs to a project
  const projectMatch = url.match(/\/projects\/([^/?#]+)/);

  let apiKey: string | null = null;

  if (projectMatch) {
    const projectId = projectMatch[1];

    // Use only this project's API key
    apiKey = localStorage.getItem(`apiKey:${projectId}`);
  } else {
    // Use dashboard key for non-project-specific requests
    apiKey = localStorage.getItem("apiKey");
  }

  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});
