import express from "express";
import { createInvestment } from "../controllers/investment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createInvestmentSchema } from "../validation/investment.schema";
const router = express.Router();

router.post("/", authenticate, validateBody(createInvestmentSchema), createInvestment);

export default router;
