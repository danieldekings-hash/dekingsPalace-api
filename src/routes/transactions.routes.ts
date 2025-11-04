import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as controller from "../controllers/transaction.controller";
import { listTransactionsQuerySchema } from "../validation/transaction.schema";
import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response";

// Query validator inline to support Zod on req.query
function validateQuery(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json(fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()));
    req.query = parsed.data as any;
    next();
  };
}

const router = express.Router();

router.get("/", authenticate, validateQuery(listTransactionsQuerySchema), controller.list);
router.get("/export", authenticate, validateQuery(listTransactionsQuerySchema), controller.exportCSV);
router.get("/:id", authenticate, controller.get);

export default router;


