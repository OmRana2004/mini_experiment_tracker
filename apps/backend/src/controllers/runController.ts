
import type { RequestHandler } from "express";
import { prismaClient } from "@repo/db/client";

export const createRun: RequestHandler = async (req, res) => {
  try {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const { name } = req.body ?? {};

    if (typeof projectId !== "string" || !projectId.trim()) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        message: "Run name is required",
      });
      return;
    }

    const project = await prismaClient.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const run = await prismaClient.run.create({
      data: {
        name: name.trim(),
        projectId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Run created successfully",
      data: {
  ...run,
  nextSequence: run.nextSequence.toString(),
},
    });
  } catch (error) {
    console.error("Create run error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create run",
    });
  }
};


export const getRuns: RequestHandler = async (req, res) => {
  try {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

    if (typeof projectId !== "string" || !projectId.trim()) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const project = await prismaClient.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const runs = await prismaClient.run.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      message: "Runs fetched successfully",
      data: runs.map((run) => ({
        ...run,
        nextSequence: run.nextSequence.toString(),
      })),
    });
  } catch (error) {
    console.error("Get runs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch runs",
    });
  }
};

export const getRunById: RequestHandler = async (req, res) => {
  try {
    const rawProjectId = req.params.projectId;
    const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
    const rawRunId = req.params.runId;
    const runId = Array.isArray(rawRunId) ? rawRunId[0] : rawRunId;

    if (typeof projectId !== "string" || !projectId.trim()) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    if (typeof runId !== "string" || !runId.trim()) {
      res.status(400).json({
        success: false,
        message: "Run ID is required",
      });
      return;
    }

    const run = await prismaClient.run.findFirst({
      where: {
        id: runId,
        projectId,
      },
    });

    if (!run) {
      res.status(404).json({
        success: false,
        message: "Run not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Run fetched successfully",
      data: {
        ...run,
        nextSequence: run.nextSequence.toString(),
      },
    });
  } catch (error) {
    console.error("Get run error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch run",
    });
  }
};

