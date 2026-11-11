import type { RequestHandler } from "express";

export const projectScope: RequestHandler = (req, res, next) => {
  const requestedProjectId = req.params.projectId;
  const authenticatedProjectId = res.locals.projectId;

  if (authenticatedProjectId !== requestedProjectId) {
    res.status(404).json({
      success: false,
      message: "Project not found",
    });
    return;
  }

  next();
};