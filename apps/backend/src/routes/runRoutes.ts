
import { Router } from "express";
import {
  createRun,
  getRuns,
  getRunById,
} from "../controllers/runController";

import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { projectScope } from "../middleware/projectScope";

const router = Router();

router.use("/:projectId/runs", apiKeyAuth, projectScope);

router.post("/:projectId/runs", createRun);
router.get("/:projectId/runs", getRuns);
router.get("/:projectId/runs/:runId", getRunById);

export default router;
