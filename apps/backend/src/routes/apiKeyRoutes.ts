import { Router } from "express";
import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
} from "../controllers/apiKeyController";

const router = Router();

router.post("/:projectId/api-keys", createApiKey);
router.get("/:projectId/api-keys", getApiKeys);
router.patch("/:projectId/api-keys/:keyId/revoke", revokeApiKey);

export default router;