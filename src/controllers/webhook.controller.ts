import { Request, Response } from "express";
import * as webhookService from "../services/webhook.service";

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await webhookService.processPaymentWebhook(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};
