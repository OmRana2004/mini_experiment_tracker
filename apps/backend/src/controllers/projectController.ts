
import { prismaClient } from "@repo/db/client";
import { z } from "zod";
import type { RequestHandler } from "express";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const createProject: RequestHandler = async (req, res) => {
  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid project data",
      errors: result.error.issues,
    });
    return;
  }

  const project = await prismaClient.project.create({
    data: {
      name: result.data.name,
      description: result.data.description,
    },
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
};

export const getProjects: RequestHandler = async (_req, res) => {
  try {
    const projects = await prismaClient.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};


export const getProjectById: RequestHandler = async (req, res) => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const project = await prismaClient.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};


const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
});

export const updateProject: RequestHandler = async (req, res) => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    if (!projectId) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const result = updateProjectSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid project data",
        errors: result.error.issues,
      });
      return;
    }

    if (Object.keys(result.data).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const existingProject = await prismaClient.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const updatedProject = await prismaClient.project.update({
      where: { id: projectId },
      data: result.data,
    });

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};


export const deleteProject: RequestHandler = async (req, res) => {
  try {
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    if (!projectId) {
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

    await prismaClient.project.delete({
      where: { id: projectId },
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};


