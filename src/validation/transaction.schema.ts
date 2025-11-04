import { z } from "zod";

export const listTransactionsQuerySchema = z.object({
  type: z.enum(["deposit", "withdrawal", "investment", "profit", "referral"]).optional(),
  status: z.enum(["waiting_payment", "pending", "processing", "confirmed", "completed", "failed", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});


