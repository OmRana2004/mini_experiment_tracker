
import { prismaClient } from "@repo/db/client";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Experiment Tracker API is running",
  });
});

app.get("/projects", async (_req, res) => {
  try {
    const projects = await prismaClient.project.findMany();

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Failed to fetch projects:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
});

export default app;
