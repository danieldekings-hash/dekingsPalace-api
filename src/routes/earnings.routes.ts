import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validateQuery, validateBody } from "../middlewares/validation.middleware";
import { listEarningsSchema, withdrawEarningsSchema, dailyBreakdownQuerySchema } from "../validation/earning.schema";
import * as controller from "../controllers/earning.controller";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get earnings summary
router.get("/summary", controller.getEarningsSummary);

// List all earnings with filtering and pagination
router.get("/", validateQuery(listEarningsSchema), controller.listEarnings);

// Withdraw available earnings
router.post("/withdraw", validateBody(withdrawEarningsSchema), controller.withdrawEarnings);

// Get today's income split
router.get("/today", controller.getTodayIncome);

// Get daily breakdown (optional start/end)
router.get("/daily", validateQuery(dailyBreakdownQuerySchema), controller.getDailyBreakdown);

export default router;

