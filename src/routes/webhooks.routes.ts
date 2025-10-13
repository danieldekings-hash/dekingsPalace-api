import express from "express";
import { handleWebhook } from "../controllers/webhook.controller";

const router = express.Router();

// Webhook endpoint for payment confirmations
router.post("/payment", handleWebhook);

export default router;
