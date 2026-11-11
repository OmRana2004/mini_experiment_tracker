
import { prismaClient } from "@repo/db/client";
import { createHash, randomBytes } from "node:crypto";
import type { RequestHandler } from "express";

export const createApiKey: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

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
        message: "API key name is required",
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

    // Generate secret API key
    const secret = `exp_live_${randomBytes(32).toString("hex")}`;

    // Hash the key before storing it
    const keyHash = createHash("sha256")
      .update(secret)
      .digest("hex");

    const apiKey = await prismaClient.apiKey.create({
      data: {
        name: name.trim(),
        keyPrefix: secret.slice(0, 16),
        keyHash,
        projectId,
      },
    });

    res.status(201).json({
      success: true,
      message: "API key created successfully. Save it now; it won't be shown again.",
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: secret,
        keyPrefix: apiKey.keyPrefix,
      },
    });
  } catch (error) {
    console.error("Create API key error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create API key",
    });
  }
};


export const getApiKeys: RequestHandler = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (typeof projectId !== "string" || !projectId.trim()) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    const apiKeys = await prismaClient.apiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error("Get API keys error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch API keys",
    });
  }
};

export const revokeApiKey: RequestHandler = async (req, res) => {
  try {
    const { projectId, keyId } = req.params;

    if (typeof projectId !== "string" || !projectId.trim()) {
      res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
      return;
    }

    if (typeof keyId !== "string" || !keyId.trim()) {
      res.status(400).json({
        success: false,
        message: "API key ID is required",
      });
      return;
    }

    // Check whether this key belongs to this project
    const apiKey = await prismaClient.apiKey.findFirst({
      where: {
        id: keyId,
        projectId,
      },
    });

    if (!apiKey) {
      res.status(404).json({
        success: false,
        message: "API key not found",
      });
      return;
    }

    if (apiKey.revokedAt) {
      res.status(200).json({
        success: true,
        message: "API key is already revoked",
      });
      return;
    }

    await prismaClient.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    console.error("Revoke API key error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to revoke API key",
    });
  }
};
