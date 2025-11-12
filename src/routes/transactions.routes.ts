import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import * as controller from "../controllers/transaction.controller";
import { listTransactionsQuerySchema, confirmWithdrawalBodySchema, failWithdrawalBodySchema, adminWithdrawalsQuerySchema } from "../validation/transaction.schema";
import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/response";

// Query validator inline to support Zod on req.query
function validateQuery(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json(fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()));
    }
    // Merge validated data into req.query to avoid assigning to a read-only getter
    Object.assign(req.query as any, parsed.data);
    next();
  };
}

const router = express.Router();

router.get("/", authenticate, validateQuery(listTransactionsQuerySchema), controller.list);
router.get("/export", authenticate, validateQuery(listTransactionsQuerySchema), controller.exportCSV);
router.get("/:id", authenticate, controller.get);

// Admin-only actions
router.get("/admin/withdrawals", authenticate, authorize("admin"), (req, res, next) => {
  const parsed = adminWithdrawalsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json(fail("VALIDATION_ERROR", "Invalid query", parsed.error.flatten()));
  Object.assign(req.query as any, parsed.data);
  next();
}, controller.adminListWithdrawals);
router.post("/:id/confirm", authenticate, authorize("admin"), (req, res, next) => {
  const parsed = confirmWithdrawalBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail("VALIDATION_ERROR", "Invalid body", parsed.error.flatten()));
  Object.assign(req.body as any, parsed.data);
  next();
}, controller.confirmWithdrawal);

router.post("/:id/fail", authenticate, authorize("admin"), (req, res, next) => {
  const parsed = failWithdrawalBodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(fail("VALIDATION_ERROR", "Invalid body", parsed.error.flatten()));
  Object.assign(req.body as any, parsed.data);
  next();
}, controller.failWithdrawal);

export default router;


