
import { Router } from "express";
import { streamRunEvents } from "../controllers/streamController";
import { apiKeyAuth } from "../middleware/apiKeyAuth";
import { projectScope } from "../middleware/projectScope";

const router = Router();

router.get(
  "/projects/:projectId/runs/:runId/events",
  apiKeyAuth,
  projectScope,
  streamRunEvents
);

export default router;
