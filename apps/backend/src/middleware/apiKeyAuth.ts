
import { createHash } from "node:crypto";
import type { RequestHandler } from "express";
import { prismaClient } from "@repo/db/client";

export const apiKeyAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "API key is required",
      });
      return;
    }

    const apiKey = authHeader.slice(7);

    const keyHash = createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const keyRecord = await prismaClient.apiKey.findUnique({
      where: {
        keyHash,
      },
    });

    if (!keyRecord || keyRecord.revokedAt) {
      res.status(401).json({
        success: false,
        message: "Invalid or revoked API key",
      });
      return;
    }

    // Update last usage time
    await prismaClient.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach authenticated project information
    res.locals.projectId = keyRecord.projectId;
    res.locals.apiKeyId = keyRecord.id;

    next();
  } catch (error) {
    console.error("API key authentication error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
