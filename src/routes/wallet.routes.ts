import express from "express";
import { createManualDeposit, getWalletBalance } from "../controllers/wallet.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

// Manual deposit endpoint (Admin only for testing)
// In production, this would be replaced with blockchain webhook confirmation
router.post("/deposit", authenticate, createManualDeposit);

// Get wallet balance (Authenticated users can check their own balance)
router.get("/balance", authenticate, getWalletBalance);

export default router;

