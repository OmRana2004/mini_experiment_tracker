
import express from "express";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes";
import apiKeyRoutes from "./routes/apiKeyRoutes";
import runRoutes from "./routes/runRoutes";
import metricRoutes from "./routes/metricRoutes";
import streamRoutes from "./routes/streamRoutes";

import { apiKeyAuth } from "./middleware/apiKeyAuth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Experiment Tracker API is running",
  });
});

app.get("/api/test-auth", apiKeyAuth, (_req, res) => {
  res.json({
    success: true,
    message: "API key verified successfully",
    projectId: res.locals.projectId,
  });
});

app.use("/api/projects", projectRoutes);
app.use("/api/projects", apiKeyRoutes);
app.use("/api/projects", runRoutes);
app.use("/api", metricRoutes);
app.use("/api", streamRoutes);

export default app;
