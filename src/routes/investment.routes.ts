import express from "express";
import { createInvestment, listInvestments, getInvestment, patchInvestment, exportInvestments, getInvestmentsSummary } from "../controllers/investment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createInvestmentSchema, listInvestmentsQuerySchema, patchInvestmentSchema, exportInvestmentsQuerySchema } from "../validation/investment.schema";
import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response";
const router = express.Router();

function validateQuery(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()));
    }
    Object.assign(req.query as any, parsed.data);
    next();
  };
}

router.get("/", authenticate, validateQuery(listInvestmentsQuerySchema), listInvestments);
router.get("/summary", authenticate, getInvestmentsSummary);
router.get("/export", authenticate, validateQuery(exportInvestmentsQuerySchema), exportInvestments);
router.post("/", authenticate, validateBody(createInvestmentSchema), createInvestment);
router.get("/:id", authenticate, getInvestment);
router.patch("/:id", authenticate, validateBody(patchInvestmentSchema), patchInvestment);

export default router;
