import { Router } from "express";
import {
  ingestMetrics,
  getRunMetrics,
} from "../controllers/metricController";
import { apiKeyAuth } from "../middleware/apiKeyAuth";

const router = Router();

router.post("/runs/:runId/metrics", apiKeyAuth, ingestMetrics);
router.get("/runs/:runId/metrics", apiKeyAuth, getRunMetrics);

export default router;