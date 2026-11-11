import { Router } from "express";
import { ingestMetrics } from "../controllers/metricController";
import { apiKeyAuth } from "../middleware/apiKeyAuth";

const router = Router();

router.post("/runs/:runId/metrics", apiKeyAuth, ingestMetrics);

export default router;