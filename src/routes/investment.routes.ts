import express from "express";
import { createInvestment } from "../controllers/investment.controller";
import { authenticate } from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", authenticate, createInvestment);

export default router;
